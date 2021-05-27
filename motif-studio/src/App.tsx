import React, { useState } from "react";
import "./App.css";

import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";

import { MotifStudio } from "./MotifStudio";
import { ToastContainer } from "react-toastify";
import { Dropdown, Nav, Navbar } from "react-bootstrap";

function App() {
    let [view, setView] = useState("Build");
    return (
        <>
            <Navbar bg="primary" variant="dark">
                <Nav className="mr-auto ">
                    <div className="d-flex">
                        <Dropdown>
                            <Dropdown.Toggle
                                as={Nav.Link}
                                active
                                id="dropdown-basic"
                            >
                                File
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                <Dropdown.Item>Open</Dropdown.Item>
                                <Dropdown.Item>Save</Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item>Share</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                        <Nav.Link active onClick={() => setView("Build")}>
                            Build
                        </Nav.Link>
                        <Nav.Link active onClick={() => setView("Run")}>
                            Run
                        </Nav.Link>
                    </div>
                </Nav>
                <Navbar.Brand href="#home">Motif Studio</Navbar.Brand>
            </Navbar>
            <MotifStudio requestedView={view} />
            <ToastContainer />
        </>
    );
}

export default App;
