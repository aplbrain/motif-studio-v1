import React from "react";
import "./App.css";

import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";

import { MotifStudio } from "./MotifStudio";
import { ToastContainer } from "react-toastify";

function App() {
    return (
        <>
            <MotifStudio />
            <ToastContainer />
        </>
    );
}

export default App;
