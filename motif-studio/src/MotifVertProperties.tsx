import React from "react";
import { Badge, ListGroup } from "react-bootstrap";

export const MotifVertProperties = ({ graph, error }: { graph: any; error?: string[] }) => {
    // Render properties of the motif vertices.
    if (!graph) {
        return null;
    }
    if ((error || []).length) {
        return <div>{JSON.stringify(error)}</div>;
    }
    return (
        <div>
            <div>
                <h3>Node Constraints</h3>
                {(graph.nodes || []).map((node: any) =>
                    Object.keys(node.constraints || {}).length ? (
                        <div>
                            <h4>
                                <Badge variant="dark" pill>
                                    {node.id}
                                </Badge>
                            </h4>
                            <ListGroup>
                                {Object.keys(node.constraints || {}).map((c: any) => {
                                    return Object.keys(node.constraints[c]).map((k: any) =>
                                        node.constraints[c][k].map((v: any) => (
                                            <ListGroup.Item key={`${c}-${k}-${v}`}>
                                                <code>{c}</code>
                                                <span style={{ marginLeft: "1em" }}></span>
                                                <code>{k}</code>
                                                <span style={{ marginLeft: "1em" }}></span>
                                                <code>{v}</code>
                                            </ListGroup.Item>
                                        ))
                                    );
                                })}
                            </ListGroup>
                        </div>
                    ) : null
                )}
            </div>
            <hr />
            <div>
                <h3>Edge Constraints</h3>
                {(graph.links || []).map((link: any) =>
                    Object.keys(link.constraints || {}).length ? (
                        <div>
                            <h4>
                                <Badge variant="dark">
                                    {link.source}→{link.target}
                                </Badge>
                            </h4>
                            <ListGroup>
                                {Object.keys(link.constraints || {}).map((c: any) => {
                                    return Object.keys(link.constraints[c]).map((k: any) =>
                                        link.constraints[c][k].map((v: any) => (
                                            <ListGroup.Item key={`${c}-${k}-${v}`}>
                                                <code>{c}</code>
                                                <span style={{ marginLeft: "1em" }}></span>
                                                <code>{k}</code>
                                                <span style={{ marginLeft: "1em" }}></span>
                                                <code>{v}</code>
                                            </ListGroup.Item>
                                        ))
                                    );
                                })}
                            </ListGroup>
                        </div>
                    ) : null
                )}
            </div>
        </div>
    );
};
