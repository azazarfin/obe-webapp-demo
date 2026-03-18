import React from 'react';
import { ClipboardList, BookOpen, Users, CalendarCheck, BarChart3, FileText, UserCog, MessageSquare, GraduationCap } from 'lucide-react';

const mockCourseData = {
  code: 'CSE 3101',
  name: 'Database Systems',
  type: 'Theory',
  series: '2021',
  section: 'A',
  students: 55,
  ctsTaken: 3,
  assignmentsTaken: 2,
  attendanceClasses: 28,
  totalClasses: 40,
};

const mockSessionalData = {
  code: 'CSE 3102',
  name: 'Database Systems Lab',
  type: 'Sessional',
  series: '2021',
  section: 'A',
  students: 55,
  quizzesTaken: 2,
  reportsTaken: 4,
  vivasTaken: 1,
  attendanceClasses: 12,
  totalClasses: 15,
};

const TeacherCoursePage = ({ courseType = 'Theory', onNavigate }) => {
  const course = courseType === 'Theory' ? mockCourseData : mockSessionalData;
  const isTheory = course.type === 'Theory';

  const stats = isTheory
    ? [
        { label: 'Students', value: course.students, icon: <Users size={20} className="text-blue-500" /> },
        { label: 'CTs Taken', value: course.ctsTaken, icon: <ClipboardList size={20} className="text-indigo-500" /> },
        { label: 'Assignments', value: course.assignmentsTaken, icon: <FileText size={20} className="text-green-500" /> },
        { label: 'Attendance', value: `${course.attendanceClasses}/${course.totalClasses}`, icon: <CalendarCheck size={20} className="text-orange-500" /> },
      ]
    : [
        { label: 'Students', value: course.students, icon: <Users size={20} className="text-blue-500" /> },
        { label: 'Quizzes', value: course.quizzesTaken, icon: <ClipboardList size={20} className="text-indigo-500" /> },
        { label: 'Reports', value: course.reportsTaken, icon: <FileText size={20} className="text-green-500" /> },
        { label: 'Attendance', value: `${course.attendanceClasses}/${course.totalClasses}`, icon: <CalendarCheck size={20} className="text-orange-500" /> },
      ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{course.code} — {course.name}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${isTheory ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'}`}>
                {course.type}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Section {course.section} · Series {course.series}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-[#1e1e1e] shadow-sm rounded-lg p-4 border border-gray-100 dark:border-gray-800 flex items-center space-x-3">
            <div className="p-2 bg-gray-50 dark:bg-[#2d2d2d] rounded-full">{stat.icon}</div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button onClick={() => onNavigate('attendance')}
            className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-left group">
            <CalendarCheck size={22} className="text-blue-600 dark:text-blue-400 mr-3 group-hover:scale-110 transition-transform" />
            <div>
              <span className="block font-semibold text-blue-800 dark:text-blue-300">Take Attendance</span>
              <span className="text-xs text-blue-600/70 dark:text-blue-400/70">Mark daily class attendance</span>
            </div>
          </button>

          {isTheory ? (
            <button onClick={() => onNavigate('assessment')}
              className="flex items-center p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors text-left group">
              <ClipboardList size={22} className="text-indigo-600 dark:text-indigo-400 mr-3 group-hover:scale-110 transition-transform" />
              <div>
                <span className="block font-semibold text-indigo-800 dark:text-indigo-300">Add CT / Assignment</span>
                <span className="text-xs text-indigo-600/70 dark:text-indigo-400/70">Theory course assessments</span>
              </div>
            </button>
          ) : (
            <button onClick={() => onNavigate('sessional_assessment')}
              className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors text-left group">
              <BookOpen size={22} className="text-purple-600 dark:text-purple-400 mr-3 group-hover:scale-110 transition-transform" />
              <div>
                <span className="block font-semibold text-purple-800 dark:text-purple-300">Add Assessment</span>
                <span className="text-xs text-purple-600/70 dark:text-purple-400/70">Lab/sessional assessments</span>
              </div>
            </button>
          )}

          {isTheory && (
            <button onClick={() => onNavigate('semester_final')}
              className="flex items-center p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors text-left group">
              <GraduationCap size={22} className="text-teal-600 dark:text-teal-400 mr-3 group-hover:scale-110 transition-transform" />
              <div>
                <span className="block font-semibold text-teal-800 dark:text-teal-300">Semester Final</span>
                <span className="text-xs text-teal-600/70 dark:text-teal-400/70">Part A & Part B marking</span>
              </div>
            </button>
          )}

          <button onClick={() => onNavigate('roster')}
            className="flex items-center p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left group">
            <UserCog size={22} className="text-gray-600 dark:text-gray-400 mr-3 group-hover:scale-110 transition-transform" />
            <div>
              <span className="block font-semibold text-gray-800 dark:text-gray-300">Modify Student Roster</span>
              <span className="text-xs text-gray-500 dark:text-gray-400/70">Add irregular or drop students</span>
            </div>
          </button>

          <button onClick={() => onNavigate('evaluation')}
            className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors text-left group">
            <BarChart3 size={22} className="text-green-600 dark:text-green-400 mr-3 group-hover:scale-110 transition-transform" />
            <div>
              <span className="block font-semibold text-green-800 dark:text-green-300">Evaluation Report</span>
              <span className="text-xs text-green-600/70 dark:text-green-400/70">Marksheet & OBE attainment</span>
            </div>
          </button>

          <button onClick={() => onNavigate('feedback')}
            className="flex items-center p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors text-left group">
            <MessageSquare size={22} className="text-orange-600 dark:text-orange-400 mr-3 group-hover:scale-110 transition-transform" />
            <div>
              <span className="block font-semibold text-orange-800 dark:text-orange-300">Student Feedback</span>
              <span className="text-xs text-orange-600/70 dark:text-orange-400/70">Publish & view feedback</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherCoursePage;
