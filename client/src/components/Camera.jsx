import React, { useRef, useState } from "react";

const Camera = () => {
  const videoRef = useRef(null);
  const [error, setError] = useState("");
  const [cameraStarted, setCameraStarted] = useState(false);
  const [stream, setStream] = useState(null);

  const startCamera = async () => {
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      setStream(userStream);
      setCameraStarted(true);

      // Small delay to ensure <video> is in the DOM
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = userStream;
          videoRef.current.play();
        }
      }, 100); // 100ms usually enough
    } catch (err) {
      console.error("Camera error:", err);
      setError(err.message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraStarted(false);
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-4">
      {/* Start/Stop Button */}
      {!cameraStarted ? (
        <button
          onClick={startCamera}
          className="bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700 transition"
        >
          📷 Start Camera
        </button>
      ) : (
        <button
          onClick={stopCamera}
          className="bg-red-600 text-white px-4 py-2 rounded-md shadow hover:bg-red-700 transition"
        >
          🛑 Stop Camera
        </button>
      )}

      {/* Only show the video if camera has started */}
      {cameraStarted && (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-[400px] bg-black object-cover rounded-lg shadow"
        />
      )}

      {error && <p className="text-red-600 text-sm mt-2">Error: {error}</p>}
    </div>
  );
};

export default Camera;
