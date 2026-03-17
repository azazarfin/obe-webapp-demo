import React from 'react';
import { CalendarCheck, CheckCircle, XCircle } from 'lucide-react';
import { getAttendanceMarks, getAttendanceStatus } from '../../utils/attendanceUtils';

const mockAttendanceLog = [
  { date: '2025-01-05', status: 'present' },
  { date: '2025-01-08', status: 'present' },
  { date: '2025-01-12', status: 'absent' },
  { date: '2025-01-15', status: 'present' },
  { date: '2025-01-19', status: 'present' },
  { date: '2025-01-22', status: 'present' },
  { date: '2025-01-26', status: 'absent' },
  { date: '2025-01-29', status: 'present' },
  { date: '2025-02-02', status: 'present' },
  { date: '2025-02-05', status: 'present' },
  { date: '2025-02-09', status: 'present' },
  { date: '2025-02-12', status: 'present' },
  { date: '2025-02-16', status: 'present' },
  { date: '2025-02-19', status: 'present' },
  { date: '2025-02-23', status: 'present' },
];

const StudentAttendanceInfo = ({ course }) => {
  if (!course) return null;

  const totalClasses = mockAttendanceLog.length;
  const presentCount = mockAttendanceLog.filter(a => a.status === 'present').length;
  const absentCount = totalClasses - presentCount;
  const pct = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(1) : 0;
  const attendanceMarks = getAttendanceMarks(parseFloat(pct));
  const attendanceStatusInfo = getAttendanceStatus(parseFloat(pct));

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Attendance Info</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{course.code} — {course.name}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1e1e1e] shadow-sm rounded-lg p-4 border border-gray-100 dark:border-gray-800 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Total Classes</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalClasses}</p>
        </div>
        <div className="bg-white dark:bg-[#1e1e1e] shadow-sm rounded-lg p-4 border border-gray-100 dark:border-gray-800 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Present</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{presentCount}</p>
        </div>
        <div className="bg-white dark:bg-[#1e1e1e] shadow-sm rounded-lg p-4 border border-gray-100 dark:border-gray-800 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Attendance %</p>
          <p className={`text-3xl font-bold mt-1 ${parseFloat(pct) >= 75 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{pct}%</p>
        </div>
        <div className="bg-white dark:bg-[#1e1e1e] shadow-sm rounded-lg p-4 border border-gray-100 dark:border-gray-800 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Marks (/10)</p>
          <p className="text-3xl font-bold text-ruet-blue dark:text-blue-400 mt-1">{attendanceMarks}</p>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${attendanceStatusInfo.color}`}>{attendanceStatusInfo.label}</span>
        </div>
      </div>

      {parseFloat(pct) < 75 && (
        <div className={`p-3 rounded-lg border text-sm ${parseFloat(pct) < 50 ? 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300' : 'bg-amber-100 dark:bg-amber-900/20 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'}`}>
          <span className="font-bold">Rule 14.3:</span> {parseFloat(pct) < 50 ? 'You are barred from the Semester Final Examination.' : 'You are not eligible for scholarship/stipend/grant for the following academic session.'}
        </div>
      )}

      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-16">#</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
            {mockAttendanceLog.map((entry, idx) => (
              <tr key={idx} className={entry.status === 'absent' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}>
                <td className="px-6 py-3 text-xs text-gray-400 font-mono">{idx + 1}</td>
                <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">{entry.date}</td>
                <td className="px-6 py-3 text-center">
                  {entry.status === 'present' ? (
                    <span className="inline-flex items-center text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 rounded-full">
                      <CheckCircle size={12} className="mr-1" /> Present
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-semibold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2.5 py-0.5 rounded-full">
                      <XCircle size={12} className="mr-1" /> Absent
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentAttendanceInfo;
