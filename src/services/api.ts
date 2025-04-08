// This file contains API service functions to interact with the backend

import { Student, AttendanceRecord, Timetable } from '../types';

const API_URL = 'http://localhost:5001/api';

export async function registerStudentFace(student: Student): Promise<Student> {
  console.log('Registering student face:', student.usn);
  // Validate and format student data before sending
  if (!student.usn || !student.faceDescriptor) {
    throw new Error('USN and faceDescriptor are required');
  }

  // Convert Float32Array to regular array if needed
  const faceDescriptor = student.faceDescriptor instanceof Float32Array
    ? Array.from(student.faceDescriptor)
    : student.faceDescriptor || [];

  const payload = {
    usn: student.usn.toString().trim(),
    name: student.name?.toString().trim() || '',
    faceDescriptor: faceDescriptor.map(Number),
    photoData: student.photoData
  };

  const response = await fetch(`${API_URL}/students`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to register student');
  }

  return response.json();
}

export async function getAllStudentFaces(): Promise<Student[]> {
  console.log('Fetching all student faces');
  const response = await fetch(`${API_URL}/students/face-descriptors`, {
    credentials: 'include'
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch face descriptors');
  }

  return response.json();
}

export async function markAttendance(record: AttendanceRecord): Promise<AttendanceRecord> {
  console.log('Marking attendance:', record);
  const response = await fetch(`${API_URL}/attendance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to mark attendance');
  }

  return response.json();
}

export async function getAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
  const response = await fetch(`${API_URL}/attendance/${date}`, {
    credentials: 'include'
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch attendance records');
  }

  return response.json();
}

export async function saveTimetable(timetable: Timetable): Promise<Timetable> {
  const response = await fetch(`${API_URL}/timetable`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(timetable),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to save timetable');
  }

  return response.json();
}

export async function getTimetable(): Promise<Timetable> {
  const response = await fetch(`${API_URL}/timetable`, {
    credentials: 'include'
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch timetable');
  }

  return response.json();
}

export async function uploadTimetableFile(file: File): Promise<{ filename: string }> {
  const formData = new FormData();
  formData.append('timetableFile', file);

  const response = await fetch(`${API_URL}/timetable/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload timetable file');
  }

  return response.json();
}

export function getExcelDownloadUrl(date: string): string {
  return `${API_URL}/attendance/${date}/excel`;
}

export function getPdfDownloadUrl(date: string): string {
  return `${API_URL}/attendance/${date}/pdf`;
}
