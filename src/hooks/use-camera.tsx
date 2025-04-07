
import { useState, useEffect, useRef } from "react";

export interface UseCameraProps {
  facingMode?: "user" | "environment";
  enabled?: boolean;
  onFrame?: (imageData: ImageData) => void;
}

export function useCamera({ facingMode = "user", enabled = true, onFrame }: UseCameraProps = {}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize camera
  useEffect(() => {
    if (!enabled) return;

    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode }
        });
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setIsReady(true);
          };
        }
      } catch (err) {
        setError("Camera access denied or not available");
        console.error("Camera error:", err);
      }
    };

    setupCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [enabled, facingMode]);

  // Process video frames if onFrame is provided
  useEffect(() => {
    if (!isReady || !onFrame || !videoRef.current || !canvasRef.current) return;

    let animationFrameId: number;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!context) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const processFrame = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        context.drawImage(video, 0, 0);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        onFrame(imageData);
      }
      animationFrameId = requestAnimationFrame(processFrame);
    };

    processFrame();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isReady, onFrame]);

  const takeSnapshot = () => {
    if (!isReady || !videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return null;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    return canvas.toDataURL('image/jpeg');
  };

  return { 
    videoRef, 
    canvasRef, 
    isReady, 
    error, 
    takeSnapshot 
  };
}
