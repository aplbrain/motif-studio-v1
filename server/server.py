import os
from typing import List
from flask import Flask, jsonify, request
from flask_cors import CORS
import networkx as nx
import pandas as pd
from dotmotif import Motif

from hosts import GrandIsoProvider, NeuPrintProvider, MotifStudioHosts, get_hosts_from_mossdb_prefix

__version__ = "0.1.0"


APP = Flask(__name__)
CORS(APP)

# HOSTS: List[HostProvider] = {
#     "file://kakaria-bivort": lambda: GrandIsoExecutor(
#         graph=nx.read_graphml("graphs/Kakaria-Bivort-PBa.graphml")
#     ),
#     "file://takemura": lambda: ,
# }

print("Loading hosts...")

hosts = [
    GrandIsoProvider(
        graph=nx.read_graphml("graphs/drosophila_medulla_1-no-dotnotation.graphml"),
        uri="file://takemura",
        name="Takemura et al Medulla",
    ),
    *get_hosts_from_mossdb_prefix()
]

if os.getenv("NEUPRINT_APPLICATION_CREDENTIALS"):
    print("Connecting to neuPrint host...")
    hosts.append(NeuPrintProvider(token=os.getenv("NEUPRINT_APPLICATION_CREDENTIALS")))


HOSTS = MotifStudioHosts(hosts)

print(f"Loaded with {len(HOSTS)} host graphs.")

@APP.route("/")
def index():
    return jsonify({"server_version": __version__})


@APP.route("/hosts", methods=["GET"])
def get_hosts():
    return jsonify(
        {
            "hosts": [
                {"uri": host.get_uri(), "name": host.get_name()}
                for host in HOSTS.get_hosts()
            ]
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
        host = HOSTS.get_host(payload["hostID"])
    except:
        return jsonify({"status": "Failed to find specified host graph."}), 500

    results = pd.DataFrame(host.find(motif))

    return jsonify({"motif": json_g, "results": results.to_dict()})


if __name__ == "__main__":
    APP.run(debug=True)
