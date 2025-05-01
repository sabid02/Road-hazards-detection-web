import React, { useRef, useEffect, useState, useCallback } from "react";
import Webcam from "react-webcam";

const LiveCamera = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [detections, setDetections] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [location, setLocation] = useState({
    lat: null,
    lng: null,
    error: null,
  });
  const [cameraActive, setCameraActive] = useState(true);
  const [potholeImage, setPotholeImage] = useState(null);

  const videoConstraints = React.useMemo(
    () => ({
      width: 1280,
      height: 720,
      facingMode: "environment",
    }),
    []
  );

  // Load the pothole image
  // useEffect(() => {
  //   const img = new Image();
  //   img.src = "/pothole.jpg"; // Path to pothole image (can be local or URL)
  //   img.onload = () => {
  //     setPotholeImage(img);
  //   };
  // }, []);

  // Draw webcam feed and pothole image overlay
  // const drawOverlay = useCallback(() => {
  //   const canvas = canvasRef.current;
  //   if (!canvas || !webcamRef.current || !potholeImage) return;

  //   const ctx = canvas.getContext("2d");
  //   const video = webcamRef.current.video;

  //   // Draw the webcam feed onto the canvas
  //   ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  //   // Now draw the pothole image as an overlay at a fixed position
  //   const potholeWidth = 200; // Adjust the size of the pothole image
  //   const potholeHeight = 150;
  //   const potholeX = (canvas.width - potholeWidth) / 2; // Position it at the center
  //   const potholeY = (canvas.height - potholeHeight) / 2;

  //   // Draw the pothole image
  //   ctx.drawImage(
  //     potholeImage,
  //     potholeX,
  //     potholeY,
  //     potholeWidth,
  //     potholeHeight
  //   );
  // }, [potholeImage]);

  // Set up a loop to draw every frame
  // useEffect(() => {
  //   const interval = setInterval(drawOverlay, 100); // Draw every 100ms
  //   return () => clearInterval(interval);
  // }, [drawOverlay]);

  const drawDetections = useCallback((detections) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach((detection) => {
      const [x1, y1, x2, y2] = detection.bbox;
      ctx.beginPath();
      ctx.rect(x1, y1, x2 - x1, y2 - y1);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#FF0000";
      ctx.fillStyle = "#FF0000";
      ctx.stroke();
      ctx.font = "18px Arial";
      ctx.fillText(
        `${detection.class_name} (${Math.round(detection.confidence * 100)}%)`,
        x1,
        y1 > 10 ? y1 - 5 : 10
      );
    });
  }, []);

  // Get geolocation when component mounts
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            error: null,
          });
        },
        (error) => {
          setLocation((prev) => ({
            ...prev,
            error: error.message,
          }));
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000,
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setLocation((prev) => ({
        ...prev,
        error: "Geolocation is not supported by this browser",
      }));
    }
  }, []);

  const processFrame = useCallback(async () => {
    if (!webcamRef.current || processing) return;

    setProcessing(true);
    try {
      const imageSrc = webcamRef.current.getScreenshot();

      if (!imageSrc) return;

      const response = await fetch("http://localhost:8000/detect-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageSrc,
          latitude: location.lat,
          longitude: location.lng,
        }),
      });

      if (!response.ok) throw new Error("API request failed");

      const responseData = await response.json();
      console.log("API Response:", responseData);

      const validDetections = (responseData.detections || []).map((d) => ({
        class_name: String(d.class_name || "unknown"),
        confidence: Number(d.confidence) || 0,
        bbox: Array.isArray(d.bbox) ? d.bbox : [0, 0, 0, 0],
      }));

      setDetections(validDetections);
      drawDetections(validDetections);
    } catch (error) {
      console.error("Detection error:", error);
    } finally {
      setProcessing(false);
    }
  }, [drawDetections, processing, location.lat, location.lng]);

  useEffect(() => {
    const interval = setInterval(processFrame, 100);
    return () => clearInterval(interval);
  }, [processFrame]);

  const stopCamera = () => {
    setCameraActive(false);
    // Add any additional cleanup or stopping logic here if needed
  };

  return (
    <div className="relative">
      {cameraActive ? (
        <>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="w-[1080px] h-auto"
            onUserMediaError={(error) => console.error("Camera error:", error)}
          />
          {/* <video
            ref={webcamRef}
            className="w-full h-auto"
            autoPlay
            muted
            loop
            src="/gps1.mp4"
            // This will simulate the webcam feed
          /> */}

          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 pointer-events-none"
            width={videoConstraints.width}
            height={videoConstraints.height}
          />

          {/* LIVE label */}
          <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
            LIVE
          </div>

          {/* Exit Button */}
          <button
            onClick={stopCamera}
            className="absolute top-4 right-4 bg-green-500 text-white px-3 py-2 rounded-full text-xs font-bold hover:bg-red-600 transition"
          >
            Exit
          </button>

          {/* Detection results */}
          <div className="detection-results p-4 bg-black/50 text-white rounded-lg absolute bottom-4 left-4">
            {detections.map((d, i) => (
              <div
                key={`${d.class_name}-${i}-${d.confidence}`}
                className="text-sm"
              >
                <span className="font-semibold">{d.class_name}</span>:
                {Math.round(d.confidence * 100)}% confidence
              </div>
            ))}
            <div className="text-xs font-bold text-gray-300">
              {location.error ? (
                <div className="text-red-400">{location.error}</div>
              ) : (
                <>
                  <div>Lat: {location.lat?.toFixed(6) ?? "Acquiring..."}</div>
                  <div>Lng: {location.lng?.toFixed(6) ?? "Acquiring..."}</div>
                </>
              )}
            </div>
          </div>

          {processing && (
            <div className="processing-overlay absolute top-4 left-18 bg-blue-500 text-white px-3 py-1 rounded-full text-xs">
              Analyzing...
            </div>
          )}
        </>
      ) : (
        <div className="p-6 text-center text-gray-600">
          Camera session ended.
        </div>
      )}
    </div>
  );
};

export default LiveCamera;
