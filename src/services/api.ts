
// This file contains API service functions to interact with the backend

import { Student, AttendanceRecord, Timetable } from '../types';

const API_URL = 'http://localhost:5000/api';

export async function registerStudentFace(student: Student): Promise<Student> {
  const response = await fetch(`${API_URL}/students`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(student),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to register student');
  }

  return response.json();
}

export async function getAllStudentFaces(): Promise<Student[]> {
  const response = await fetch(`${API_URL}/students/face-descriptors`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch face descriptors');
  }

  return response.json();
}

export async function markAttendance(record: AttendanceRecord): Promise<AttendanceRecord> {
  const response = await fetch(`${API_URL}/attendance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to mark attendance');
  }

  return response.json();
}

export async function getAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
  const response = await fetch(`${API_URL}/attendance/${date}`);
  
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
    body: JSON.stringify(timetable),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to save timetable');
  }

  return response.json();
}

export async function getTimetable(): Promise<Timetable> {
  const response = await fetch(`${API_URL}/timetable`);
  
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
