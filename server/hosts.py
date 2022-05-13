from abc import ABC, abstractmethod
from typing import List
import json

from dotmotif import Motif, GrandIsoExecutor
from dotmotif.executors.NeuPrintExecutor import NeuPrintExecutor

import networkx as nx


class HostProvider(ABC):

    """
    A class to manage execution of a motif search.
    """

    @abstractmethod
    def get_name(self) -> str:
        ...

    @abstractmethod
    def get_uri(self):
        ...

    @abstractmethod
    def find(self, query):
        ...

    def get_metadata(self) -> dict:
        return {}


class NeuPrintProvider(HostProvider):
    def __init__(
        self,
        host: str = "https://neuprint.janelia.org",
        dataset: str = "hemibrain:v1.1",
        token: str = None,
    ):
        if token is None:
            token = ""
        self._host = host
        self._dataset = dataset
        self._executor = NeuPrintExecutor(host=host, dataset=dataset, token=token)

    def get_name(self) -> str:
        return f"neuPrint {self._dataset}"

    def get_uri(self) -> str:
        return f"neuprint://{self._host}/{self._dataset}"

    def find(self, motif: Motif):
        return self._executor.find(motif)

    def get_metadata(self) -> dict:
        return {
            "host": self._host,
            "dataset": self._dataset,
        }


class GrandIsoProvider(HostProvider):
    def __init__(self, graph: nx.Graph, name: str, uri: str, metadata: dict = None):
        self._executor = GrandIsoExecutor(graph=graph)
        self._name = name
        self._uri = uri
        self._metadata = metadata or {}

    def __repr__(self):
        return f"<GrandIsoProvider ({self._uri})>"

    def get_name(self) -> str:
        return self._name

    def get_uri(self) -> str:
        return self._uri

    def get_metadata(self) -> dict:
        return self._metadata

    def find(self, motif: Motif):
        return self._executor.find(motif)


class MotifStudioHosts:
    def __init__(self, hosts: List[HostProvider]):
        self.hosts = hosts
        self._lookup = {}
        for host in hosts:
            self._lookup[host.get_uri()] = host

    def __len__(self):
        return len(self.hosts)

    def get_host(self, uri: str) -> HostProvider:
        return self._lookup[uri]

    def get_hosts(self):
        return self.hosts


def get_hosts_from_mossdb_prefix(
    prefix: str = "file://graphs/", mossdb_uri: str = "http://mossdb"
) -> List[GrandIsoProvider]:
    """
    Get a list of connectome graphs to search from MossDB.
    """
    from mossdb.client import MossDBClient

    mdb = MossDBClient(mossdb_uri)

    graph_metas = mdb.list_metadata(prefix)
    graphs = []

    for m in graph_metas:
        try:
            gml_text = mdb.get_file(m["name"])
            graphs.append(
                GrandIsoProvider(
                    graph=nx.parse_graphml(gml_text), name=m["name"], uri=m["name"]
                )
            )
        except:
            pass
    return graphs


def _get_file_host_from_json(json_dict: dict) -> GrandIsoProvider:
    """
    Get a host from a JSON dictionary.

    """
    assert (
        "location" in json_dict
    ), f"Hosts loaded from a manifest file must have `location`, but got {json_dict}"
    assert (
        "type" in json_dict["location"]
    ), f"Hosts loaded from a manifest file must have `location.type`, but got {json_dict}"
    assert (
        "path" in json_dict["location"]
    ), f"Hosts loaded from a manifest file must have `location.path`, but got {json_dict}"
    assert (
        json_dict["location"]["type"] == "file"
    ), f"Hosts loaded from a manifest file must have `location.type` == `file`, but got {json_dict}"

    return GrandIsoProvider(
        graph=nx.read_graphml(json_dict["location"]["path"]),
        name=json_dict["name"],
        uri=json_dict["name"],
        metadata=json_dict,
    )


_HOST_TYPE_INSTANTIATORS = {
    "file": _get_file_host_from_json,
}


def get_hosts_from_manifest_file(
    manifest_file: str = "default-graphs.json",
) -> List[HostProvider]:
    """
    Get a list of connectome graphs to search from a manifest file.

    The manifest file should be a JSON file containing a list of
    dictionaries, each with the following keys:

    {
        "name": str,
        "location": {
            "type": str,
            "path": str,
        },
        "website": str,
        "visualization": {
            "vertex_segmentation_channel": str,
            "image_channel": str,
        },
    }
    """
    manifest = {}
    with open(manifest_file, "r") as f:
        manifest = json.load(f)

    graphs = []
    for g in manifest:
        assert (
            "name" in g
        ), f"Hosts loaded from a manifest file must have `name`, but got {g}"
        assert (
            "location" in g
        ), f"Hosts loaded from a manifest file must have `location`, but got {g}"
        assert (
            "type" in g["location"]
        ), f"Hosts loaded from a manifest file must have `location.type`, but got {g}"

        assert (
            g["location"]["type"] in _HOST_TYPE_INSTANTIATORS
        ), f"Hosts loaded from a manifest file must have `location.type` in {_HOST_TYPE_INSTANTIATORS.keys()}, but got {g}"

        graphs.append(_HOST_TYPE_INSTANTIATORS[g["location"]["type"]](g))

    return graphs
