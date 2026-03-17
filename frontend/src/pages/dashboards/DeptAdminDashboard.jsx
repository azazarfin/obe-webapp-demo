import React, { useState } from 'react';
import { BookOpen, UserCheck, GraduationCap, ClipboardList, FileText, ChevronRight, Building2 } from 'lucide-react';
import CourseReviewHub from '../admin/CourseReviewHub';
import DeptCourseManagement from '../admin/DeptCourseManagement';
import DeptStudentInfo from '../admin/DeptStudentInfo';
import DeptAddCourse from '../admin/DeptAddCourse';
import TeacherInfo from '../admin/TeacherInfo';

const DeptAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><Building2 className="text-ruet-blue dark:text-blue-400" size={24} /></div>
            <div>
              <h3 className="text-sm text-gray-500 dark:text-gray-400">My Department</h3>
              <p className="text-2xl font-bold text-ruet-blue dark:text-blue-400">CSE</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">Running Class Instances</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">45</p>
        </div>
        <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800 cursor-pointer hover:shadow-md transition-shadow group" onClick={() => setActiveTab('reviews')}>
          <h3 className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-ruet-blue transition-colors">Course Review Hub &rarr;</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">12 <span className="text-sm font-medium text-gray-500">New Reports</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[ 
          { title: 'Course Management', desc: 'Assign teachers to courses', icon: <ClipboardList size={22} />, color: 'indigo', tab: 'course_mgmt' },
          { title: 'Add / Edit Courses', desc: 'Manage department syllabus', icon: <BookOpen size={22} />, color: 'yellow', tab: 'add_course' },
          { title: 'Teacher Info', desc: 'View & add faculty', icon: <UserCheck size={22} />, color: 'green', tab: 'teachers' },
          { title: 'Student Info', desc: 'Filter by series & section', icon: <GraduationCap size={22} />, color: 'blue', tab: 'students' },
        ].map(item => (
          <button key={item.tab} onClick={() => setActiveTab(item.tab)}
            className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-5 border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all group text-left w-full">
            <div className={`p-3 rounded-lg mb-3 inline-block bg-${item.color}-100 dark:bg-${item.color}-900/30 text-${item.color}-700 dark:text-${item.color}-400 group-hover:scale-110 transition-transform`}>
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
      case 'course_mgmt': return <DeptCourseManagement />;
      case 'add_course': return <DeptAddCourse />;
      case 'teachers': return <TeacherInfo />;
      case 'students': return <DeptStudentInfo />;
      case 'reviews': return <CourseReviewHub />;
      case 'overview': default: return renderOverview();
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
