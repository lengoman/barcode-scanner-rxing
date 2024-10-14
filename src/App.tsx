import React, { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { BrowserMultiFormatReader, Exception, Result } from '@zxing/library';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [result, setResult] = useState<string | null>(null);
  const [codeReader, setCodeReader] = useState<BrowserMultiFormatReader | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    setCodeReader(reader);

    return () => {
      if (reader) {
        reader.reset();
      }
    };
  }, []);

  useEffect(() => {
    if (codeReader && videoRef.current && canvasRef.current) {
      const scanBarcode = () => {
        codeReader.decodeFromVideoDevice(undefined, 'video', (result, err) => {
          if (result) {
            setResult(result.getText());
            drawBarcodeRectangle(result);
            setError(null);
          } else {
            clearCanvas();
          }
          if (err && !(err instanceof Exception)) {
            console.error(err);
            setError('An error occurred while scanning. Please try again.');
          }
        });
      };

      scanBarcode();

      return () => {
        codeReader.reset();
      };
    }
  }, [codeReader]);

  const drawBarcodeRectangle = (result: Result) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw rectangle
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 4;

    const { x, y, width, height } = result.getResultPoints().reduce(
      (acc, point) => ({
        x: Math.min(acc.x, point.getX()),
        y: Math.min(acc.y, point.getY()),
        width: Math.max(acc.width, point.getX()),
        height: Math.max(acc.height, point.getY()),
      }),
      { x: Infinity, y: Infinity, width: 0, height: 0 }
    );

    ctx.strokeRect(x, y, width - x, height - y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    clearCanvas();
    if (codeReader) {
      codeReader.reset();
      codeReader.decodeFromVideoDevice(undefined, 'video', (result, err) => {
        if (result) {
          setResult(result.getText());
          drawBarcodeRectangle(result);
          setError(null);
        } else {
          clearCanvas();
        }
        if (err && !(err instanceof Exception)) {
          console.error(err);
          setError('An error occurred while scanning. Please try again.');
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-4">Barcode Reader</h1>
      <div className="relative w-full max-w-md mb-4">
        <video id="video" ref={videoRef} className="w-full rounded-lg shadow-lg" />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
        <div className="absolute top-2 right-2 bg-white rounded-full p-2">
          <Camera className="w-6 h-6 text-gray-600" />
        </div>
      </div>
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center">
          <p className="text-gray-600">Point your camera at a barcode to scan</p>
          {result && (
            <div className="bg-white rounded-lg shadow-md p-2">
              <p className="font-semibold">Scanned: <span className="text-blue-600">{result}</span></p>
            </div>
          )}
        </div>
        {error && (
          <div className="mt-2 p-2 bg-red-100 text-red-700 rounded-lg">
            <p>{error}</p>
          </div>
        )}
        <button
          onClick={handleReset}
          className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Reset Scanner
        </button>
      </div>
    </div>
  );
}

export default App;