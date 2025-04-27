import React, { useState, useRef, useEffect, useCallback } from "react";

// Move constant outside component to prevent recreation
const CLASS_NAMES = {
  0: "Pothole",
  1: "Crack",
  2: "Open Manhole",
};

const Upload = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [detectionResults, setDetectionResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);

  // Reset states when new file is uploaded
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPEG, PNG)");
      return;
    }

    // Cleanup previous URL
    if (uploadedFile) URL.revokeObjectURL(uploadedFile);

    setUploadedFile(URL.createObjectURL(file));
    setDetectionResults(null);
    setError(null);
  };

  const handleDetection = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const file = fileInputRef.current?.files?.[0];
      if (!file) {
        throw new Error("Please select an image first");
      }

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

    // Add this color palette above the component
    const CLASS_COLORS = {
      0: "#FF3B30", // Pothole - Red
      1: "#007AFF", // Crack - Blue
      2: "#34C759", // Open Manhole - Green
    };

    // Then modify the draw function in the useEffect:
    const draw = () => {
      const scaleX = img.width / img.naturalWidth;
      const scaleY = img.height / img.naturalHeight;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      detectionResults.detections.forEach((det) => {
        const [x1, y1, x2, y2] = det.bbox;
        const color = CLASS_COLORS[det.class_id] || "#000000"; // Fallback to black
        const label = CLASS_NAMES[det.class_id] || `Class ${det.class_id}`;

        // Draw bounding box
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(
          x1 * scaleX,
          y1 * scaleY,
          (x2 - x1) * scaleX,
          (y2 - y1) * scaleY
        );

        // Draw label background
        ctx.fillStyle = color;
        ctx.font = "14px Arial";
        const textWidth = ctx.measureText(label).width;

        ctx.fillRect(x1 * scaleX - 2, y1 * scaleY - 20, textWidth + 4, 20);

        // Draw label text (keep text color white for contrast)
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
        <div className="flex gap-4 justify-center">
          <label className="inline-flex items-center gap-2 cursor-pointer bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:from-amber-500 hover:to-yellow-600 transition duration-300">
            <span>📁 Upload Image</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
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

        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        {uploadedFile && (
          <div className="relative border rounded-lg overflow-hidden bg-gray-50">
            <img
              ref={imageRef}
              src={uploadedFile}
              alt="Upload preview"
              className="w-full h-auto max-h-96 object-contain"
              onError={() => setError("Failed to load image")}
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
            />
          </div>
        )}

        {detectionResults && (
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">Detection Summary</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex justify-between items-center">
                <span>Total Detections:</span>
                <span className="font-semibold">
                  {detectionResults.detections.length}
                </span>
              </div>
              {Object.entries(CLASS_NAMES).map(([id, name]) => (
                <div key={id} className="flex justify-between items-center">
                  <span>{name}s:</span>
                  <span className="font-semibold">
                    {
                      detectionResults.detections.filter(
                        (d) => d.class_id == id
                      ).length
                    }
                  </span>
                </div>
              ))}
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer text-blue-600">
                Raw Data
              </summary>
              <pre className="mt-2 p-4 bg-gray-50 rounded overflow-auto max-h-96">
                {JSON.stringify(detectionResults, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;
