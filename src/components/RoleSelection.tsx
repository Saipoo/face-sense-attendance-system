
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle, School } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { UserRole } from '@/types';

const RoleSelection: React.FC = () => {
  const { setUserRole } = useApp();

  const selectRole = (role: UserRole) => {
    setUserRole(role);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center mb-8 animate-slide-in">
        <h1 className="text-4xl font-bold text-primary mb-2">ConnectBook</h1>
        <p className="text-xl text-muted-foreground">Smart Attendance System</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-3xl animate-slide-in">
        <Card className="w-full md:w-1/2 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
          <CardHeader className="text-center">
            <CardTitle>Student</CardTitle>
            <CardDescription>Register & Mark Attendance</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <UserCircle className="w-24 h-24 text-primary" />
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => selectRole('student')} className="w-full">
              Enter as Student
            </Button>
          </CardFooter>
        </Card>

        <Card className="w-full md:w-1/2 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
          <CardHeader className="text-center">
            <CardTitle>Teacher</CardTitle>
            <CardDescription>Manage Attendance & Timetables</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <School className="w-24 h-24 text-primary" />
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => selectRole('teacher')} className="w-full">
              Enter as Teacher
            </Button>
          </CardFooter>
        </Card>
      </div>

      <footer className="mt-12 text-sm text-muted-foreground animate-slide-in">
        &copy; 2025 ConnectBook - Smart Attendance System
      </footer>
    </div>
  );
};

export default RoleSelection;
