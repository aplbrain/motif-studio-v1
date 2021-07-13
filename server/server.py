import glob
from flask import Flask, jsonify, request
from flask_cors import CORS
from bson.objectid import ObjectId
from flask_pymongo import PyMongo

from gridfs import GridFS

import networkx as nx
import pandas as pd
from dotmotif import Motif, GrandIsoExecutor

__version__ = "0.1.0"
MONGO_URI = "mongodb://mongodb:27017/motifstudio"


def cursor_to_dictlist(cursor):
    return [
        {k: (str(v) if k == "_id" else v) for k, v in dict(r).items()} for r in cursor
    ]


def log(*args, **kwargs):
    print(*args, **kwargs, flush=True)


log("Connecting to database...")

APP = Flask(__name__)
APP.config["MONGO_URI"] = MONGO_URI
mongo = PyMongo(APP)
CORS(APP)


def provision_database():
    log("Loading hosts...")

    for graph_file in glob.glob("graphs/*.graphml"):
        log(f"* Checking {graph_file}...")
        # Don't re-add the graph if it's already there
        if mongo.db.hosts.find_one({"name": graph_file.split("/")[-1].split(".")[0]}):
            log(f"  {graph_file} already in database")
        else:

            file_id = mongo.save_file(
                graph_file.split("/")[-1].split(".")[0],
                open(graph_file, "rb"),
            )
            mongo.db.hosts.insert_one(
                {
                    "name": graph_file.split("/")[-1].split(".")[0],
                    "file_id": str(file_id),
                    "uri": f"file://{graph_file}",
                    "visibility": "public",
                }
            )
            log(f"  Added {graph_file} to database.")

    log(f"Loaded with {mongo.db.hosts.count()} host graphs.")


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
    json_g = nx.readwrite.node_link_data(nx_g)

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

    motif = Motif(motif_text)
    nx_g = motif.to_nx()
    json_g = nx.readwrite.node_link_data(nx_g)

    try:
        g = nx.read_graphml(
            GridFS(mongo.db).get(
                ObjectId(mongo.db.hosts.find_one({"uri": payload["hostID"]})["file_id"])
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

    return jsonify({"motif": json_g, "results": results.to_dict()})


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
            "visibility": "private",
            "uri": f"file://{filename}",
        }
    )
    log(f"  Added {filename} to database.")

    return jsonify({"status": "OK", "inserted": str(inserted_id)})


if __name__ == "__main__":
    APP.run(debug=True)
