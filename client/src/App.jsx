import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Camera from "./components/Camera";
import MyMapComponent from "./components/MyMapComponent";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/camera" element={<Camera />} />
        <Route path="/map" element={<MyMapComponent />} />
      </Routes>
    </Router>
  );
};

export default App;
