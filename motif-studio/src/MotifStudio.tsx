import React, { Component } from "react";
import _ from "lodash";
import { Alert, Button, Card, Col, Form, Row, Table } from "react-bootstrap";
import { ControlledEditor, monaco } from "@monaco-editor/react";
import { Config } from "./Config";
import MotifVisualizer from "./MotifVisualizer";
import { CSVLink } from "react-csv";
import Upload from "rc-upload";

import { FaCloudUploadAlt } from "react-icons/fa";

import { toast } from "react-toastify";

import "./pane-styling.css";

import SplitPane, { Pane } from "react-split-pane";

type RequestParamType = {
    [key: string]: any;
};

const uriWithParam = (baseUrl: string, params: RequestParamType): string => {
    const Url = new URL(baseUrl);
    let urlParams: URLSearchParams = new URLSearchParams(Url.search);
    for (const key in params) {
        if (params[key] !== undefined) {
            urlParams.set(key, params[key]);
        }
    }
    Url.search = urlParams.toString();
    return Url.toString();
};

type _propsType = { motifText?: string; requestedView?: string };

export class MotifStudio extends Component<
    _propsType,
    {
        motifText?: string;
        motifJSON: any;
        motifError?: string;
        rightPaneTab: string;
        loading: boolean;
        results?: any;
        executionDuration: number;
        hosts: Array<any>;
        selectedDataset?: string;
    }
