import React, { Component } from "react";
import "./App.css";
import _ from "lodash";

import AceEditor from "react-ace";
import "ace-builds/src-noconflict/theme-tomorrow";
import customDotMotifMode from "./dotmotif";

import "bootstrap/dist/css/bootstrap.min.css";

import Graph from "react-graph-vis";
import { Col, Form, Row } from "react-bootstrap";

const Config = {
    api: {
        throttleMs: 1000,
        baseURL: "http://localhost:5000",
    },
};

class MotifStudio extends Component<{}, { motifText: string; motifJSON: any }> {
    constructor(props: {}) {
        super(props);
        this.state = {
            motifText: "",
            motifJSON: undefined,
        };
        this.handleInputChanged = this.handleInputChanged.bind(this);
        this.updateMotifJSON = _.throttle(
            this.updateMotifJSON.bind(this),
            Config.api.throttleMs
        );
    }

    updateMotifJSON() {
        fetch(Config.api.baseURL + "/parse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ motif: this.state.motifText }),
        })
            .then((res) => res.json())
            .then((motifParseResponse) => {
                console.log(motifParseResponse);
                this.setState({ motifJSON: motifParseResponse.motif });
            });
    }

    handleInputChanged(ev: string) {
        this.setState({ motifText: ev });
        this.updateMotifJSON();
    }

    // componentDidMount() {
    //     const customMode = new customDotMotifMode();
    //     this.refs.aceEditor.editor.getSession().setMode(customMode);
    // }

    render() {
        return (
            <Row>
                <Col>
                    <AceEditor
                        // mode="java"
                        mode={customDotMotifMode}
                        theme="tomorrow"
                        onChange={(e) => this.handleInputChanged(e)}
                        name="funEditorYay"
                        style={{ height: "100vh" }}
                        fontSize={14}
                        setOptions={{
                            enableBasicAutocompletion: true,
                            enableLiveAutocompletion: true,
                            tabSize: 4,
                        }}
                        // editorProps={{ $blockScrolling: true }}
                    />
                    ,
                    {/* <Form.Control
                        as="textarea"
                        style={{ fontFamily: "monospace" }}
                        rows={40}
                        value={this.state.motifText}
                        onChange={}
                    /> */}
                </Col>
                <Col>
                    <MotifVisualizer graph={this.state.motifJSON} />
                </Col>
            </Row>
        );
    }
}

const MotifVisualizer = (props: { graph: any }) => {
    let unique = `${Math.random()}`;
    if (!props.graph) {
        return null;
    }
    let nodes = props.graph["nodes"].map((node: { id: any }) => {
        return { id: unique + node.id, label: node.id };
    });

    // More styling/options: https://visjs.github.io/vis-network/docs/network/edges.html
    let edges = props.graph["links"].map(
        (link: { source: any; target: any; exists: boolean }) => {
            return {
                from: unique + link.source,
                to: unique + link.target,
                color: link.exists ? "black" : "red",
                dashes: link.exists ? false : true,
                width: 4,
                smooth: true,
            };
        }
    );

    let graph = { nodes, edges };
    return (
        <div style={{ width: "100%", height: "100%" }}>
            <Graph
                key={unique}
                graph={graph}
                // options={options}
                // events={events}
                // style={style}
                // getNetwork={this.getNetwork}
                // getEdges={this.getEdges}
                // getNodes={this.getNodes}
                // vis={vis => (this.vis = vis)}
            />
        </div>
    );
};

function App() {
    return <MotifStudio />;
}

export default App;
