import React, { useState } from "react";

const Upload = () => {
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleUploadClick = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(URL.createObjectURL(file));
    }
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

      {/* Uploaded image or video preview */}
      {uploadedFile && (
        <div className="rounded-lg overflow-hidden border border-gray-200 shadow mt-4 w-full max-w-lg">
          {uploadedFile.includes("video") ? (
            <video
              src={uploadedFile}
              controls
              className="w-full h-auto"
              style={{ height: "400px" }}
            />
          ) : (
            <img
              src={uploadedFile}
              alt="Uploaded"
              className="w-full h-auto"
              style={{ height: "400px", objectFit: "contain" }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Upload;
