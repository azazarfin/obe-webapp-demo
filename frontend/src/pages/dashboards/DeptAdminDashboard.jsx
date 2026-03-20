import React, { useEffect, useState } from 'react';
import { BookOpen, UserCheck, GraduationCap, ClipboardList, Building2, Loader2 } from 'lucide-react';
import CourseReviewHub from '../admin/CourseReviewHub';
import DeptCourseManagement from '../admin/DeptCourseManagement';
import DeptStudentInfo from '../admin/DeptStudentInfo';
import DeptAddCourse from '../admin/DeptAddCourse';
import TeacherInfo from '../admin/TeacherInfo';
import api from '../../utils/api';

const initialSummary = {
  department: null,
  runningClassInstances: 0,
  reportCount: 0
};

const actionTiles = [
  { title: 'Course Management', desc: 'Assign teachers to courses', icon: <ClipboardList size={22} />, iconClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', tab: 'course_mgmt' },
  { title: 'Add / Edit Courses', desc: 'Manage department syllabus', icon: <BookOpen size={22} />, iconClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', tab: 'add_course' },
  { title: 'Teacher Info', desc: 'View & add faculty', icon: <UserCheck size={22} />, iconClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', tab: 'teachers' },
  { title: 'Student Info', desc: 'Filter by series & section', icon: <GraduationCap size={22} />, iconClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', tab: 'students' }
];

const DeptAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [summary, setSummary] = useState(initialSummary);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoadingSummary(true);
        const data = await api.get('/dashboard/department');
        setSummary({
          department: data.department || null,
          runningClassInstances: data.runningClassInstances || 0,
          reportCount: data.reportCount || 0
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingSummary(false);
      }
    };

    fetchSummary();
  }, []);

  const renderOverview = () => (
    <div className="space-y-6">
      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Building2 className="text-ruet-blue dark:text-blue-400" size={24} />
            </div>
            <div>
              <h3 className="text-sm text-gray-500 dark:text-gray-400">My Department</h3>
              {loadingSummary ? (
                <Loader2 className="animate-spin text-ruet-blue mt-1" size={18} />
              ) : (
                <p className="text-2xl font-bold text-ruet-blue dark:text-blue-400">
                  {summary.department?.shortName || summary.department?.name || 'N/A'}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">Running Class Instances</h3>
          {loadingSummary ? (
            <Loader2 className="animate-spin text-ruet-blue mt-3" size={20} />
          ) : (
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{summary.runningClassInstances}</p>
          )}
        </div>

        <button
          type="button"
          className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800 cursor-pointer hover:shadow-md transition-shadow group text-left"
          onClick={() => setActiveTab('reviews')}
        >
          <h3 className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-ruet-blue transition-colors">Course Review Hub</h3>
          {loadingSummary ? (
            <Loader2 className="animate-spin text-green-600 mt-3" size={20} />
          ) : (
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
              {summary.reportCount} <span className="text-sm font-medium text-gray-500">Reports</span>
            </p>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actionTiles.map((item) => (
          <button
            key={item.tab}
            onClick={() => setActiveTab(item.tab)}
            className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-5 border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all group text-left w-full"
          >
            <div className={`p-3 rounded-lg mb-3 inline-block ${item.iconClass} group-hover:scale-110 transition-transform`}>
              {item.icon}
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">{item.title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'course_mgmt':
        return <DeptCourseManagement />;
      case 'add_course':
        return <DeptAddCourse />;
      case 'teachers':
        return <TeacherInfo />;
      case 'students':
        return <DeptStudentInfo />;
      case 'reviews':
        return <CourseReviewHub />;
      case 'overview':
      default:
        return renderOverview();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 dark:border-gray-800 pb-4 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Department Admin Panel</h1>
        {activeTab !== 'overview' && (
          <button onClick={() => setActiveTab('overview')} className="text-sm text-gray-600 dark:text-gray-400 hover:text-ruet-blue dark:hover:text-white font-medium flex items-center">
            &larr; Back to Overview
          </button>
        )}
      </div>
      {renderContent()}
    </div>
  );
};

export default DeptAdminDashboard;
