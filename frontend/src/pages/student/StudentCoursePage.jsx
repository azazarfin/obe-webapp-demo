import React from 'react';
import { CalendarCheck, FileText, Target, MessageSquare, ChevronRight, Users } from 'lucide-react';
import { getAttendanceMarks } from '../../utils/attendanceUtils';

const StudentCoursePage = ({ course, onNavigate }) => {
  if (!course) return null;

  const totalEarned = Object.values(course.marks).reduce((acc, curr) => acc + (curr.earned || 0), 0);
  const totalPossible = Object.values(course.marks).reduce((acc, curr) => acc + curr.total, 0);
  const attendPct = course.attendance;
  const coKeys = Object.keys(course.obe || {});
  const coAttained = coKeys.filter(k => course.obe[k].percentage >= course.obe[k].threshold).length;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{course.code} — {course.name}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Instructor: {course.teacher}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1e1e1e] shadow-sm rounded-lg p-4 border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Attendance</p>
          <p className={`text-2xl font-bold mt-1 ${attendPct >= 75 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{attendPct}%</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Marks: <span className="font-bold text-ruet-blue dark:text-blue-400">{getAttendanceMarks(attendPct)}/10</span></p>
        </div>
        <div className="bg-white dark:bg-[#1e1e1e] shadow-sm rounded-lg p-4 border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Marks (So Far)</p>
          <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{totalEarned.toFixed(1)}<span className="text-sm font-normal text-gray-500">/{totalPossible}</span></p>
        </div>
        <div className="bg-white dark:bg-[#1e1e1e] shadow-sm rounded-lg p-4 border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">CO Attained</p>
          <p className="text-2xl font-bold mt-1 text-ruet-blue dark:text-blue-400">{coAttained}<span className="text-sm font-normal text-gray-500">/{coKeys.length}</span></p>
        </div>
        <div className="bg-white dark:bg-[#1e1e1e] shadow-sm rounded-lg p-4 border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Course Type</p>
          <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">Theory</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Course Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={() => onNavigate('attendance_info')}
            className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-left group">
            <div className="flex items-center">
              <CalendarCheck size={22} className="text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <span className="block font-semibold text-blue-800 dark:text-blue-300">Attendance Info</span>
                <span className="text-xs text-blue-600/70 dark:text-blue-400/70">View your class attendance log</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
          </button>

          <button onClick={() => onNavigate('marksheet')}
            className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors text-left group">
            <div className="flex items-center">
              <FileText size={22} className="text-indigo-600 dark:text-indigo-400 mr-3" />
              <div>
                <span className="block font-semibold text-indigo-800 dark:text-indigo-300">Marksheet</span>
                <span className="text-xs text-indigo-600/70 dark:text-indigo-400/70">CT, Assignment & Final marks</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
          </button>

          <button onClick={() => onNavigate('obe_attainment')}
            className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors text-left group">
            <div className="flex items-center">
              <Target size={22} className="text-green-600 dark:text-green-400 mr-3" />
              <div>
                <span className="block font-semibold text-green-800 dark:text-green-300">OBE Attainment Info</span>
                <span className="text-xs text-green-600/70 dark:text-green-400/70">CO/PO attainment & KPIs</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-green-400 group-hover:translate-x-1 transition-transform" />
          </button>

          <button onClick={() => onNavigate('give_feedback')}
            className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors text-left group">
            <div className="flex items-center">
              <MessageSquare size={22} className="text-orange-600 dark:text-orange-400 mr-3" />
              <div>
                <span className="block font-semibold text-orange-800 dark:text-orange-300">Give Feedback</span>
                <span className="text-xs text-orange-600/70 dark:text-orange-400/70">Anonymous course feedback</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-orange-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentCoursePage;
