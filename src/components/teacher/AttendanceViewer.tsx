
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { Download, FileText, File } from 'lucide-react';

const AttendanceViewer: React.FC = () => {
  const { attendanceRecords } = useApp();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  // Group records by date for the history section
  const recordsByDate = attendanceRecords.reduce((acc, record) => {
    if (!acc[record.date]) {
      acc[record.date] = [];
    }
    acc[record.date].push(record);
    return acc;
  }, {} as Record<string, typeof attendanceRecords>);
  
  // Get unique dates
  const dates = Object.keys(recordsByDate).sort().reverse();
  
  // Filter records for the selected date
  const todaysRecords = recordsByDate[selectedDate] || [];
  
  // Group today's records by subject
  const recordsBySubject = todaysRecords.reduce((acc, record) => {
    if (!acc[record.subject]) {
      acc[record.subject] = [];
    }
    acc[record.subject].push(record);
    return acc;
  }, {} as Record<string, typeof todaysRecords>);

  const handleDownload = (format: 'excel' | 'pdf') => {
    // In a real app, this would call an API to generate and download the file
    toast({
      title: `${format.toUpperCase()} Download`,
      description: `Attendance for ${selectedDate} will be downloaded as ${format.toUpperCase()}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Today's Attendance</h3>
          <p className="text-sm text-muted-foreground">
            Viewing records for {selectedDate}
          </p>
        </div>
        
        <div className="flex gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => handleDownload('excel')}
          >
            <FileText className="h-4 w-4" /> Excel
          </Button>
          <Button
            variant="outline" 
            className="gap-2"
            onClick={() => handleDownload('pdf')}
          >
            <File className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      {Object.keys(recordsBySubject).length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              No attendance records found for {selectedDate}
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(recordsBySubject).map(([subject, records]) => (
          <Card key={subject}>
            <CardHeader className="pb-2">
              <CardTitle>{subject}</CardTitle>
              <CardDescription>
                {records.length} student{records.length === 1 ? '' : 's'} present
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left p-2">USN</th>
                      <th className="text-left p-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                        <td className="p-2">{record.usn}</td>
                        <td className="p-2">{record.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <div className="pt-4">
        <h3 className="text-xl font-semibold mb-4">Attendance History</h3>
        
        {dates.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No attendance records found
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {dates.map(date => {
              const dateRecords = recordsByDate[date];
              const totalStudents = new Set(dateRecords.map(r => r.usn)).size;
              const subjects = new Set(dateRecords.map(r => r.subject));
              
              return (
                <Card 
                  key={date}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedDate(date)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className={selectedDate === date ? 'text-primary' : ''}>
                      {date}
                    </CardTitle>
                    <CardDescription>
                      {totalStudents} student{totalStudents === 1 ? '' : 's'} across {subjects.size} subject{subjects.size === 1 ? '' : 's'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {Array.from(subjects).slice(0, 2).join(', ')}
                      {subjects.size > 2 ? '...' : ''}
                    </p>
                    <Button size="icon" variant="ghost">
                      <Download className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceViewer;
