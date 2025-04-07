
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useCamera } from '@/hooks/use-camera';
import { useFaceApi } from '@/hooks/use-face-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TakeAttendanceProps {
  onBack: () => void;
}

const TakeAttendance: React.FC<TakeAttendanceProps> = ({ onBack }) => {
  const { students, getStudentByUSN, addAttendanceRecord, getCurrentSubject } = useApp();
  const [recognizedStudent, setRecognizedStudent] = useState<string | null>(null);
  const [recognitionStatus, setRecognitionStatus] = useState<'pending' | 'recognized' | 'unrecognized'>('pending');
  const [processingFrame, setProcessingFrame] = useState(false);
  const frameCount = useRef(0);
  const recognitionTimeout = useRef<NodeJS.Timeout | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const { isLoaded: faceApiLoaded, detectFaces } = useFaceApi();
  const { videoRef, canvasRef, isReady: cameraReady } = useCamera({
    enabled: true,
    onFrame: handleVideoFrame
  });

  async function handleVideoFrame(imageData: ImageData) {
    frameCount.current = (frameCount.current + 1) % 15;
    if (frameCount.current !== 0 || processingFrame || !faceApiLoaded || recognitionStatus !== 'pending') {
      return;
    }

    setProcessingFrame(true);
    try {
      if (!videoRef.current) return;
      
      const detections = await detectFaces(videoRef.current);
      
      if (!detections || detections.length === 0) {
        updateBoxPosition(null);
        return;
      }

      const detection = detections[0];
      const box = detection.detection.box;
      updateBoxPosition(box);
      
      const currentFaceDescriptor = detection.descriptor;
      let matchedStudent = null;
      let minDistance = 0.6;
      
      for (const student of students) {
        if (student.faceDescriptor) {
          const distance = calculateFaceDistance(
            Array.from(currentFaceDescriptor), 
            Array.from(student.faceDescriptor)
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            matchedStudent = student.usn;
          }
        }
      }
      
      if (matchedStudent) {
        setRecognizedStudent(matchedStudent);
        setRecognitionStatus('recognized');
        
        recognitionTimeout.current = setTimeout(() => {
          markAttendance(matchedStudent);
        }, 5000);
      } else {
        setRecognitionStatus('unrecognized');
      }
    } catch (error) {
      console.error('Face detection error:', error);
    } finally {
      setProcessingFrame(false);
    }
  }
  
  function calculateFaceDistance(fd1: number[], fd2: number[]): number {
    return Math.sqrt(
      fd1.map((x, i) => Math.pow(x - fd2[i], 2))
        .reduce((a, b) => a + b)
    );
  }
  
  function updateBoxPosition(box: { x: number; y: number; width: number; height: number } | null) {
    if (!boxRef.current || !videoRef.current) return;
    
    const video = videoRef.current;
    const boxElement = boxRef.current;
    
    if (!box) {
      boxElement.style.display = 'none';
      return;
    }
    
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const displayWidth = video.offsetWidth;
    const displayHeight = video.offsetHeight;
    
    const scaleX = displayWidth / videoWidth;
    const scaleY = displayHeight / videoHeight;
    
    boxElement.style.display = 'block';
    boxElement.style.left = `${box.x * scaleX}px`;
    boxElement.style.top = `${box.y * scaleY}px`;
    boxElement.style.width = `${box.width * scaleX}px`;
    boxElement.style.height = `${box.height * scaleY}px`;
  }

  function markAttendance(usn: string) {
    const currentSubject = getCurrentSubject();
    if (!currentSubject) {
      toast({
        title: "No Active Class",
        description: "There is no active class at this time according to the timetable",
        variant: "destructive"
      });
      return;
    }
    
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toLocaleTimeString();
    
    addAttendanceRecord({
      usn,
      subject: currentSubject,
      date,
      time
    });
    
    toast({
      title: "Attendance Marked",
      description: `Successfully marked attendance for ${usn} in ${currentSubject}`,
      variant: "default"
    });
    
    setTimeout(() => {
      setRecognizedStudent(null);
      setRecognitionStatus('pending');
    }, 2000);
  }

  useEffect(() => {
    return () => {
      if (recognitionTimeout.current) {
        clearTimeout(recognitionTimeout.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 max-w-md mx-auto animate-fade-in">
      <h2 className="text-2xl font-semibold mb-4 text-center">Take Attendance</h2>
      
      <Card className="w-full overflow-hidden mb-6">
        <CardContent className="p-1">
          <div className="relative aspect-video bg-black rounded-md overflow-hidden">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            <div 
              ref={boxRef}
              className={`absolute border-2 ${
                recognitionStatus === 'recognized' ? 'border-success' : 
                recognitionStatus === 'unrecognized' ? 'border-destructive' : 
                'border-yellow-400'
              } hidden`}
            />
            
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
            
            {!faceApiLoaded && cameraReady && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-center">
                <p className="text-white text-sm flex items-center justify-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                  Loading face detection...
                </p>
              </div>
            )}
            
            {recognitionStatus === 'recognized' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-30">
                <div className="bg-success/20 p-4 rounded-full mb-3">
                  <Check className="h-8 w-8 text-success" />
                </div>
                <div className="bg-green-500 bg-opacity-90 px-4 py-2 rounded-md">
                  <p className="text-white font-semibold">{recognizedStudent}</p>
                </div>
                <p className="text-white mt-4 font-semibold">
                  Marking Attendance...
                </p>
              </div>
            )}
            
            {recognitionStatus === 'unrecognized' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
                <div className="bg-destructive/20 p-4 rounded-full mb-3">
                  <X className="h-8 w-8 text-destructive" />
                </div>
                <p className="text-white font-semibold mb-3">Face Not Recognized</p>
                <Button 
                  variant="outline"
                  className="bg-white gap-2"
                  onClick={onBack}
                >
                  <UserPlus className="h-4 w-4" /> Register First
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <p className="text-sm text-muted-foreground text-center mb-4">
        {(!cameraReady || !faceApiLoaded) ? (
          <>
            {!cameraReady && "Camera is initializing..."}
            {!cameraReady && !faceApiLoaded && " / "}
            {!faceApiLoaded && "Face detection is loading..."}
          </>
        ) : (
          "Position your face in the camera for attendance"
        )}
      </p>
      
      <Button 
        variant="outline" 
        onClick={() => {
          if (recognitionTimeout.current) {
            clearTimeout(recognitionTimeout.current);
          }
          setRecognizedStudent(null);
          setRecognitionStatus('pending');
        }}
        disabled={recognitionStatus === 'pending'}
      >
        Reset
      </Button>
    </div>
  );
};

export default TakeAttendance;
