import React, { useRef, useState, useEffect } from 'react';
export default function Scanner() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [imageCaptured, setImageCaptured] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        videoRef.current.srcObject = stream;
      } catch (err) {
        console.error('Camera access error:', err);
      }
    })();
  }, []);

  const capture = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    setImageCaptured(canvasRef.current.toDataURL('image/png'));
  };

  return (
    <div className="card bg-dark text-light border-0 shadow my-5 p-4" id="scan">
      <h2 className="card-title text-center mb-4">Document Scanner</h2>
      <div className="ratio ratio-16x9 mb-3" style={{ borderRadius: '0.75rem', overflow: 'hidden' }}>
        <video ref={videoRef} autoPlay playsInline className="w-100 h-100" />
      </div>
      <div className="d-flex justify-content-center gap-3 mb-3">
        <button className="btn btn-success btn-lg animate__animated animate__pulse animate__infinite animate__slow" onClick={capture}>Capture</button>
        <button
          className="btn btn-outline-light btn-lg"
          disabled={!imageCaptured}
          onClick={() => {
            const a = document.createElement('a');
            a.href = imageCaptured;
            a.download = 'scan.png';
            a.click();
          }}
        >Download</button>
      </div>
      <canvas ref={canvasRef} width={640} height={480} style={{ display: 'none' }} />
      {imageCaptured && (
        <div className="text-center">
          <h5 className="text-muted mb-2">Preview</h5>
          <img src={imageCaptured} alt="Captured" className="img-fluid rounded shadow" />
        </div>
      )}
    </div>
  );
}
