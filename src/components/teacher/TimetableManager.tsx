
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Upload, Plus, Trash2 } from 'lucide-react';
import { Subject, Timetable, DayOfWeek } from '@/types';

const TimetableManager: React.FC = () => {
  const { timetable, setTimetable } = useApp();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>(timetable?.subjects || []);
  
  // Form states
  const [day, setDay] = useState<DayOfWeek>('Monday');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  const days: DayOfWeek[] = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  const handleAddSubject = () => {
    if (!subjectCode || !subjectName || !startTime || !endTime) {
      toast({
        title: "Incomplete Form",
        description: "Please fill all fields",
        variant: "destructive"
      });
      return;
    }
    
    const newSubject: Subject = {
      code: subjectCode,
      name: subjectName,
      day,
      startTime,
      endTime
    };
    
    // Check for overlapping time slots on the same day
    const hasOverlap = subjects.some(subject => {
      if (subject.day !== day) return false;
      return (
        (startTime >= subject.startTime && startTime < subject.endTime) ||
        (endTime > subject.startTime && endTime <= subject.endTime) ||
        (startTime <= subject.startTime && endTime >= subject.endTime)
      );
    });
    
    if (hasOverlap) {
      toast({
        title: "Time Slot Overlap",
        description: "This time slot overlaps with another subject",
        variant: "destructive"
      });
      return;
    }
    
    const updatedSubjects = [...subjects, newSubject];
    setSubjects(updatedSubjects);
    
    // Update app context
    setTimetable({ subjects: updatedSubjects });
    
    // Reset form
    setSubjectCode('');
    setSubjectName('');
    setStartTime('');
    setEndTime('');
    
    toast({
      title: "Subject Added",
      description: `${subjectCode}: ${subjectName} has been added to the timetable`,
    });
  };

  const handleRemoveSubject = (index: number) => {
    const updatedSubjects = [...subjects];
    updatedSubjects.splice(index, 1);
    setSubjects(updatedSubjects);
    setTimetable({ subjects: updatedSubjects });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // In a real app, you would upload this file to your backend
    // For now, we'll just show a toast to simulate the upload
    toast({
      title: "File Uploaded",
      description: `${file.name} has been uploaded and will be processed.`,
    });
    
    // Reset the input
    event.target.value = '';
  };

  // Get the current time to determine the current subject
  const now = new Date();
  const currentDay = days[now.getDay() === 0 ? 6 : now.getDay() - 1];
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Timetable</CardTitle>
          <CardDescription>
            Upload a photo or PDF of your timetable
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Drag & drop your file here, or click to browse
            </p>
            <Input
              id="timetable-upload"
              type="file"
              accept=".pdf,image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <label htmlFor="timetable-upload">
              <Button variant="outline" className="w-full" asChild>
                <span>Choose File</span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual Update</CardTitle>
          <CardDescription>
            Add subjects to your timetable manually
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm">Subject Code</label>
              <Input 
                value={subjectCode} 
                onChange={e => setSubjectCode(e.target.value)}
                placeholder="e.g. CS101"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Subject Name</label>
              <Input 
                value={subjectName} 
                onChange={e => setSubjectName(e.target.value)}
                placeholder="e.g. Introduction to CS"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm">Day</label>
            <Select value={day} onValueChange={(value) => setDay(value as DayOfWeek)}>
              <SelectTrigger>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {days.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm">Start Time</label>
              <Input 
                type="time" 
                value={startTime} 
                onChange={e => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm">End Time</label>
              <Input 
                type="time" 
                value={endTime} 
                onChange={e => setEndTime(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleAddSubject} 
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" /> Add Subject
          </Button>
        </CardFooter>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Current Timetable</CardTitle>
          <CardDescription>
            Subjects in your current timetable. The current class is highlighted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No subjects added yet. Use the form above to add subjects to your timetable.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-2">Day</th>
                    <th className="text-left p-2">Code</th>
                    <th className="text-left p-2">Subject</th>
                    <th className="text-left p-2">Time</th>
                    <th className="text-center p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subject, index) => {
                    const isCurrent = subject.day === currentDay && 
                      currentTime >= subject.startTime && 
                      currentTime < subject.endTime;
                    
                    return (
                      <tr 
                        key={index}
                        className={`${isCurrent ? 'bg-success/10' : ''} ${index % 2 === 0 ? 'bg-muted/20' : ''}`}
                      >
                        <td className="p-2">{subject.day}</td>
                        <td className="p-2">{subject.code}</td>
                        <td className="p-2">{subject.name}</td>
                        <td className="p-2">
                          {subject.startTime} - {subject.endTime}
                        </td>
                        <td className="p-2 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveSubject(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TimetableManager;
