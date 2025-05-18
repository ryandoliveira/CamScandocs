// src/components/CameraCapture.js
import React, { useRef, useEffect } from "react";

const CameraCapture = ({ onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: "environment" } }, // câmera traseira
          audio: false,
        });
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      } catch (err) {
        console.error("Erro ao acessar a câmera:", err);
        alert("Não foi possível acessar a câmera traseira. Usando a frontal.");
        // fallback para câmera frontal
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        videoRef.current.srcObject = fallbackStream;
        videoRef.current.play();
      }
    };

    startCamera();
  }, []);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/png");

    onCapture(imageData);
  };

  return (
    <div className="camera-container">
      <video ref={videoRef} className="video-preview" />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <button className="btn btn-success mt-3" onClick={handleCapture}>
        Capturar Documento
      </button>
    </div>
  );
};

export default CameraCapture;
