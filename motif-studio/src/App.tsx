import React, { useRef, useState } from "react";
import "./App.css";

import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";

import { MotifStudio } from "./MotifStudio";
import { toast, ToastContainer } from "react-toastify";
import { Button, Dropdown, FormControl, InputGroup, ListGroup, Modal, Nav, Navbar } from "react-bootstrap";
import { LocalStorageMotifStore } from "./store";

import { BiLinkExternal } from "react-icons/bi";

function App() {
    let [view, setView] = useState("Run");
    let studio = useRef(null);
    let [saveModalVisible, setSaveModalVisible] = useState(false);
    let [openModalVisible, setOpenModalVisible] = useState(false);
    let [savingMotifName, setSavingMotifName] = useState("");

    let db = new LocalStorageMotifStore();

    // @ts-ignore
    let motifText = studio?.current?.state?.motifText;

    let savedMotifs = Object.values(db.list()).sort((left, right) =>
        new Date(left.savedDate).toISOString().localeCompare(new Date(right.savedDate).toISOString())
    );

    let handleSave = () => {
        db.save(savingMotifName, {
            name: savingMotifName,
            motifText,
            savedDate: new Date(),
        });
        setSaveModalVisible(false);
        toast.success(`Saved '${savingMotifName}'.`);
    };

    let handleLoad = () => {
        let motif = db.load(savingMotifName);
        if (!motif) {
            toast.error(`Couldn't load motif ${savingMotifName}.`);
            return;
        }
        setOpenModalVisible(false);
        if (studio.current) {
            // @ts-ignore
            studio.current.setState({ motifText: motif.motifText });
            // @ts-ignore
            window.setTimeout(studio.current.updateMotifJSON, 100);
        }
        toast.success(`Loaded '${savingMotifName}'.`);
    };
    let handleDelete = (name: string) => {
        db.delete(name);
        toast.success(`Deleted '${savingMotifName}'.`);
    };

    let savedMotifsListGroup = (
        <ListGroup>
            {savedMotifs.map((motif) => (
                <ListGroup.Item key={motif.name} onClick={(ev) => setSavingMotifName(motif.name)}>
                    {motif.name}{" "}
                    <div className="float-right" style={{ display: "inline-block" }}>
                        {motif.savedDate.toLocaleString()}{" "}
                        <Button onClick={() => handleDelete(motif.name)} variant="outline-danger" size="sm">
                            ×
                        </Button>
                    </div>
                </ListGroup.Item>
            ))}
        </ListGroup>
    );

    let saveModal = (
        <>
            <Modal show={saveModalVisible} onHide={() => setSaveModalVisible(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Save this motif</Modal.Title>
                </Modal.Header>

                <Modal.Body>{savedMotifsListGroup}</Modal.Body>

                <Modal.Footer>
                    <InputGroup className="mb-3">
                        <FormControl
                            placeholder="Filename"
                            aria-label="Filename"
                            onChange={(ev) => setSavingMotifName(ev.target.value)}
                            value={savingMotifName}
                        />
                        <InputGroup.Append>
                            <Button onClick={handleSave} variant="primary">
                                Save
                            </Button>
                        </InputGroup.Append>
                    </InputGroup>
                </Modal.Footer>
            </Modal>
        </>
    );

    let openModal = (
        <>
            <Modal show={openModalVisible} onHide={() => setOpenModalVisible(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Load a motif</Modal.Title>
                </Modal.Header>

                <Modal.Body>{savedMotifsListGroup}</Modal.Body>

                <Modal.Footer>
                    <InputGroup className="mb-3">
                        <FormControl
                            placeholder="Filename"
                            aria-label="Filename"
                            onChange={(ev) => setSavingMotifName(ev.target.value)}
                            value={savingMotifName}
                        />
                        <InputGroup.Append>
                            <Button onClick={handleLoad} variant="primary">
                                Open
                            </Button>
                        </InputGroup.Append>
                    </InputGroup>
                </Modal.Footer>
            </Modal>
        </>
    );

    return (
        <>
            {saveModal}
            {openModal}
            <Navbar bg="primary" variant="dark">
                <Nav className="mr-auto ">
                    <div className="d-flex">
                        <Dropdown>
                            <Dropdown.Toggle as={Nav.Link} active id="dropdown-basic">
                                File
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                <Dropdown.Item onClick={() => setOpenModalVisible(true)}>Open</Dropdown.Item>
                                <Dropdown.Item onClick={() => setSaveModalVisible(true)}>Save</Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item tag={"a"} target="_blank" href={"https://github.com/aplbrain/dotmotif"}>
                                    Help &amp; About <BiLinkExternal />
                                </Dropdown.Item>
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
            <MotifStudio requestedView={view} ref={studio} />
            <ToastContainer />
        </>
    );
}

export default App;
