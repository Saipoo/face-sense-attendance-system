
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { UserRole, Student, AttendanceRecord, Timetable } from '../types';

interface AppContextValue {
  userRole: UserRole | null;
  setUserRole: (role: UserRole | null) => void;
  students: Student[];
  registerStudent: (student: Student) => void;
  getStudentByUSN: (usn: string) => Student | undefined;
  attendanceRecords: AttendanceRecord[];
  addAttendanceRecord: (record: AttendanceRecord) => void;
  timetable: Timetable | null;
  setTimetable: (timetable: Timetable) => void;
  getCurrentSubject: () => string | null;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [timetable, setTimetable] = useState<Timetable | null>(null);

  const registerStudent = (student: Student) => {
    setStudents(prev => {
      const exists = prev.findIndex(s => s.usn === student.usn);
      if (exists >= 0) {
        const updated = [...prev];
        updated[exists] = student;
        return updated;
      }
      return [...prev, student];
    });
  };

  const getStudentByUSN = (usn: string) => {
    return students.find(student => student.usn === usn);
  };

  const addAttendanceRecord = (record: AttendanceRecord) => {
    // Check if student already marked attendance for this subject and date
    const exists = attendanceRecords.some(
      r => r.usn === record.usn && r.subject === record.subject && r.date === record.date
    );

    if (!exists) {
      setAttendanceRecords(prev => [...prev, record]);
      // In a real application, you would also send this to your backend
      sendAttendanceToBackend(record);
    }
  };

  const sendAttendanceToBackend = (record: AttendanceRecord) => {
    console.log('Sending attendance record to backend:', record);
    // In a real application, you would make an API call here
    // Example:
    // fetch('/api/attendance', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(record)
    // });
  };

  const getCurrentSubject = () => {
    if (!timetable) return null;
    
    const now = new Date();
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const currentSubject = timetable.subjects.find(subject => {
      return (
        subject.day === dayOfWeek &&
        subject.startTime <= currentTime &&
        subject.endTime > currentTime
      );
    });
    
    return currentSubject ? currentSubject.code : null;
  };

  const value = {
    userRole,
    setUserRole,
    students,
    registerStudent,
    getStudentByUSN,
    attendanceRecords,
    addAttendanceRecord,
    timetable,
    setTimetable,
    getCurrentSubject,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
