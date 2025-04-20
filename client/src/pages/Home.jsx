import React from "react";

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">
      <header className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-800">
          Road Hazards
        </h1>
        <p className="mt-2 text-gray-600 text-sm md:text-base">
          Capture, upload, and locate potholes, Cracks and Open Manhole around
          your area
        </p>
      </header>

      <main className="flex flex-col items-center gap-6">
        <div className="w-full max-w-2xl">
          <Camera />
          <Upload />
        </div>

        {/* Responsive map container */}
        <div className="w-full max-w-5xl">
          <MyMapComponent />
        </div>
      </main>
    </div>
  );
};

export default Home;
