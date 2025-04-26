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
  const [photoLocation, setPhotoLocation] = useState(null); // 🛠️ Missing state added
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

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraStarted(false);
    setIsRecording(false);
    setRecordedChunks([]);
  };

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
    if (!videoRef.current) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        const canvas = document.createElement("canvas");
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

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
        const combinedStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...stream.getAudioTracks(),
        ]);

        let localChunks = [];
        setRecordedChunks([]);
        const recorder = new MediaRecorder(combinedStream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            localChunks.push(event.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(localChunks, { type: "video/webm" });
          const videoURL = URL.createObjectURL(blob);
          setRecordedVideoURL(videoURL);
          setRecordedChunks(localChunks);

          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }

          stopCamera();
        };

        recorder.start();
        setIsRecording(true);
      },
      (error) => {
        console.error("❌ Location error:", error);
        alert("Failed to get location. Please allow location access.");
      }
    );
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
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
            onClick={() => alert("Submitted!")} // 👈 you can replace with real submit logic
            className="bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 transition mt-4"
          >
            ✅ Submit
          </button>
        )}

        {error && <p className="text-red-600 text-sm mt-2">Error: {error}</p>}
      </div>
    </div>
  );
};

export default Camera;
