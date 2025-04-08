
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { UserRole, Student, AttendanceRecord, Timetable } from '../types';
import * as api from '../services/api';

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

  // Fetch and refresh attendance data
  const getCurrentDate = () => {
    const now = new Date();
    // Adjust for timezone offset to get local date
    const timezoneOffset = now.getTimezoneOffset() * 60000;
    const localDate = new Date(now.getTime() - timezoneOffset);
    return localDate.toISOString().split('T')[0];
  };

  const refreshAttendanceData = async () => {
    try {
      const today = getCurrentDate();
      console.log('Fetching attendance for date:', today);
      const attendanceData = await api.getAttendanceByDate(today);
      console.log('Refreshed attendance data:', attendanceData);
      setAttendanceRecords(attendanceData);
      return attendanceData;
    } catch (err) {
      console.error('Failed to refresh attendance data:', err);
      throw err;
    }
  };

  // Fetch initial data on initialization
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        console.log('Fetching initial data from server...');
        
        // Fetch students
        const studentData = await api.getAllStudentFaces();
        console.log(`Loaded ${studentData.length} students with face data`);
        setStudents(studentData);
        
        // Fetch timetable
        const timetableData = await api.getTimetable();
        console.log('Loaded timetable data');
        setTimetable(timetableData);
        
        // Fetch today's attendance
        await refreshAttendanceData();
        
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
      }
    };

    fetchInitialData();
  }, []);

  const registerStudent = async (student: Student) => {
    try {
      // This will both update the backend and update our local state
      await api.registerStudentFace(student);
      
      setStudents(prev => {
        const exists = prev.findIndex(s => s.usn === student.usn);
        if (exists >= 0) {
          const updated = [...prev];
          updated[exists] = student;
          return updated;
        }
        return [...prev, student];
      });
    } catch (err) {
      console.error('Failed to register student:', err);
      throw err;
    }
  };

  const getStudentByUSN = (usn: string) => {
    return students.find(student => student.usn === usn);
  };

  const addAttendanceRecord = async (record: AttendanceRecord) => {
    try {
      // First check if attendance already exists
      const todayRecords = await api.getAttendanceByDate(record.date);
      const exists = todayRecords.some(
        r => r.usn === record.usn && 
             r.subject === record.subject && 
             r.date === record.date
      );

      if (exists) {
        console.log('Attendance already marked for:', {
          usn: record.usn,
          subject: record.subject,
          date: record.date
        });
        return { exists: true };
      }

      // Save to backend
      const savedRecord = await api.markAttendance(record);
      console.log('Attendance saved:', savedRecord);

      // Refresh attendance data
      await refreshAttendanceData();
      
      return savedRecord;
    } catch (err) {
      console.error('Attendance marking failed:', {
        error: err,
        record: record
      });
      throw err;
    }
  };

  const getCurrentSubject = () => {
    if (!timetable || timetable.subjects.length === 0) {
      console.log('No timetable or subjects found');
      return null;
    }
    
    const now = new Date();
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHours * 100 + currentMinutes; // Convert to HHMM format
    
    console.log('Current time check:', {
      day: dayOfWeek,
      time: `${currentHours}:${currentMinutes}`,
      timetableSubjects: timetable.subjects
    });

    const currentSubject = timetable.subjects.find(subject => {
      // Parse subject times
      const [startHour, startMin] = subject.startTime.split(':').map(Number);
      const [endHour, endMin] = subject.endTime.split(':').map(Number);
      
      const startTime = startHour * 100 + startMin;
      const endTime = endHour * 100 + endMin;
      
      const isCurrentDay = subject.day === dayOfWeek;
      const isCurrentTime = currentTime >= startTime && currentTime <= endTime;
      
      console.log(`Checking subject ${subject.code}:`, {
        dayMatch: isCurrentDay,
        timeMatch: isCurrentTime,
        subjectDay: subject.day,
        subjectTime: `${subject.startTime}-${subject.endTime}`,
        currentTime
      });
      
      return isCurrentDay && isCurrentTime;
    });
    
    if (!currentSubject) {
      console.log('No active subject found for current time');
      return null;
    }
    
    console.log('Active subject found:', currentSubject.code);
    return currentSubject.code;
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
    refreshAttendanceData,
    getCurrentDate,
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
