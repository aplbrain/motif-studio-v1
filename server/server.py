import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from bson.objectid import ObjectId
from flask_pymongo import PyMongo

from gridfs import GridFS

import networkx as nx
from networkx.readwrite import node_link_data
import pandas as pd
from dotmotif import Motif, GrandIsoExecutor

from hosts import get_hosts_from_manifest_file

__version__ = "0.1.0"
MONGO_URI = "mongodb://mongodb:27017/motifstudio"
MANIFEST_FILE = "./graphs/default-graphs.json"


def cursor_to_dictlist(cursor):
    return [
        {k: (str(v) if k == "_id" else v) for k, v in dict(r).items()} for r in cursor
    ]


def log(*args, **kwargs):
    print(*args, **kwargs, flush=True)


log("Loading hosts...")
hosts = get_hosts_from_manifest_file(MANIFEST_FILE)
log(f"{len(hosts)} hosts loaded from {MANIFEST_FILE}.")


log("Connecting to database...")

APP = Flask(__name__)
APP.config["MONGO_URI"] = MONGO_URI
mongo = PyMongo(APP)
CORS(APP)
mongo.db.hosts.ensure_index("expire", expireAfterSeconds=0)


def provision_database():
    log("Loading hosts...")
    for host in hosts:
        log(f"* Checking {host.get_uri()}...")

        # Don't re-add the graph if it's already there
        if mongo.db.hosts.find_one({"name": host.get_name()}):
            log(f"  {host.get_name()} already in database")
        else:
            with open(host.get_metadata()["location"]["path"], "rb") as gfile:
                file_id = mongo.save_file(host.get_uri(), gfile)
                mongo.db.hosts.insert_one(
                    {
                        "name": host.get_name(),
                        "uri": host.get_uri(),
                        "visibility": "public",
                        "inserted": datetime.datetime.utcnow(),
                        "expire": datetime.datetime.utcnow()
                        + datetime.timedelta(days=9999),
                        "file_id": str(file_id),
                        "metadata": host.get_metadata(),
                    }
                )
                log(f"  Added {host.get_name()} to database.")

    log(f"Loaded with {mongo.db.hosts.count()} host graphs in database.")


provision_database()


@APP.route("/")
def index():
    """
    The API root.

    Returns information about the server.
    """
    return jsonify({"server_version": __version__, "mongo_uri": MONGO_URI})


@APP.route("/hosts", methods=["GET"])
def get_hosts():
    """
    Get a list of all hosts.
    """
    return jsonify(
        {
            "hosts": cursor_to_dictlist(
                mongo.db.hosts.find({"visibility": {"$ne": "private"}})
            )
        }
    )


@APP.route("/parse", methods=["POST"])
def motif_syntax_to_graph():
    payload = request.get_json()
    if "motif" not in payload:
        return jsonify({"status": "No motif provided."}), 500

    # Adding a comment is a clever way of preventing the Motif
    # constructor from looking on disk and doing anything nefarious.
    motif_text = "# Generated in MotifStudio. \n" + payload["motif"]

    try:
        motif = Motif(motif_text)
    except Exception as e:
        return jsonify({"status": "Parse failed", "error": str(e)}), 500
    nx_g = motif.to_nx()
    try:
        for node, constraints in motif.list_node_constraints().items():
            nx_g.nodes[node]["constraints"] = constraints
    except:
        return (
            jsonify(
                {
                    "status": "Parse failed",
                    "error": "Invalid constraint right-hand side.",
                }
            ),
            500,
        )
    json_g = node_link_data(nx_g)

    return jsonify({"motif": json_g, "node_constraints": motif.list_node_constraints()})


@APP.route("/execute", methods=["POST"])
def execute_motif_on_host():
    payload = request.get_json()
    if "motif" not in payload:
        return jsonify({"status": "No motif provided."}), 500
    if "hostID" not in payload:
        return jsonify({"status": "No host graph specified."}), 500

    # Adding a comment is a clever way of preventing the Motif
    # constructor from looking on disk and doing anything nefarious.
    motif_text = "# Generated in MotifStudio. \n" + payload["motif"]

    motif = Motif(
        motif_text,
        exclude_automorphisms=(not payload.get("allowAutomorphisms", False)),
        ignore_direction=payload.get("ignoreDirection", False),
    )

    nx_g = motif.to_nx()
    json_g = node_link_data(nx_g)

    try:
        host_info = mongo.db.hosts.find_one({"uri": payload["hostID"]})
        g = nx.read_graphml(
            GridFS(mongo.db).get(
                ObjectId(host_info["file_id"])
            )
        )
        host = GrandIsoExecutor(graph=g)
    except Exception as e:
        return (
            jsonify(
                {"status": "Failed to find specified host graph.", "error": str(e)}
            ),
            500,
        )

    results = pd.DataFrame(host.find(motif))

    return jsonify({"motif": json_g, "results": results.to_dict(), "metadata": host_info['metadata']})


@APP.route("/hosts/upload/<path:filename>", methods=["POST"])
def upload_host(filename):
    """
    Upload a host graph to the server.
    """
    log(f"Uploading temporary host {filename}...")
    file_id = mongo.save_file(filename, request.files["file"])
    inserted_id = mongo.db.hosts.insert_one(
        {
            "name": filename,
            "file_id": str(file_id),
            "inserted": datetime.datetime.utcnow(),
            "visibility": "private",
            "expire": datetime.datetime.utcnow() + datetime.timedelta(minutes=60),
            "uri": f"upload://{str(file_id)}_{filename}",
        }
    ).inserted_id
    log(f"  Added {filename} to database.")

    return jsonify(
        {
            "status": "OK",
            "inserted": str(inserted_id),
            "uri": f"upload://{str(file_id)}_{filename}",
        }
    )


if __name__ == "__main__":
    APP.run(debug=True)
