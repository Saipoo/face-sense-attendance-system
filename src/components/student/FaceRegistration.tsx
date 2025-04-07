
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useCamera } from '@/hooks/use-camera';
import { useFaceApi } from '@/hooks/use-face-api';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FaceRegistrationProps {
  onComplete: () => void;
}

const FaceRegistration: React.FC<FaceRegistrationProps> = ({ onComplete }) => {
  const { registerStudent } = useApp();
  const [selectedUSN, setSelectedUSN] = useState<string>('');
  const [usnList, setUsnList] = useState<string[]>([]);
  const [registrationStep, setRegistrationStep] = useState<'select' | 'capture' | 'success'>('select');
  const { toast } = useToast();
  
  // Initialize face detection
  const { isLoaded: faceApiLoaded, detectFaces } = useFaceApi();
  const { videoRef, canvasRef, isReady: cameraReady, takeSnapshot } = useCamera({
    enabled: registrationStep === 'capture',
  });

  // Generate USN list
  useEffect(() => {
    const usns = Array.from({ length: 64 }, (_, i) => {
      const num = i + 1;
      return `1VE22IS${num.toString().padStart(3, '0')}`;
    });
    setUsnList(usns);
  }, []);

  const handleRegistration = async () => {
    if (!cameraReady || !faceApiLoaded || !videoRef.current) {
      toast({
        title: "Error",
        description: "Camera or face detection not ready",
        variant: "destructive"
      });
      return;
    }

    try {
      // Take snapshot and detect face
      const detections = await detectFaces(videoRef.current);
      
      if (!detections || detections.length === 0) {
        toast({
          title: "No Face Detected",
          description: "Please position your face clearly in the camera",
          variant: "destructive"
        });
        return;
      }

      if (detections.length > 1) {
        toast({
          title: "Multiple Faces Detected",
          description: "Please ensure only your face is visible",
          variant: "destructive"
        });
        return;
      }

      // Get the face descriptor
      const faceDescriptor = detections[0].descriptor;
      
      // Register the student
      registerStudent({
        usn: selectedUSN,
        faceDescriptor: faceDescriptor
      });

      toast({
        title: "Registration Successful",
        description: "Your face has been registered successfully",
        variant: "default"
      });
      
      setRegistrationStep('success');
      
      // Auto transition to attendance after success
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error) {
      console.error('Face registration error:', error);
      toast({
        title: "Registration Failed",
        description: "An error occurred during face registration",
        variant: "destructive"
      });
    }
  };

  const renderSelectUSN = () => (
    <div className="space-y-6 max-w-md mx-auto animate-slide-in">
      <h2 className="text-2xl font-semibold text-center">Face Registration</h2>
      <p className="text-muted-foreground text-center">Please select your USN from the dropdown below.</p>
      
      <Select onValueChange={setSelectedUSN} value={selectedUSN}>
        <SelectTrigger>
          <SelectValue placeholder="Select your USN" />
        </SelectTrigger>
        <SelectContent>
          {usnList.map(usn => (
            <SelectItem key={usn} value={usn}>{usn}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button 
        className="w-full" 
        disabled={!selectedUSN} 
        onClick={() => setRegistrationStep('capture')}
      >
        Continue
      </Button>
    </div>
  );

  const renderCaptureface = () => (
    <div className="space-y-6 max-w-md mx-auto animate-slide-in">
      <h2 className="text-2xl font-semibold text-center">Capture Your Face</h2>
      <p className="text-center text-primary font-medium">USN: {selectedUSN}</p>
      <p className="text-muted-foreground text-center mb-4">
        Position your face clearly in the frame and click the Register button.
      </p>
      
      <Card className="overflow-hidden">
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
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={() => setRegistrationStep('select')}>
          Back
        </Button>
        <Button 
          disabled={!cameraReady || !faceApiLoaded} 
          onClick={handleRegistration}
          className="gap-2"
        >
          <Camera className="h-4 w-4" /> Register Face
        </Button>
      </div>
      
      {(!cameraReady || !faceApiLoaded) && (
        <p className="text-sm text-muted-foreground text-center">
          {!cameraReady && "Camera is initializing..."}
          {!cameraReady && !faceApiLoaded && " / "}
          {!faceApiLoaded && "Face detection is loading..."}
        </p>
      )}
    </div>
  );

  const renderSuccess = () => (
    <div className="space-y-6 max-w-md mx-auto text-center animate-slide-in">
      <div className="bg-success/10 p-8 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
        <Check className="h-12 w-12 text-success" />
      </div>
      <h2 className="text-2xl font-semibold">Registration Successful!</h2>
      <p className="text-muted-foreground">
        Your face has been registered successfully. Redirecting to attendance...
      </p>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      {registrationStep === 'select' && renderSelectUSN()}
      {registrationStep === 'capture' && renderCaptureface()}
      {registrationStep === 'success' && renderSuccess()}
    </div>
  );
};

export default FaceRegistration;
