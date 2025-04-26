import React, { useState, useRef, useEffect } from "react";

const Upload = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [detectionResults, setDetectionResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // Reset detection results when uploading a new file
  const handleUploadClick = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(URL.createObjectURL(file));
      setDetectionResults(null); // Reset detection when new file is uploaded
    }
  };

  const handleFileSubmit = async () => {
    if (!uploadedFile) {
      return alert("Please upload a file first.");
    }

    const formData = new FormData();
    const file = document.getElementById("fileInput").files[0];
    formData.append("file", file);

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/detect", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setDetectionResults(data);
      } else {
        console.error("Detection failed:", response.statusText);
      }
    } catch (error) {
      console.error("Error during file upload:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (detectionResults && uploadedFile) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const image = imageRef.current;

      if (!image.complete) {
        image.onload = () => {
          drawCanvas(ctx, image, detectionResults);
        };
      } else {
        drawCanvas(ctx, image, detectionResults);
      }
    }
  }, [detectionResults, uploadedFile]);

  const classNames = {
    0: "Pothole",
    1: "Crack",
    2: "Open Manhole",
  };

  const drawCanvas = (ctx, image, detections) => {
    if (
      !detections ||
      !detections.detections ||
      detections.detections.length === 0
    ) {
      console.log("No detections to display.");
      return; // Early exit if no detections are available
    }

    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;
    const displayedWidth = image.width;
    const displayedHeight = image.height;

    const scaleX = displayedWidth / naturalWidth;
    const scaleY = displayedHeight / naturalHeight;

    ctx.canvas.width = displayedWidth;
    ctx.canvas.height = displayedHeight;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear the canvas before redrawing
    ctx.drawImage(image, 0, 0, displayedWidth, displayedHeight);

    detections.detections.forEach((det) => {
      const [x1, y1, x2, y2] = det.bbox;

      const label = classNames[det.class_id] || `Class ${det.class_id}`;

      ctx.beginPath();
      ctx.rect(
        x1 * scaleX,
        y1 * scaleY,
        (x2 - x1) * scaleX,
        (y2 - y1) * scaleY
      );
      ctx.lineWidth = 3;
      ctx.strokeStyle = "red";
      ctx.stroke();

      ctx.fillStyle = "red";
      ctx.font = "16px Arial";
      ctx.fillText(label, x1 * scaleX, y1 * scaleY - 5);
    });
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 mb-6">
      <div className="flex gap-4">
        <button
          onClick={() => document.getElementById("fileInput").click()}
          className="bg-green-600 text-white px-4 py-2 rounded-md shadow hover:bg-green-700 transition"
        >
          📁 Upload Image/Video
        </button>
        <input
          id="fileInput"
          type="file"
          accept="image/*,video/*"
          style={{ display: "none" }}
          onChange={handleUploadClick}
        />
      </div>

      {/* Uploaded image with canvas */}
      {uploadedFile && (
        <div className="relative rounded-lg overflow-hidden border border-gray-200 shadow mt-4 w-full max-w-lg">
          <img
            ref={imageRef}
            src={uploadedFile}
            alt="Uploaded"
            className="w-full h-auto"
            style={{ height: "400px", objectFit: "contain" }}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>
      )}

      {/* Detect Button */}
      <button
        onClick={handleFileSubmit}
        className="bg-blue-600 text-white px-6 py-2 rounded-md shadow hover:bg-blue-700 transition mt-4"
        disabled={loading}
      >
        {loading ? "Detecting..." : "Detect"}
      </button>

      {/* Detection Result JSON */}
      {detectionResults && (
        <div className="mt-6">
          <h3 className="font-semibold">Detection Results</h3>
          {detectionResults.data && detectionResults.data.length === 0 ? (
            <p>No objects detected in the image.</p>
          ) : (
            <pre>{JSON.stringify(detectionResults, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
};

export default Upload;
