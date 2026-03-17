import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { getAttendanceMarks, getAttendanceStatus } from '../../utils/attendanceUtils';

// Mock Student Data
const initialStudents = [
  { id: '2103001', name: 'Rahim Uddin' },
  { id: '2103002', name: 'Karim Hasan' },
  { id: '2103003', name: 'Sadia Rahman' },
  { id: '2103004', name: 'Tamim Iqbal' },
  { id: '2103005', name: 'Nadia Sultana' },
];

const TakeAttendance = () => {
  // Initialize with today's date
  const [dates, setDates] = useState([new Date().toISOString().split('T')[0]]);
  
  // State structure: { '2103001': { '2023-11-01': 'P', '2023-11-08': 'A' } }
  const [attendanceData, setAttendanceData] = useState({});

  const handleCellChange = (studentId, date, value) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [date]: value
      }
    }));
  };

  const getStudentStats = (studentId) => {
    const studentRecords = attendanceData[studentId] || {};
    const totalClasses = dates.length;
    let presentCount = 0;
    dates.forEach(date => {
      const status = (studentRecords[date] || 'P').toUpperCase().trim();
      if (status !== 'A') presentCount += 1;
    });
    const percentage = totalClasses === 0 ? 0 : (presentCount / totalClasses) * 100;
    const marks = getAttendanceMarks(percentage);
    const status = getAttendanceStatus(percentage);
    return { percentage: percentage.toFixed(1), marks, status, presentCount, totalClasses };
  };

  const handleSave = () => {
    // Before saving, ensure all 'P' defaults are captured if needed, 
    // or handled by backend logic. For now, logging current state.
    console.log('Saving Attendance:', attendanceData);
    alert('Attendance saved successfully!');
  };

  const addNewDateColumn = () => {
    const newDate = prompt("Enter new class date (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
    if (newDate && !dates.includes(newDate)) {
      setDates([...dates, newDate]);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Take Attendance</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Class: CSE 3101 (Section A, 2021 Series)</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={addNewDateColumn}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            + Add Class Date
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center px-4 py-2 bg-ruet-blue text-white rounded-md text-sm font-medium hover:bg-ruet-dark transition-colors"
          >
            <Save size={16} className="mr-2" />
            Save Records
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-gray-50 dark:bg-[#2d2d2d] px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">
                Student ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">
                Name
              </th>
              {dates.map((date, idx) => (
                <th key={idx} scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                  {date}
                </th>
              ))}
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/10">
                Attendance %
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-ruet-blue dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-ruet-dark/20 border-r border-gray-200 dark:border-gray-700">
                Marks (/10)
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-amber-50 dark:bg-amber-900/10">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
            {initialStudents.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 group">
                <td className="sticky left-0 z-10 bg-white dark:bg-[#1e1e1e] group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  {student.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                  {student.name}
                </td>
                {dates.map((date, idx) => {
                  const status = (attendanceData[student.id] && attendanceData[student.id][date]) || 'P';
                  return (
                    <td key={idx} className="p-0 border-r border-gray-200 dark:border-gray-700 text-center">
                      <div 
                        tabIndex={0}
                        role="button"
                        aria-label={`Attendance for ${student.name} on ${date}`}
                        className={`w-full py-4 cursor-pointer outline-none focus:ring-2 focus:ring-inset focus:ring-ruet-blue transition-colors font-bold ${
                          status === 'P' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}
                        onKeyDown={(e) => {
                          const key = e.key.toLowerCase();
                          if (key === 'p') handleCellChange(student.id, date, 'P');
                          else if (key === 'a') handleCellChange(student.id, date, 'A');
                        }}
                      >
                        {status}
                      </div>
                    </td>
                  );
                })}
                {(() => {
                  const stats = getStudentStats(student.id);
                  return (
                    <>
                      <td className={`px-4 py-4 whitespace-nowrap text-sm font-bold text-center border-r border-gray-200 dark:border-gray-700 ${parseFloat(stats.percentage) >= 75 ? 'text-green-600 dark:text-green-400' : parseFloat(stats.percentage) >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                        {stats.percentage}%
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-extrabold text-center text-ruet-blue dark:text-blue-400 border-r border-gray-200 dark:border-gray-700 bg-blue-50/50 dark:bg-ruet-dark/10">
                        {stats.marks}
                      </td>
                      <td className={`px-4 py-4 whitespace-nowrap text-center`}>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${stats.status.color}`}>{stats.status.label}</span>
                      </td>
                    </>
                  );
                })()}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p><span className="font-semibold">Grid Helper:</span> All students default to 'P'. Click a cell and press 'A' for absent. Marks follow RUET Rule 14.2.</p>
        <p className="text-red-500 dark:text-red-400"><span className="font-semibold">Rule 14.3:</span> Students with &lt;50% attendance are barred from the Semester Final. &lt;75% disqualifies from scholarship/stipend.</p>
      </div>
    </div>
  );
};

export default TakeAttendance;