> {
    constructor(props: _propsType) {
        super(props);
        this.state = {
            motifText: props.motifText || "",
            motifJSON: undefined,
            motifError: undefined,
            rightPaneTab: props.requestedView || "Run",
            results: undefined,
            executionDuration: 0,
            loading: false,
            hosts: [],
            selectedDataset: undefined,
        };
        this.handleInputChanged = this.handleInputChanged.bind(this);
        this.setMotifText = this.setMotifText.bind(this);
        this.onDatasetChange = this.onDatasetChange.bind(this);
        this.handlePressExecute = this.handlePressExecute.bind(this);
        this.updateMotifJSON = _.throttle(
            this.updateMotifJSON.bind(this),
            Config.api.throttleMs
        );
    }

    setMotifText(value: string) {
        this.setState({ motifText: value });
        this.updateMotifJSON();
    }

    updateMotifJSON() {
        //  @ts-ignore
        fetch(Config.api.baseURL + "/parse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ motif: this.state.motifText }),
        })
            .then((res) => res.json())
            .then((motifParseResponse) => {
                if (motifParseResponse.error) {
                    this.setState({ motifError: motifParseResponse.error });
                } else {
                    this.setState({ motifError: undefined });
                }

                if (motifParseResponse.motif) {
                    this.setState({ motifJSON: motifParseResponse.motif });
                }
            })
            .catch((res) => {
                toast.error(`Failed to parse motif: ${res}`);
            });
    }

    handleInputChanged(ev: { target: { value: string } }, value?: string) {
        this.setState({ motifText: value });

        if (value) {
            let urlVal = value; //.replace(" ", "%20");
            window.history.replaceState(
                {
                    path: uriWithParam(window.location.toString(), {
                        mS: encodeURIComponent(urlVal),
                    }),
                },
                "Motif Studio",
                uriWithParam(window.location.toString(), {
                    mS: encodeURIComponent(urlVal),
                })
            );
            window.localStorage.setItem("motifText", value);
            this.updateMotifJSON();
        }
    }

    componentDidMount() {
        let keys = window.location.search.slice(1).toString().split("=");
        let urlState: { [name: string]: string } = {};
        for (let i = 0; i < keys.length; i += 2) {
            urlState[keys[i]] = decodeURIComponent(
                decodeURIComponent(keys[i + 1])
            );
        }

        this.setState({ motifText: urlState.mS });

        // Get a list of all valid hosts:
        fetch(Config.api.baseURL + "/hosts")
            .then((res) => res.json())
            .then((res) => {
                this.setState({ hosts: res.hosts });
            })
            .catch((res) => {
                toast.error(
                    `Could not get a list of available host graphs: ${res}`
                );
            });

        // Prepare the code editor.
        monaco
            .init()
            .then((monaco) => {
                // Register a new language
                monaco.languages.register({ id: "motiflang" });

                // Register a tokens provider for the language
                monaco.languages.setMonarchTokensProvider("motiflang", {
                    tokenizer: {
                        root: [
                            [/#.*$/, "comment"],
                            [/\b[><=!]{1,2}\b/, "op"],
                            [/[-~!][>|]/, "edge"],
                            [/\w+/, "entity"],
                            [/\w+\(.*/, "macro"],
                        ],
                    },
                });

                // Define a new theme that contains only rules that match this language
                monaco.editor.defineTheme("motiftheme", {
                    base: "vs",
                    inherit: false,
                    rules: [
                        {
                            token: "op",
                            foreground: "ff0000",
                            fontStyle: "bold",
                        },
                        {
                            token: "edge",
                            foreground: "0066dd",
                            fontStyle: "bold",
                        },
                        { token: "entity", foreground: "008800" },
                        { token: "macro", foreground: "888800" },
                    ],
                });

                this.updateMotifJSON();
            })
            .catch((error) =>
                console.error(
                    "An error occurred during initialization of Monaco: ",
                    error
                )
            );
    }

    handlePressExecute() {
        // @ts-ignore
        let start = new Date() * 1;
        this.setState({ loading: true });
        fetch(Config.api.baseURL + "/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                motif: this.state.motifText,
                hostID: this.state.selectedDataset,
            }),
        })
            .then((res) => res.json())
            .then((motifParseResponse) => {
                // TODO: Maybe rewrite motif in state, as returned?
                // Results is a dict where keys are motif ID and values are a
                // list of host IDs (all of the same length).
                this.setState({
                    motifJSON: motifParseResponse.motif,
                    results: motifParseResponse.results,
                    // @ts-ignore
                    executionDuration: new Date() * 1 - start,
                    loading: false,
                });
            })
            .catch((res) => {
                toast.error(`Motif search failed: ${res}`);
            });
    }

    onDatasetChange(ev: { target: { value: any } }) {
        this.setState({
            selectedDataset: ev.target.value,
        });
    }

    render() {
        let defaultValue =
            this.state.motifText ||
            window.localStorage.getItem("motifText") ||
            "# My Example Motif\n\nNeuron_A -> Neuron_2";

        let awaitingResultsTable = (
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Node ID ...</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>0</td>
                        <td>Results will appear here...</td>
                    </tr>
                </tbody>
            </Table>
        );
        let noResultsTable = (
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Node ID ...</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>0</td>
                        <td>No results found.</td>
                    </tr>
                </tbody>
            </Table>
        );

        let motifVisualizerTab = (
            <div style={{ height: "80vh", padding: "1em" }}>
                <MotifVisualizer
                    graph={this.state.motifJSON}
                    error={this.state.motifError ? [this.state.motifError] : []}
                />
            </div>
        );

        let executionForm = (
            <Card style={{ margin: "1em" }}>
                <Card.Body>
                    <Form.Group controlId="form.dataset">
                        <Form.Label>Choose a Dataset...</Form.Label>
                        <Form.Control
                            onChange={this.onDatasetChange}
                            as="select"
                            defaultValue=""
                            value={this.state.selectedDataset}
                            custom
                        >
                            <option hidden disabled selected value={""}>
                                {" "}
                                No dataset selected...{" "}
                            </option>
                            {this.state.hosts.map((h) => (
                                <option key={h.uri} value={h.uri}>
                                    {h.name}
                                </option>
                            ))}
                        </Form.Control>
                        <Upload
                            action={(file) =>
                                `${Config.api.baseURL}/hosts/upload/${file.name}`
                            }
                            accept={".graphml, .xml"}
                            openFileDialogOnClick={true}
                            onSuccess={(res, file) => {
                                this.setState({
                                    // @ts-ignore
                                    selectedDataset: res.uri,
                                });
                            }}
                            onError={(err) => {
                                toast.error(`Upload failed: ${err}`);
                            }}
                        >
                            <Button
                                block
                                style={{ marginTop: "0.5em" }}
                                variant={"secondary"}
                            >
                                <FaCloudUploadAlt size="1.5em" /> Upload Custom
                                Host Graph
                            </Button>
                        </Upload>
                    </Form.Group>
                    <hr />
                    <Button
                        variant="primary"
                        block
                        onClick={this.handlePressExecute}
                        disabled={
                            !this.state.selectedDataset || !this.state.motifText
                        }
                    >
                        {this.state.loading
                            ? "Running..."
                            : `Run ${
                                  this.state.selectedDataset
                                      ? "on " + this.state.selectedDataset
                                      : ""
                              }`}
                    </Button>
                </Card.Body>
            </Card>
        );

        let resultKeys = this.state.results
            ? Object.keys(this.state.results)
            : [];

        let resourceReadoutTable = (
            <div>
                {this.state.results === undefined ? (
                    awaitingResultsTable
                ) : resultKeys.length === 0 ? (
                    noResultsTable
                ) : (
                    <div>
                        <Alert variant={"primary"}>
                            {
                                Object.keys(
                                    // @ts-ignore
                                    Object.values(this.state.results)[0]
                                ).length
                            }{" "}
                            results in {this.state.executionDuration / 1000}{" "}
                            seconds.{" "}
                            <CSVLink
                                data={_.zip(
                                    ...Object.values(this.state.results).map(
                                        (f) =>
                                            // @ts-ignore
                                            Object.values(f)
                                    )
                                )}
                                headers={resultKeys}
                                filename={"motif-studio-results.csv"}
                            >
                                Download as CSV
                            </CSVLink>
                        </Alert>
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    {resultKeys.map((k) => (
                                        <th key={k}>{k}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {_.zip(
                                    ...resultKeys.map((k) =>
                                        Object.values(this.state.results[k])
                                    )
                                )
                                    .slice(0, 100)
                                    .map((row, i) => (
                                        <tr key={i}>
                                            <td>{i}</td>
                                            {row.map((m) => (
                                                <td
                                                    // @ts-ignore
                                                    key={m}
                                                >
                                                    {/*@ts-ignore*/}
                                                    {m}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                            </tbody>
                        </Table>
                    </div>
                )}
            </div>
        );

        let motifRunTab = (
            <div style={{ height: "80vh", padding: "1em" }}>
                <Row style={{ minHeight: "40vh" }}>
                    <Col>{executionForm}</Col>
                    <Col>
                        <MotifVisualizer graph={this.state.motifJSON} />
                    </Col>
                </Row>
                <Row>
                    <Col
                        style={{
                            overflow: "scroll",
                            maxHeight: "45vh",
                        }}
                    >
                        {resourceReadoutTable}
                    </Col>
                </Row>
            </div>
        );

        return (
            <SplitPane split="vertical" minSize={100} defaultSize={"25%"}>
                <Pane>
                    <ControlledEditor
                        height="80vh"
                        language="motiflang"
                        theme="motiftheme"
                        value={defaultValue}
                        options={{ fontSize: 14 }}
                        onChange={this.handleInputChanged}
                    />
                </Pane>
                <Pane>
                    {this.props.requestedView === "Build"
                        ? motifVisualizerTab
                        : motifRunTab}
                </Pane>
            </SplitPane>
        );
    }
}
