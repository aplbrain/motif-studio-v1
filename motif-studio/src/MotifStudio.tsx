import React, { Component } from "react";
import _ from "lodash";
import { Col, Row } from "react-bootstrap";
import { ControlledEditor, monaco } from "@monaco-editor/react";
import { Config } from "./Config";
import MotifVisualizer from "./MotifVisualizer";

export class MotifStudio extends Component<
    {},
    { motifText?: string; motifJSON: any }
> {
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
        //  @ts-ignore
        console.log(this.state.valueGetter);
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

    handleInputChanged(ev: { target: { value: string } }, value?: string) {
        this.setState({ motifText: value });
        if (value) {
            window.localStorage.setItem("motifText", value);
            this.updateMotifJSON();
        }
    }

    componentDidMount() {
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
                            [/\b[\>\<\=\!]{1,2}\b/, "op"],
                            [/[\-\~\!][\>\|]/, "edge"],
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
            })
            .catch((error) =>
                console.error(
                    "An error occurred during initialization of Monaco: ",
                    error
                )
            );
    }

    render() {
        let defaultValue =
            this.state.motifText ||
            window.localStorage.getItem("motifText") ||
            "# My Example Motif\n\nNeuron_A -> Neuron_2";
        return (
            <Row>
                <Col>
                    <ControlledEditor
                        height="90vh"
                        language="motiflang"
                        theme="motiftheme"
                        value={defaultValue}
                        onChange={this.handleInputChanged}
                    />
                </Col>
                <Col>
                    <MotifVisualizer graph={this.state.motifJSON} />
                </Col>
            </Row>
        );
    }
}
