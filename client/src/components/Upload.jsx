import React, { useState, useRef, useEffect, useCallback } from "react";

// Move constant outside component to prevent recreation

const CLASS_COLORS = {
  0: "#FF3B30",
  1: "#007AFF",
  2: "#34C759",
};

const CLASS_NAMES = {
  0: "Pothole",
  1: "Crack",
  2: "Open Manhole",
};

const Upload = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [mediaType, setMediaType] = useState("");
  const [detectionResults, setDetectionResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [videoDimensions, setVideoDimensions] = useState({
    width: 0,
    height: 0,
  });

  const handleVideoLoadedMetadata = useCallback((e) => {
    const video = e.target;
    setVideoDimensions({
      width: video.videoWidth,
      height: video.videoHeight,
    });
  }, []);

  // Reset states when new file is uploaded
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setError("Please upload an image or video file (JPEG, PNG, MP4, AVI)");
      return;
    }

    if (uploadedFile) URL.revokeObjectURL(uploadedFile);

    const fileUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video/");

    setFileType(isVideo ? "video" : "image");
    setMediaType(file.type);
    setUploadedFile(fileUrl);
    setDetectionResults(null);
    setError(null);
  };
  const handleDetection = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Access the file from the ref
      const file = fileInputRef.current?.files?.[0];
      console.log("File in handleDetection:", file); // Add debugging log here

      // Check if a file is selected
      if (!file) {
        setError("⚠️ Please select an image first.");
        return;
      }

      // Proceed with the detection logic if file is present
      const formData = new FormData();
      formData.append("file", file);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch("http://localhost:8000/detect", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Detection failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Response:", data);
      setDetectionResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Canvas drawing with proper cleanup
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = imageRef.current;

    if (!ctx || !img || !detectionResults?.detections) return;

    const CLASS_COLORS = {
      0: "#FF3B30", // Pothole
      1: "#007AFF", // Crack
      2: "#34C759", // Open Manhole
    };

    const draw = () => {
      const scaleX = img.width / img.naturalWidth;
      const scaleY = img.height / img.naturalHeight;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      detectionResults.detections.forEach((det) => {
        if (!det || !Array.isArray(det.bbox) || det.bbox.length !== 4) return;

        const [x1, y1, x2, y2] = det.bbox;

        const color = CLASS_COLORS[det.class_id] || "#000000";
        const label = CLASS_NAMES?.[det.class_id] || `Class ${det.class_id}`;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(
          x1 * scaleX,
          y1 * scaleY,
          (x2 - x1) * scaleX,
          (y2 - y1) * scaleY
        );

        ctx.fillStyle = color;
        ctx.font = "14px Arial";
        const textWidth = ctx.measureText(label).width;
        ctx.fillRect(x1 * scaleX - 2, y1 * scaleY - 20, textWidth + 4, 20);

        ctx.fillStyle = "white";
        ctx.fillText(label, x1 * scaleX, y1 * scaleY - 5);
      });
    };

    if (img.complete) {
      draw();
    } else {
      img.addEventListener("load", draw);
      return () => img.removeEventListener("load", draw);
    }
  }, [detectionResults]);

  // Video detection drawing logic
  const drawVideoDetections = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !detectionResults) return;

    const ctx = canvasRef.current.getContext("2d");
    const video = videoRef.current;
    const currentTime = video.currentTime;

    // Use actual video dimensions from state
    const scaleX = video.offsetWidth / videoDimensions.width;
    const scaleY = video.offsetHeight / videoDimensions.height;

    // Clear previous frame
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Find matching detections
    const frameDetections = detectionResults.detections.filter(
      (d) => currentTime >= d.timestamp && currentTime < d.timestamp + 0.033
    );

    // Draw detections
    frameDetections.forEach((det) => {
      const [x1, y1, x2, y2] = det.bbox;

      // Draw bounding box
      ctx.beginPath();
      ctx.strokeStyle = CLASS_COLORS[det.class_id];
      ctx.lineWidth = 2;
      ctx.rect(
        x1 * scaleX,
        y1 * scaleY,
        (x2 - x1) * scaleX,
        (y2 - y1) * scaleY
      );
      ctx.stroke();

      // Draw label
      ctx.fillStyle = CLASS_COLORS[det.class_id];
      const label = CLASS_NAMES[det.class_id];
      ctx.font = "14px Arial";
      const textWidth = ctx.measureText(label).width;

      // Label background
      ctx.fillRect(x1 * scaleX - 2, y1 * scaleY - 20, textWidth + 4, 20);

      // Label text
      ctx.fillStyle = "white";
      ctx.fillText(label, x1 * scaleX, y1 * scaleY - 5);
    });

    animationFrameRef.current = requestAnimationFrame(drawVideoDetections);
  }, [detectionResults, videoDimensions]);

  // Update video element with metadata handler
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener("loadedmetadata", handleVideoLoadedMetadata);
      return () =>
        video.removeEventListener("loadedmetadata", handleVideoLoadedMetadata);
    }
  }, [handleVideoLoadedMetadata]);

  // Handle video play
  useEffect(() => {
    const video = videoRef.current;
    if (fileType === "video" && detectionResults) {
      video.addEventListener("play", () => {
        drawVideoDetections();
      });

      video.addEventListener("pause", () => {
        cancelAnimationFrame(animationFrameRef.current);
      });
    }

    return () => {
      if (video) {
        video.removeEventListener("play", drawVideoDetections);
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [fileType, detectionResults, drawVideoDetections]);

  // Cleanup object URLs
  useEffect(
    () => () => {
      if (uploadedFile) URL.revokeObjectURL(uploadedFile);
    },
    [uploadedFile]
  );

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="flex flex-col gap-4">
        {/* Upload & Detect Buttons */}
        <div className="flex gap-4 justify-center">
          <label className="inline-flex items-center gap-2 cursor-pointer bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:from-amber-500 hover:to-yellow-600 transition duration-300">
            <span>📁 Upload Image/Video</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>

          <button
            onClick={handleDetection}
            className={`inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition duration-300 ${
              loading || !uploadedFile ? "bg-gray-400 cursor-not-allowed" : ""
            }`}
            disabled={loading || !uploadedFile}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
                Processing...
              </>
            ) : (
              "Detect Objects"
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        {/* Image Preview with Canvas Overlay */}

        {/* Media Preview */}
        {uploadedFile && (
          <div className="relative border rounded-lg overflow-hidden bg-gray-50">
            {fileType === "video" ? (
              <>
                <video
                  ref={videoRef}
                  key={uploadedFile}
                  controls
                  className="w-full h-auto max-h-96 object-contain"
                  onPlay={drawVideoDetections}
                  onPause={() =>
                    cancelAnimationFrame(animationFrameRef.current)
                  }
                >
                  <source src={uploadedFile} type={mediaType} />
                  Your browser does not support the video tag.
                </video>
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{
                    width: videoDimensions.width,
                    height: videoDimensions.height,
                  }}
                />
              </>
            ) : (
              <>
                <img
                  ref={imageRef}
                  src={uploadedFile}
                  alt="Upload preview"
                  className="w-full h-auto max-h-96 object-contain"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                />
              </>
            )}
          </div>
        )}
        {/* Detection Results */}
        {detectionResults ? (
          detectionResults.detections?.length > 0 ? (
            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="text-lg font-bold mb-4">Detection Summary</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Total Detections */}
                <div className="flex justify-between items-center p-4 bg-gray-100 rounded-lg shadow-sm">
                  <span className="text-gray-700 font-medium">
                    Total Detections:
                  </span>
                  <span className="text-indigo-600 font-bold text-lg">
                    {detectionResults.detections.length}
                  </span>
                </div>

                {/* Per-Class Detections */}
                {Object.entries(CLASS_NAMES).map(([id, name]) => (
                  <div
                    key={id}
                    className="flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition rounded-lg shadow-sm"
                  >
                    <span className="text-gray-700">{name}s:</span>
                    <span className="text-green-600 font-semibold">
                      {
                        detectionResults.detections.filter(
                          (d) => d.class_id == id
                        ).length
                      }
                    </span>
                  </div>
                ))}
              </div>

              {/* GPS Info */}
              <div className="flex flex-col sm:flex-row sm:justify-between items-center bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 font-semibold p-4 mt-6 rounded-lg shadow-md space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center">
                  <span className="mr-2">🌍 Longitude:</span>
                  <span>{detectionResults.longitude || "N/A"}</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">📍 Latitude:</span>
                  <span>{detectionResults.latitude || "N/A"}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-100 text-red-700 rounded-lg">
              {detectionResults.message || "No detections found"}
            </div>
          )
        ) : null}
      </div>
    </div>
  );
};

export default Upload;
