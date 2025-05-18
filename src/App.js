import React, { useEffect, useRef, useState } from "react";
import Tesseract from "tesseract.js";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import * as docx from "docx";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [imageData, setImageData] = useState(null);
  const [format, setFormat] = useState("png");
  const [extractedText, setExtractedText] = useState("");
  const [loadingOCR, setLoadingOCR] = useState(false);
  const [cvReady, setCvReady] = useState(false);

  // Carregar a câmera
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

  // Carregar OpenCV.js e setar cvReady quando estiver pronto
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://docs.opencv.org/4.5.5/opencv.js";
    script.async = true;
    script.onload = () => {
      // Espera o OpenCV ser inicializado
      window.cv['onRuntimeInitialized'] = () => {
        setCvReady(true);
        console.log("OpenCV.js carregado e pronto");
      };
    };
    script.onerror = () => {
      console.error("Falha ao carregar OpenCV.js");
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Captura a imagem do vídeo para o canvas
  const captureImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = 1024;
    canvas.height = 768;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL("image/png");
    setImageData(image);
  };

  // Função para auto recortar com OpenCV
  const autoCrop = () => {
    if (!cvReady) {
      alert("OpenCV.js ainda não está pronto, aguarde alguns segundos.");
      return;
    }

    const canvasElement = canvasRef.current;
    if (!canvasElement) {
      console.error("Canvas não encontrado");
      return;
    }

    try {
      const src = window.cv.imread(canvasElement);
      const dst = new window.cv.Mat();

      window.cv.cvtColor(src, src, window.cv.COLOR_RGBA2GRAY, 0);
      window.cv.GaussianBlur(src, src, new window.cv.Size(5, 5), 0);
      window.cv.Canny(src, dst, 75, 200);

      window.cv.imshow(canvasElement, dst);

      src.delete();
      dst.delete();
    } catch (err) {
      console.error("Erro ao processar imagem com OpenCV:", err);
      alert("Erro ao processar imagem com OpenCV. Veja o console.");
    }
  };

  // Extrair texto com OCR
  const extractText = async () => {
    setLoadingOCR(true);
    try {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      const result = await Tesseract.recognize(dataUrl, "por", {
        logger: (m) => console.log(m),
      });
      setExtractedText(result.data.text);
    } catch (err) {
      console.error("Erro no OCR:", err);
    }
    setLoadingOCR(false);
  };

  // Salvar imagem nos formatos escolhidos
  const saveImage = () => {
    const canvas = canvasRef.current;
    if (format === "pdf") {
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

  // Salvar texto em TXT
  const saveTextAsTXT = () => {
    const blob = new Blob([extractedText], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "documento.txt");
  };

  // Salvar texto em PDF
  const saveTextAsPDF = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(12);
    const lines = pdf.splitTextToSize(extractedText, 180);
    pdf.text(lines, 10, 10);
    pdf.save("documento_texto.pdf");
  };

  // Salvar texto em DOCX
  const saveTextAsDOCX = () => {
    const doc = new docx.Document({
      sections: [
        {
          properties: {},
          children: [new docx.Paragraph(extractedText)],
        },
      ],
    });

    docx.Packer.toBlob(doc).then((blob) => {
      saveAs(blob, "documento.docx");
    });
  };

  return (
    <div className="container">
      <h1 className="mb-4">📄 Scanner de Documentos</h1>

      <video ref={videoRef} autoPlay playsInline width="100%" height="auto" />

      <div className="my-3 d-flex flex-wrap gap-2">
        <button className="btn btn-success" onClick={captureImage}>
          📷 Capturar Foto
        </button>
        <button className="btn btn-warning" onClick={autoCrop} disabled={!cvReady}>
          ✂️ Auto Recorte (IA)
        </button>
        <button className="btn btn-primary" onClick={extractText}>
          🧠 Reconhecer Texto (OCR)
        </button>
      </div>

      <canvas
        id="canvas"
        ref={canvasRef}
        style={{ width: "100%", maxWidth: "600px" }}
        className="mb-3"
      />

      {imageData && (
        <div className="mb-4">
          <label>Formato de exportação da imagem:</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="form-select"
          >
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
            <option value="pdf">PDF</option>
          </select>
          <button className="btn btn-outline-primary mt-2" onClick={saveImage}>
            💾 Salvar Imagem
          </button>
        </div>
      )}

      {loadingOCR && <p>⏳ Extraindo texto...</p>}

      {extractedText && (
        <>
          <h4>📝 Texto Extraído:</h4>
          <textarea
            className="form-control mb-3"
            value={extractedText}
            rows={8}
            readOnly
          />
          <div className="d-flex gap-2 flex-wrap mb-5">
            <button className="btn btn-outline-success" onClick={saveTextAsTXT}>
              📄 Salvar como .TXT
            </button>
            <button className="btn btn-outline-danger" onClick={saveTextAsPDF}>
              📄 Salvar como .PDF (texto)
            </button>
            <button className="btn btn-outline-dark" onClick={saveTextAsDOCX}>
              📄 Salvar como .DOCX
            </button>
          </div>
        </>
      )}

      <footer className="mt-5 text-center">
        Feito com 💻 React + OpenCV.js + Tesseract.js + jsPDF + docx
      </footer>
    </div>
  );
}

export default App;
