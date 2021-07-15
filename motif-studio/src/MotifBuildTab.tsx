import React from "react";
import { Card } from "react-bootstrap";
import MotifVisualizer from "./MotifVisualizer";
import { MotifVertProperties } from "./MotifVertProperties";

export const MotifBuildTab = ({ graph, error }: { graph: any; error?: string[] }): JSX.Element => {
    // The motif build tab UI.
    // This includes the visualization of the motif, as well as analysis of
    // the motif structure for runtime.
    return (
        <div>
            <div className="wrapper" style={{ display: "grid", gridTemplateColumns: "50% auto", gridColumnGap: "1em" }}>
                <Card>
                    <Card.Body>
                        <MotifVisualizer graph={graph} error={error} />
                    </Card.Body>
                </Card>
                <Card>
                    <Card.Body>
                        <MotifVertProperties graph={graph} error={error} />
                    </Card.Body>
                </Card>
            </div>
        </div>
    );
};
