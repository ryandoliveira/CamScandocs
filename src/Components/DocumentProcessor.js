// src/components/DocumentProcessor.js
import React, { useRef, useState } from 'react';
import { cropDocumentFromCanvas } from '../utils/openCVHelper';
import { extractTextFromImage } from '../utils/ocrHelper';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import * as docx from 'docx';

const DocumentProcessor = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [textPreview, setTextPreview] = useState('');
  const [loading, setLoading] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: 'environment' } }, // câmera traseira
      });
      videoRef.current.srcObject = stream;
    } catch (err) {
      console.error('Erro ao acessar câmera:', err);
    }
  };

  const captureAndProcess = async () => {
    setLoading(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const croppedCanvas = cropDocumentFromCanvas(canvas);
    const dataUrl = croppedCanvas.toDataURL();
    setImagePreview(dataUrl);

    try {
      const extractedText = await extractTextFromImage(dataUrl, 'por');
      setTextPreview(extractedText);
    } catch (err) {
      console.error('Erro ao fazer OCR:', err);
    }

    setLoading(false);
  };

  const downloadAsText = () => {
    const blob = new Blob([textPreview], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'documento.txt');
  };

  const downloadAsPDF = () => {
    const pdf = new jsPDF();
    pdf.text(textPreview, 10, 10);
    pdf.save('documento.pdf');
  };

  const downloadAsDocx = () => {
    const doc = new docx.Document({
      sections: [
        {
          properties: {},
          children: [new docx.Paragraph(textPreview)],
        },
      ],
    });

    docx.Packer.toBlob(doc).then(blob => {
      saveAs(blob, 'documento.docx');
    });
  };

  return (
    <div className="container text-light mt-5">
      <h2 className="mb-3">Digitalizador de Documentos</h2>

      <video
        ref={videoRef}
        autoPlay
        className="rounded shadow"
        style={{ maxWidth: '100%', marginBottom: '1rem' }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="d-flex gap-3 mb-3">
        <button className="btn btn-success" onClick={startCamera}>Abrir Câmera</button>
        <button className="btn btn-warning" onClick={captureAndProcess}>
          {loading ? 'Processando...' : 'Capturar e Processar'}
        </button>
      </div>

      {imagePreview && (
        <>
          <h4>📸 Imagem Recortada:</h4>
          <img src={imagePreview} alt="Imagem Recortada" className="img-fluid rounded shadow mb-3" />
        </>
      )}

      {textPreview && (
        <>
          <h4>📝 Texto Detectado:</h4>
          <textarea
            value={textPreview}
            readOnly
            rows={8}
            className="form-control mb-3"
          />
          <div className="d-flex gap-2">
            <button className="btn btn-outline-light" onClick={downloadAsText}>Salvar como .TXT</button>
            <button className="btn btn-outline-light" onClick={downloadAsPDF}>Salvar como .PDF</button>
            <button className="btn btn-outline-light" onClick={downloadAsDocx}>Salvar como .DOCX</button>
          </div>
        </>
      )}
    </div>
  );
};

export default DocumentProcessor;
