import React, { useEffect, useRef, useState } from "react";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [imageData, setImageData] = useState(null);
  const [format, setFormat] = useState("png");

  // Inicia câmera traseira
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: "environment" } },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Erro ao acessar a câmera:", error);
      }
    }
    startCamera();
  }, []);

  // Captura imagem da câmera
  const captureImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = 1024;
    canvas.height = 768;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL("image/png");
    setImageData(image);
  };

  // Recorte automático - usando OpenCV.js
  const autoCrop = () => {
    const canvas = canvasRef.current;
    const src = cv.imread(canvas);
    const dst = new cv.Mat();
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    cv.GaussianBlur(src, src, new cv.Size(5, 5), 0);
    cv.Canny(src, dst, 75, 200);
    cv.imshow(canvas, dst);
    src.delete(); dst.delete();
  };

  // Salvar como arquivo
  const saveImage = () => {
    const canvas = canvasRef.current;
    if (format === "pdf") {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF();
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      pdf.addImage(imgData, "JPEG", 10, 10, 190, 130);
      pdf.save("documento.pdf");
    } else {
      canvas.toBlob((blob) => {
        saveAs(blob, `documento.${format}`);
      }, `image/${format}`);
    }
  };

  return (
    <div className="container">
      <h1 className="mb-4">📄 Scanner de Documentos</h1>

      <video ref={videoRef} autoPlay playsInline width="100%" height="auto" />

      <div className="my-3">
        <button className="btn btn-success" onClick={captureImage}>
          📷 Capturar Foto
        </button>
        <button className="btn btn-warning" onClick={autoCrop}>
          ✂️ Auto Recorte (IA)
        </button>
      </div>

      <canvas ref={canvasRef} style={{ width: "100%", maxWidth: "600px" }} />

      {imageData && (
        <div className="my-3">
          <label>Formato de exportação:</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="form-select"
          >
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
            <option value="pdf">PDF</option>
          </select>
          <button className="btn btn-primary mt-2" onClick={saveImage}>
            💾 Salvar Arquivo
          </button>
        </div>
      )}

      <footer>Feito com 💻 React + Bootstrap + OpenCV.js + jsPDF</footer>
    </div>
  );
}

export default App;
