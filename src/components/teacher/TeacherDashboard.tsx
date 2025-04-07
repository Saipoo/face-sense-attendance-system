
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import TimetableManager from './TimetableManager';
import AttendanceViewer from './AttendanceViewer';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const TeacherDashboard: React.FC = () => {
  const { setUserRole } = useApp();
  
  return (
    <div className="container mx-auto p-4 max-w-5xl animate-slide-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Teacher Dashboard</h1>
        <Button 
          variant="outline" 
          onClick={() => setUserRole(null)}
          size="sm"
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Sign Out
        </Button>
      </div>
      
      <Tabs defaultValue="timetable" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timetable">Upload Timetable</TabsTrigger>
          <TabsTrigger value="attendance">View Attendance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timetable" className="space-y-4">
          <TimetableManager />
        </TabsContent>
        
        <TabsContent value="attendance" className="space-y-4">
          <AttendanceViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherDashboard;
