import React, { useState } from 'react';
import { BookOpen, Award, ChevronRight, User, GraduationCap } from 'lucide-react';
import UniversityDirectory from '../student/UniversityDirectory';
import StudentFeedback from '../student/StudentFeedback';
import StudentCoursePage from '../student/StudentCoursePage';
import StudentOBEAttainment from '../student/StudentOBEAttainment';
import StudentMarksheet from '../student/StudentMarksheet';
import StudentAttendanceInfo from '../student/StudentAttendanceInfo';
import { useAuth } from '../../contexts/AuthContext';




const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const { currentUser } = useAuth();

  const mockEnrolledCourses = [];
  const mockFinishedCourses = [];
  const mockGlobalObe = {};

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    setActiveTab('course_page');
  };

  const handleSubNavigate = (tab) => {
    setActiveTab(tab);
  };

  const getBackTarget = () => {
    if (['attendance_info', 'marksheet', 'obe_attainment', 'give_feedback'].includes(activeTab)) return 'course_page';
    if (activeTab === 'course_page') return 'overview';
    return 'overview';
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-ruet-blue/10 dark:bg-blue-900/30 flex items-center justify-center">
            <User size={28} className="text-ruet-blue dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{currentUser?.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Roll: {currentUser?.rollNumber} · {currentUser?.department?.shortName || '—'} · Series {currentUser?.series} · Section {currentUser?.section}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="text-center p-2">
            <p className="text-xs text-gray-500 uppercase font-medium">Email</p>
            <p className="text-sm font-medium text-ruet-blue dark:text-blue-400 mt-0.5 break-all">{currentUser?.email}</p>
          </div>
          <div className="text-center p-2">
            <p className="text-xs text-gray-500 uppercase font-medium">Running Courses</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{mockEnrolledCourses.length}</p>
          </div>
          <div className="text-center p-2">
            <p className="text-xs text-gray-500 uppercase font-medium">Completed</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{mockFinishedCourses.length}</p>
          </div>
          <div className="text-center p-2">
            <p className="text-xs text-gray-500 uppercase font-medium">Avg. Attendance</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-0.5">{Math.round(mockEnrolledCourses.reduce((s, c) => s + c.attendance, 0) / mockEnrolledCourses.length)}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
              <BookOpen className="mr-2 text-ruet-blue" size={20} /> Running Courses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockEnrolledCourses.map(course => (
                <div key={course.id} onClick={() => handleCourseClick(course)}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:border-ruet-blue dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group bg-gray-50 dark:bg-[#2d2d2d]">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-ruet-blue dark:group-hover:text-blue-400 transition-colors">{course.code}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{course.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{course.teacher}</p>
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-gray-500 uppercase font-semibold">Attendance</span>
                      <p className={`font-bold ${course.attendance >= 75 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{course.attendance}%</p>
                    </div>
                    <ChevronRight className="text-gray-400 group-hover:text-ruet-blue transition-colors" size={20} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
              <GraduationCap className="mr-2 text-gray-500" size={20} /> Finished Courses
            </h2>
            <div className="space-y-2">
              {mockFinishedCourses.map(course => (
                <div key={course.id} onClick={() => handleCourseClick({ ...course, attendance: 100, marks: { ct: { earned: 18, total: 20 }, attendance: { earned: 9.5, total: 10 }, assignment: { earned: 9, total: 10 } }, obe: { CO1: { percentage: 92, threshold: 50 }, CO2: { percentage: 81, threshold: 50 }, CO3: { percentage: 78, threshold: 50 } }, isFinished: true })}
                  className="flex justify-between items-center p-3 rounded-md border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#2d2d2d] hover:border-ruet-blue/30 transition-all cursor-pointer group">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-ruet-blue dark:group-hover:text-blue-400 transition-colors">{course.code} — {course.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{course.teacher}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 text-sm font-bold text-ruet-blue dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-full">{course.grade}</span>
                    <ChevronRight className="text-gray-400 group-hover:text-ruet-blue transition-colors" size={16} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800 h-fit">
          <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
            <Award className="mr-2 text-yellow-500" size={20} /> Program Outcomes
          </h2>
          <div className="space-y-3">
            {Object.entries(mockGlobalObe).map(([po, val]) => (
              <div key={po} className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300 w-10">{po}</span>
                <div className="flex-1 mx-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${val >= 60 ? 'bg-ruet-blue dark:bg-blue-500' : 'bg-red-500'}`} style={{ width: `${val}%` }} />
                </div>
                <span className="font-bold text-gray-900 dark:text-white w-10 text-right">{val}%</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center italic">Aggregate across all completed courses.</p>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'directory': return <UniversityDirectory />;
      case 'course_page': return <StudentCoursePage course={selectedCourse} onNavigate={handleSubNavigate} />;
      case 'attendance_info': return <StudentAttendanceInfo course={selectedCourse} />;
      case 'marksheet': return <StudentMarksheet course={selectedCourse} />;
      case 'obe_attainment': return <StudentOBEAttainment course={selectedCourse} />;
      case 'give_feedback': return <StudentFeedback courseName={selectedCourse ? `${selectedCourse.code} - ${selectedCourse.name}` : ''} onBack={() => setActiveTab('course_page')} />;
      case 'overview': default: return renderOverview();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 dark:border-gray-800 pb-4 gap-4">
        <div className="flex items-center">
          {activeTab !== 'overview' && activeTab !== 'directory' && (
            <button onClick={() => setActiveTab(getBackTarget())} className="text-sm text-gray-600 dark:text-gray-400 hover:text-ruet-blue dark:hover:text-white font-medium mr-4">
              &larr; Back
            </button>
          )}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Portal</h1>
        </div>
        <div className="flex bg-gray-100 dark:bg-[#2d2d2d] p-1 rounded-lg">
          <button
            onClick={() => { setActiveTab('overview'); setSelectedCourse(null); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab !== 'directory' ? 'bg-white dark:bg-[#1e1e1e] shadow text-ruet-blue dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
          >
            My Academic Hub
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'directory' ? 'bg-white dark:bg-[#1e1e1e] shadow text-ruet-blue dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
          >
            University Directory
          </button>
        </div>
      </div>

      {renderContent()}
    </div>
  );
};

export default StudentDashboard;
