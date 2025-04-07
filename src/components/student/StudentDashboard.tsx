
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import FaceRegistration from './FaceRegistration';
import TakeAttendance from './TakeAttendance';
import { LogOut } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

enum StudentView {
  Main,
  Register,
  Attendance
}

const StudentDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<StudentView>(StudentView.Main);
  const { setUserRole } = useApp();

  const handleLogout = () => {
    setUserRole(null);
  };

  const renderView = () => {
    switch (currentView) {
      case StudentView.Register:
        return <FaceRegistration onComplete={() => setCurrentView(StudentView.Attendance)} />;
      case StudentView.Attendance:
        return <TakeAttendance onBack={() => setCurrentView(StudentView.Main)} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center space-y-8 p-4 max-w-md mx-auto animate-fade-in">
            <h1 className="text-3xl font-bold text-primary">Student Dashboard</h1>
            <p className="text-center text-muted-foreground">
              Welcome to the ConnectBook Attendance System. Choose an option below to continue.
            </p>
            
            <div className="grid grid-cols-1 gap-4 w-full">
              <Button 
                onClick={() => setCurrentView(StudentView.Register)} 
                className="h-20 text-lg"
                variant="outline"
              >
                Register Face
              </Button>
              
              <Button 
                onClick={() => setCurrentView(StudentView.Attendance)} 
                className="h-20 text-lg"
              >
                Take Attendance
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 border-b flex justify-end">
        <Button 
          variant="ghost" 
          className="gap-2" 
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </header>
      
      <div className="flex-1 p-4">
        {renderView()}
      </div>
      
      {currentView !== StudentView.Main && (
        <div className="p-4 flex justify-center">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentView(StudentView.Main)}
          >
            Back to Main Menu
          </Button>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
