import React from "react";
import Graph from "react-graph-vis";
import ColorHash from "color-hash";

function getColorForNode(node: any) {
    let { id, ...obj } = node;
    return new ColorHash({ lightness: 0.7, saturation: 0.7 }).hex(
        JSON.stringify(obj)
    );
    return "#B8CDF8";
}

const MotifVisualizer = React.memo(
    (props: { graph: any; nodeConstraints?: Array<any> }) => {
        let unique = `${Math.random()}`;
        if (!props.graph) {
            return null;
        }
        let nodes = props.graph["nodes"].map((node: { id: any }) => {
            return {
                id: node.id,
                label: node.id,
                shape: "ellipse",
                shapeProperties: { borderRadius: 1 },
                font: {
                    face: "Arial",
                    color: "#333",
                    highlight: { color: "#ffffff" },
                },
                color: {
                    background: getColorForNode(node),
                    border: "#05668D",
                    hover: {
                        border: "#05668D",
                        background: "#00A896",
                    },
                    highlight: {
                        border: "#05668D",
                        background: "#9D8DF1",
                    },
                },
            };
        });

        // More styling/options: https://visjs.github.io/vis-network/docs/network/edges.html
        let edges = props.graph["links"].map(
            (link: {
                source: any;
                target: any;
                exists: boolean;
                constraints?: any;
            }) => {
                return {
                    from: link.source,
                    to: link.target,
                    color: link.exists ? "black" : "red",
                    dashes: link.exists ? false : true,
                    // label: link.constraints
                    //     ? JSON.stringify(link.constraints)
                    //     : undefined,
                    width: 4,
                    smooth: true,
                    scaling: {
                        min: 5,
                        max: 25,
                    },
                };
            }
        );

        let physics = {
            hierarchicalRepulsion: {
                springLength: 900,
                nodeDistance: 400,
            },
        };

        let graph = { nodes, edges, physics };
        return (
            <div style={{ width: "100%", height: "100%" }}>
                <Graph key={unique} graph={graph} />
            </div>
        );
    }
);

export default MotifVisualizer;
