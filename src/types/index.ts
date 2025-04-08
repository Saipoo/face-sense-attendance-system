
export type UserRole = 'student' | 'teacher';

export interface Student {
  usn: string;
  faceDescriptor?: Float32Array | number[];
  name?: string;
  photoData?: string; // base64 encoded image
}

export interface Subject {
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  day: string;
}

export interface AttendanceRecord {
  usn: string;
  subject: string;
  subjectCode?: string;
  date: string;
  time: string;
}

export interface Timetable {
  subjects: Subject[];
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
