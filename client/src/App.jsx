import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Camera from "./components/Camera";
import MyMapComponent from "./components/MyMapComponent";
import LiveCamera from "./components/LiveCamera";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/camera" element={<Camera />} />
        <Route path="/map" element={<MyMapComponent />} />
        <Route path="/live" element={<LiveCamera />} />
      </Routes>
    </Router>
  );
};

export default App;
