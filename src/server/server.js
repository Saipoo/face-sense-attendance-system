/**
 * This is a backend implementation using Node.js, Express, and MongoDB
 * You can run this separately on your local machine
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');
const PDFDocument = require('pdfkit');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for face data

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/smartAttendance', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Define Schemas
const studentSchema = new mongoose.Schema({
  usn: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  faceDescriptor: { type: [Number], required: true },
  photoData: { type: String } // Store base64 encoded image
});

const subjectSchema = new mongoose.Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  day: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true }
});

const attendanceSchema = new mongoose.Schema({
  usn: { type: String, required: true },
  subject: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true }
});

const timetableSchema = new mongoose.Schema({
  subjects: [subjectSchema]
});

// Create models
const Student = mongoose.model('Student', studentSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);
const Timetable = mongoose.model('Timetable', timetableSchema);

// Configure storage for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, `timetable-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

// API Routes

// Student Registration
app.post('/api/students', async (req, res) => {
  try {
    const { usn, faceDescriptor, photoData } = req.body;
    
    console.log(`Registering student with USN: ${usn}`);
    
    // Check if student already exists
    const existingStudent = await Student.findOne({ usn });
    
    if (existingStudent) {
      // Update existing student
      existingStudent.faceDescriptor = faceDescriptor;
      if (photoData) {
        existingStudent.photoData = photoData;
      }
      await existingStudent.save();
      console.log(`Updated existing student: ${usn}`);
      return res.status(200).json(existingStudent);
    }
    
    // Create new student
    const student = new Student({
      usn,
      faceDescriptor,
      photoData
    });
    
    await student.save();
    console.log(`New student registered: ${usn}`);
    res.status(201).json(student);
  } catch (error) {
    console.error('Error registering student:', error);
    res.status(500).json({ error: 'Failed to register student' });
  }
});

// Get all students
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find({}, { faceDescriptor: 0, photoData: 0 }); // Exclude face descriptor and photo for performance
    res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get specific student with face descriptor for recognition
app.get('/api/students/:usn/recognition', async (req, res) => {
  try {
    const student = await Student.findOne({ usn: req.params.usn });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.status(200).json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// Get all face descriptors for recognition
app.get('/api/students/face-descriptors', async (req, res) => {
  try {
    console.log('Fetching all face descriptors');
    const students = await Student.find({}, { usn: 1, faceDescriptor: 1 });
    console.log(`Found ${students.length} students with face descriptors`);
    res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching face descriptors:', error);
    res.status(500).json({ error: 'Failed to fetch face descriptors' });
  }
});

// Mark attendance
app.post('/api/attendance', async (req, res) => {
  try {
    const { usn, subject, date, time } = req.body;
    
    // Check if attendance already marked
    const existingAttendance = await Attendance.findOne({
      usn,
      subject,
      date
    });
    
    if (existingAttendance) {
      return res.status(400).json({ error: 'Attendance already marked' });
    }
    
    const attendance = new Attendance({
      usn,
      subject,
      date,
      time
    });
    
    await attendance.save();
    res.status(201).json(attendance);
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// Get attendance records by date
app.get('/api/attendance/:date', async (req, res) => {
  try {
    const attendanceRecords = await Attendance.find({ date: req.params.date });
    res.status(200).json(attendanceRecords);
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// Save timetable
app.post('/api/timetable', async (req, res) => {
  try {
    // Delete existing timetable first (we only store one timetable)
    await Timetable.deleteMany({});
    
    const timetable = new Timetable(req.body);
    await timetable.save();
    
    res.status(201).json(timetable);
  } catch (error) {
    console.error('Error saving timetable:', error);
    res.status(500).json({ error: 'Failed to save timetable' });
  }
});

// Get timetable
app.get('/api/timetable', async (req, res) => {
  try {
    const timetable = await Timetable.findOne();
    res.status(200).json(timetable || { subjects: [] });
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
});

// Upload timetable file
app.post('/api/timetable/upload', upload.single('timetableFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // In a real application, you would process the file
    // For example, extract text from PDF or use OCR for images
    
    res.status(200).json({ 
      message: 'File uploaded successfully',
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading timetable file:', error);
    res.status(500).json({ error: 'Failed to upload timetable file' });
  }
});

// Download attendance as Excel (CSV)
app.get('/api/attendance/:date/excel', async (req, res) => {
  try {
    const date = req.params.date;
    const attendanceRecords = await Attendance.find({ date });
    
    if (attendanceRecords.length === 0) {
      return res.status(404).json({ error: 'No attendance records found' });
    }
    
    const outputPath = `./downloads/attendance-${date}.csv`;
    const dir = './downloads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    
    const csvWriter = createObjectCsvWriter({
      path: outputPath,
      header: [
        { id: 'usn', title: 'USN' },
        { id: 'subject', title: 'Subject' },
        { id: 'time', title: 'Time' }
      ]
    });
    
    await csvWriter.writeRecords(attendanceRecords);
    
    res.download(outputPath, `attendance-${date}.csv`, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
      }
      // Clean up the file after download
      fs.unlinkSync(outputPath);
    });
  } catch (error) {
    console.error('Error generating Excel report:', error);
    res.status(500).json({ error: 'Failed to generate Excel report' });
  }
});

// Download attendance as PDF
app.get('/api/attendance/:date/pdf', async (req, res) => {
  try {
    const date = req.params.date;
    const attendanceRecords = await Attendance.find({ date });
    
    if (attendanceRecords.length === 0) {
      return res.status(404).json({ error: 'No attendance records found' });
    }
    
    const outputPath = `./downloads/attendance-${date}.pdf`;
    const dir = './downloads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    
    // Group by subject
    const recordsBySubject = {};
    attendanceRecords.forEach(record => {
      if (!recordsBySubject[record.subject]) {
        recordsBySubject[record.subject] = [];
      }
      recordsBySubject[record.subject].push(record);
    });
    
    // Create PDF
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);
    
    // Add title
    doc.fontSize(16).text(`Attendance Report - ${date}`, { align: 'center' });
    doc.moveDown();
    
    // Add each subject
    Object.entries(recordsBySubject).forEach(([subject, records]) => {
      doc.fontSize(14).text(`Subject: ${subject}`, { underline: true });
      doc.moveDown(0.5);
      
      // Create table header
      doc.fontSize(12).text('USN', 100, doc.y, { width: 150, continued: true });
      doc.text('Time', { width: 150 });
      doc.moveDown(0.5);
      
      // Add records
      records.forEach(record => {
        doc.text(record.usn, 100, doc.y, { width: 150, continued: true });
        doc.text(record.time, { width: 150 });
      });
      
      doc.moveDown();
    });
    
    doc.end();
    
    // Wait for the PDF to be created
    writeStream.on('finish', () => {
      res.download(outputPath, `attendance-${date}.pdf`, (err) => {
        if (err) {
          console.error('Error downloading file:', err);
        }
        // Clean up the file after download
        fs.unlinkSync(outputPath);
      });
    });
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
