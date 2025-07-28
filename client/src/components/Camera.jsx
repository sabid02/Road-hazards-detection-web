import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const Camera = () => {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [error, setError] = useState("");
  const [cameraStarted, setCameraStarted] = useState(false);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoURL, setRecordedVideoURL] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [photoLocation, setPhotoLocation] = useState(null);
  const [result, setResult] = useState(null); // 🛠️ Missing state added
  const navigate = useNavigate();

  const startCamera = async () => {
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(userStream);
      setCameraStarted(true);
      setCapturedImage(null);
      setRecordedVideoURL(null);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = userStream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      console.error("Camera error:", err);
      setError(err.message);
    }
  };

  // const stopCamera = () => {
  //   if (stream) {
  //     stream.getTracks().forEach((track) => track.stop());
  //     setStream(null);
  //   }
  //   setCameraStarted(false);
  //   setIsRecording(false);
  //   setRecordedChunks([]);
  // };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("📍 Location:", latitude, longitude);

        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");

        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText(`Lat: ${latitude.toFixed(4)}`, 10, canvas.height - 30);
        ctx.fillText(`Lng: ${longitude.toFixed(4)}`, 10, canvas.height - 10);

        const imageDataURL = canvas.toDataURL("image/png");
        setCapturedImage(imageDataURL);

        setPhotoLocation({ latitude, longitude });
        console.log("✅ Photo captured with location!");
        stopCamera();
      },
      (error) => {
        console.error("❌ Location error:", error);
        alert("Failed to get location. Please allow location access.");
      }
    );
  };

  const startRecording = async () => {
    if (!videoRef.current) {
      console.error("❌ Video element not found");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("📍 Location:", latitude, longitude);

        const canvas = document.createElement("canvas");
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        if (!canvas.width || !canvas.height) {
          console.error(
            "❌ Invalid canvas dimensions:",
            canvas.width,
            canvas.height
          );
          return;
        }

        const ctx = canvas.getContext("2d");

        const drawFrame = () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "white";
          ctx.font = "20px Arial";
          ctx.fillText(`Lat: ${latitude.toFixed(4)}`, 10, canvas.height - 30);
          ctx.fillText(`Lng: ${longitude.toFixed(4)}`, 10, canvas.height - 10);
          requestAnimationFrame(drawFrame);
        };

        drawFrame();

        const canvasStream = canvas.captureStream(25);
        const audioTracks = stream?.getAudioTracks() || [];
        console.log("🎥 Canvas Stream Tracks:", canvasStream.getVideoTracks());
        console.log("🎙️ Audio Tracks:", audioTracks);

        const combinedStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...audioTracks,
        ]);

        let localChunks = [];
        setRecordedChunks([]); // Reset chunks only when starting a new recording
        console.log("🔄 Reset recordedChunks");

        const recorder = new MediaRecorder(combinedStream, {
          mimeType: "video/webm",
        });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          console.log("📼 Data available:", event.data.size, "bytes");
          if (event.data.size > 0) {
            localChunks.push(event.data);
            console.log("✅ Added chunk, total chunks:", localChunks.length);
          } else {
            console.warn("⚠️ Empty chunk received");
          }
        };

        recorder.onstop = () => {
          console.log("🛑 Recorder stopped, chunks:", localChunks.length);
          setRecordedChunks(localChunks); // Update state with chunks
          const blob = new Blob(localChunks, { type: "video/webm" });
          console.log("📹 Blob created, size:", blob.size);
          const videoURL = URL.createObjectURL(blob);
          setRecordedVideoURL(videoURL);

          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
          // Do NOT call stopCamera here to avoid resetting recordedChunks
        };

        recorder.onerror = (event) => {
          console.error("❌ MediaRecorder error:", event.error);
        };

        try {
          recorder.start();
          console.log("🎬 Recording started");
          setIsRecording(true);
        } catch (err) {
          console.error("❌ Failed to start recording:", err);
          alert("Failed to start recording: " + err.message);
        }
      },
      (error) => {
        console.error("❌ Location error:", error);
        alert("Failed to get location. Please allow location access.");
      }
    );
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraStarted(false);
    setIsRecording(false);
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      console.log(
        "🛑 Stopping recording, state:",
        mediaRecorderRef.current.state
      );
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopCamera(); // Call stopCamera here to stop the stream
    } else {
      console.warn("⚠️ No active recorder to stop");
    }
  };

  const detectCapturedPhoto = async () => {
    if (!capturedImage) return;

    try {
      const blob = await (await fetch(capturedImage)).blob();
      const formData = new FormData();
      formData.append("file", blob, "captured_photo.png");

      const response = await fetch("http://localhost:8000/detect", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      console.log("🧠 Detection result (image):", result);
      alert("Detection completed for image!");
    } catch (err) {
      console.error("Detection failed:", err);
      alert("Detection failed.");
    }
  };

  const detectRecordedVideo = async () => {
    console.log("📼 Checking recordedChunks:", recordedChunks.length);
    if (!recordedChunks.length) {
      console.error("❌ No video data available to send");
      alert("No video data available to send. Please record a video first.");
      return;
    }

    try {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      console.log("📹 Video Blob Size:", blob.size, "Type:", blob.type);

      if (blob.size === 0) {
        console.error("❌ Video blob is empty");
        alert("Video blob is empty. Please try recording again.");
        return;
      }

      const formData = new FormData();
      formData.append("file", blob, "recorded_video.webm");

      for (let [key, value] of formData.entries()) {
        console.log(`FormData Entry: ${key}`, value);
      }

      const response = await fetch("http://localhost:8000/detect", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          `Server responded with ${response.status}: ${response.statusText}`
        );
      }

      const resultData = await response.json();
      console.log("🧠 Detection result (video):", resultData);
      setResult(resultData); // Update state with the result
      alert("Detection completed for video!");
    } catch (err) {
      console.error("❌ Detection failed:", err);
      alert(`Detection failed: ${err.message}`);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-100">
      <nav className="w-full bg-yellow-500 shadow-md text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">📷 Camera App</h1>
        <button
          onClick={() => navigate("/")}
          className="bg-black px-4 py-2 rounded hover:bg-gray-600 transition"
        >
          🏠 Home
        </button>
      </nav>

      <div className="max-w-xl mx-auto flex flex-col items-center gap-6 px-4 py-6">
        {!cameraStarted && (
          <div className="text-center">
            <p className="mb-2 text-gray-700">
              Click the button below to start your camera!
            </p>
            <button
              onClick={startCamera}
              className="bg-yellow-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-yellow-600 transition duration-300"
            >
              🎬 Start Camera
            </button>
          </div>
        )}

        {cameraStarted && (
          <div className="w-full flex flex-col items-center">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              src={recordedVideoURL}
              className="w-full max-w-2xl h-[60vh] bg-black object-cover rounded-lg shadow"
            />
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              <button
                onClick={capturePhoto}
                className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition"
              >
                📸 Capture Photo
              </button>
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="bg-yellow-600 text-white px-6 py-3 rounded-md hover:bg-yellow-700 transition"
                >
                  🎥 Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="bg-yellow-800 text-white px-6 py-3 rounded-md hover:bg-yellow-900 transition"
                >
                  🛑 Stop Recording
                </button>
              )}
              <button
                onClick={stopCamera}
                className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition"
              >
                ❌ Stop Camera
              </button>
            </div>
          </div>
        )}

        <div className="w-full flex flex-col items-center">
          {capturedImage && (
            <>
              <h2 className="text-lg font-semibold mt-4">📷 Captured Photo:</h2>
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full max-w-sm mt-2 rounded shadow"
              />
              <a
                href={capturedImage}
                download="captured_photo.png"
                className="mt-2 text-blue-500 hover:underline"
              >
                ⬇️ Download Image
              </a>
            </>
          )}
        </div>

        <div className="w-full flex flex-col items-center">
          {recordedVideoURL && (
            <>
              <h2 className="text-lg font-semibold mt-4">🎬 Recorded Video:</h2>
              <video
                controls
                src={recordedVideoURL}
                className="w-full max-w-sm mt-2 rounded shadow"
              />
              <a
                href={recordedVideoURL}
                download="recorded_video.webm"
                className="mt-2 text-blue-500 hover:underline"
              >
                ⬇️ Download Video
              </a>
            </>
          )}
        </div>

        {(capturedImage || recordedVideoURL) && (
          <button
            onClick={() => {
              if (capturedImage) {
                detectCapturedPhoto();
              } else if (recordedVideoURL) {
                detectRecordedVideo();
              }
            }}
            // 👈 you can replace with real submit logic
            className="bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 transition mt-4"
          >
            ✅ Submit
          </button>
        )}
        <div className="mt-6 p-4 rounded-2xl shadow-lg bg-white border border-gray-200 max-w-md mx-auto">
          {result ? (
            <div className="space-y-2 text-gray-700">
              <p className="font-semibold">
                <span className="text-blue-600">Message:</span> {result.message}
              </p>
              <p>
                <span className="font-medium text-green-600">Latitude:</span>{" "}
                {result.latitude ?? "N/A"}
              </p>
              <p>
                <span className="font-medium text-red-600">Longitude:</span>{" "}
                {result.longitude ?? "N/A"}
              </p>
            </div>
          ) : (
            <p className="text-center text-gray-500 italic">
              No detection result yet.
            </p>
          )}
        </div>

        {error && <p className="text-red-600 text-sm mt-2">Error: {error}</p>}
      </div>
    </div>
  );
};

export default Camera;
