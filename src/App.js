import React, { useEffect, useRef, useState } from "react";
import Tesseract from "tesseract.js";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph } from "docx";

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
      window.cv.onRuntimeInitialized = () => {
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

  // Capturar imagem do vídeo
  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = 1024;
      canvas.height = 768;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("Contexto 2D do canvas não disponível");
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
      setImageData(dataUrl);
    }
  };

  // Função para auto recortar com OpenCV
  const autoCrop = () => {
    if (!cvReady) {
      alert("OpenCV.js ainda não está pronto.");
      return;
    }
  
    const canvas = canvasRef.current;
    if (!canvas) return;
  
    try {
      const src = cv.imread(canvas);
      let gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
      cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);
      let edges = new cv.Mat();
      cv.Canny(gray, edges, 75, 200);
  
      // Encontrar contornos
      let contours = new cv.MatVector();
      let hierarchy = new cv.Mat();
      cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  
      let biggest = null;
      let maxArea = 0;
  
      for (let i = 0; i < contours.size(); i++) {
        const cnt = contours.get(i);
        const peri = cv.arcLength(cnt, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(cnt, approx, 0.02 * peri, true);
  
        if (approx.rows === 4) {
          const area = cv.contourArea(cnt);
          if (area > maxArea) {
            biggest = approx;
            maxArea = area;
          }
        }
      }
  
      if (biggest) {
        const srcCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [
          biggest.data32F[0], biggest.data32F[1],
          biggest.data32F[2], biggest.data32F[3],
          biggest.data32F[4], biggest.data32F[5],
          biggest.data32F[6], biggest.data32F[7],
        ]);
  
        const dstCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [
          0, 0,
          800, 0,
          800, 1000,
          0, 1000,
        ]);
  
        const M = cv.getPerspectiveTransform(srcCoords, dstCoords);
        const dst = new cv.Mat();
        cv.warpPerspective(src, dst, M, new cv.Size(800, 1000));
  
        cv.imshow(canvas, dst);
  
        // Liberação de memória
        gray.delete(); edges.delete(); contours.delete(); hierarchy.delete();
        biggest.delete(); srcCoords.delete(); dstCoords.delete(); M.delete(); src.delete(); dst.delete();
      } else {
        alert("Nenhum documento detectado.");
      }
    } catch (err) {
      console.error("Erro no auto recorte:", err);
    }
  };

  const preprocessForOCR = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const src = cv.imread(canvas);
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
    cv.adaptiveThreshold(
      src, src, 255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY,
      11, 2
    );
    cv.imshow(canvas, src);
    src.delete();
  };
  
  
  // Extrair texto com OCR
  const extractText = async () => {
    setLoadingOCR(true);
    try {
      preprocessForOCR(); // chama o pré-processamento aqui
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
    if (!canvas) return;

    if (format === "pdf") {
      const pdf = new jsPDF();
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      pdf.addImage(imgData, "JPEG", 10, 10, 190, 130);
      pdf.save("documento.pdf");
    } else {
      if (canvas.toBlob) {
        canvas.toBlob((blob) => {
          if (blob) saveAs(blob, `documento.${format}`);
        }, `image/${format}`);
      } else {
        alert("Seu navegador não suporta salvar arquivos neste formato.");
      }
    }
  };

  // Salvar texto em TXT
  const saveTextAsTXT = () => {
    const blob = new Blob([extractedText], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "documento.txt");
  };

  // Salvar texto em PDF
  const saveTextAsPDF = () => {
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    pdf.setFillColor(255, 255, 255); // fundo branco
    pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), "F");
  
    pdf.setFontSize(14);
    const lines = pdf.splitTextToSize(extractedText, 500);
    pdf.text(lines, 40, 60);
    pdf.save("documento_texto.pdf");
  };
  

  // Salvar texto em DOCX
  const saveTextAsDOCX = () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [new Paragraph(extractedText)],
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, "documento.docx");
    });
  };

  return (
    <div className="container">
      <h1 className="mb-4">📄 Scanner de Documentos</h1>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        width="100%"
        height="auto"
        style={{ borderRadius: "8px", border: "1px solid #ccc" }}
      />

      <div className="my-3 d-flex flex-wrap gap-2">
        <button className="btn btn-success" onClick={captureImage}>
          📷 Capturar Foto
        </button>
        <button className="btn btn-warning" onClick={autoCrop} disabled={!cvReady || !imageData}>
          ✂️ Auto Recorte (IA)
        </button>

        <button className="btn btn-primary" onClick={extractText}>
          🧠 Reconhecer Texto (OCR)
        </button>
      </div>

      <canvas
        id="canvas"
        ref={canvasRef}
        className="mb-3"
        style={{ width: "100%", maxWidth: "1024px", border: "1px solid #ddd", borderRadius: "4px" }}
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
