
import React from 'react';
import { AppProvider, useApp } from '@/contexts/AppContext';
import RoleSelection from '@/components/RoleSelection';
import StudentDashboard from '@/components/student/StudentDashboard';
import TeacherDashboard from '@/components/teacher/TeacherDashboard';

const AppContent: React.FC = () => {
  const { userRole } = useApp();

  return (
    <div className="min-h-screen">
      {userRole === null && <RoleSelection />}
      {userRole === 'student' && <StudentDashboard />}
      {userRole === 'teacher' && <TeacherDashboard />}
    </div>
  );
};

const Index: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default Index;
