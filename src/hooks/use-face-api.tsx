
import { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';

interface UseFaceApiProps {
  enabled?: boolean;
}

export function useFaceApi({ enabled = true }: UseFaceApiProps = {}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modelsPath = '/models';

  useEffect(() => {
    if (!enabled) return;

    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath),
          faceapi.nets.faceRecognitionNet.loadFromUri(modelsPath),
          faceapi.nets.faceExpressionNet.loadFromUri(modelsPath)
        ]);
        setIsLoaded(true);
      } catch (err) {
        console.error('Error loading face-api models:', err);
        setError('Failed to load face recognition models');
      }
    };

    loadModels();
  }, [enabled, modelsPath]);

  const detectFaces = async (imageElement: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) => {
    if (!isLoaded) return null;
    
    try {
      return await faceapi.detectAllFaces(
        imageElement, 
        new faceapi.TinyFaceDetectorOptions()
      )
      .withFaceLandmarks()
      .withFaceExpressions()
      .withFaceDescriptors();
    } catch (err) {
      console.error('Error detecting faces:', err);
      return null;
    }
  };

  return { isLoaded, error, detectFaces };
}
