from abc import ABC, abstractmethod
from typing import List

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


class GrandIsoProvider(HostProvider):
    def __init__(self, graph: nx.Graph, name: str, uri: str):
        self._executor = GrandIsoExecutor(graph=graph)
        self._name = name
        self._uri = uri

    def get_name(self) -> str:
        return self._name

    def get_uri(self) -> str:
        return self._uri

    def find(self, motif: Motif):
        return self._executor.find(motif)


class MotifStudioHosts:
    def __init__(self, hosts: List[HostProvider]):
        self.hosts = hosts
        self._lookup = {}
        for host in hosts:
            self._lookup[host.get_uri()] = host

    def get_host(self, uri: str) -> HostProvider:
        return self._lookup[uri]

    def get_hosts(self):
        return self.hosts
