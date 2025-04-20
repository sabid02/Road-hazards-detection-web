import React from "react";
import MyMapComponent from "./components/MyMapComponent";
import Upload from "./components/Upload";
import Camera from "./components/Camera";

const App = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 px-4 py-6 md:px-8">
      <header className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-800 drop-shadow-sm">
          🚧 Road Hazards Tracker
        </h1>
        <p className="mt-3 text-gray-700 text-md md:text-lg font-medium max-w-xl mx-auto">
          Capture, upload, and locate potholes, cracks, and open manholes around
          your area.
        </p>
      </header>

      <main className="flex flex-col items-center gap-12">
        {/* Upload & Camera Section */}
        <section className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-8 border border-blue-100">
          <h2 className="text-2xl font-semibold text-blue-700 text-center">
            📸 Capture or Upload Evidence
          </h2>
          <Camera />
          <Upload />
        </section>

        {/* Map Section */}
        <section className="w-full max-w-6xl bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-blue-100">
          <h2 className="text-2xl font-semibold text-blue-700 mb-4 text-center">
            🗺️ View Reported Hazards
          </h2>
          <MyMapComponent />
        </section>
      </main>
    </div>
  );
};

export default App;
