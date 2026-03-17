import React, { useState } from 'react';
import TakeAttendance from '../teacher/TakeAttendance';
import AddAssessment from '../teacher/AddAssessment';
import AddSessionalAssessment from '../teacher/AddSessionalAssessment';
import EvaluationReport from '../teacher/EvaluationReport';
import InstructorExperienceReport from '../teacher/InstructorExperienceReport';
import ModifyStudentRoster from '../teacher/ModifyStudentRoster';
import ManageCourseFeedback from '../teacher/ManageCourseFeedback';
import TeacherCoursePage from '../teacher/TeacherCoursePage';

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCourseType, setSelectedCourseType] = useState('Theory');

  const handleCourseClick = (courseType) => {
    setSelectedCourseType(courseType);
    setActiveTab('course_page');
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'course_page':
        return <TeacherCoursePage courseType={selectedCourseType} onNavigate={(tab) => setActiveTab(tab)} />;
      case 'attendance':
        return <TakeAttendance />;
      case 'assessment':
        return <AddAssessment />;
      case 'sessional_assessment':
        return <AddSessionalAssessment />;
      case 'evaluation':
        return <EvaluationReport />;
      case 'roster':
        return <ModifyStudentRoster />;
      case 'feedback':
        return <ManageCourseFeedback />;
      case 'experience_report':
        return <InstructorExperienceReport onBack={() => setActiveTab('overview')} />;
      case 'overview':
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Running Courses</h2>
              <ul className="space-y-3">
                <li className="p-4 bg-gray-50 dark:bg-[#2d2d2d] rounded-lg border border-transparent hover:border-ruet-blue/30 transition-all cursor-pointer"
                    onClick={() => handleCourseClick('Theory')}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-800 dark:text-gray-200">CSE 3101 - Database Systems</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Section A, 2021 Series</p>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded">Theory</span>
                  </div>
                </li>

                <li className="p-4 bg-gray-50 dark:bg-[#2d2d2d] rounded-lg border border-transparent hover:border-purple-400/30 transition-all cursor-pointer"
                    onClick={() => handleCourseClick('Sessional')}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-800 dark:text-gray-200">CSE 3102 - Database Systems Lab</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Section A, 2021 Series</p>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded">Sessional</span>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Finished Courses</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Past marks, OBE sheets, and feedback reports.</p>
              <ul className="space-y-3">
                 <li className="flex justify-between items-center p-3 border border-gray-100 dark:border-gray-700 rounded-md">
                    <span className="font-medium text-gray-800 dark:text-gray-300">CSE 2101 - Data Structures</span>
                    <div className="space-x-3">
                       <button onClick={() => setActiveTab('experience_report')} className="text-sm text-orange-600 hover:underline">Submit Feedback</button>
                       <button onClick={() => setActiveTab('evaluation')} className="text-sm text-ruet-blue hover:underline">View Reports</button>
                    </div>
                 </li>
              </ul>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
         <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Teacher Dashboard</h1>
         {activeTab !== 'overview' && (
            <button 
               onClick={() => activeTab === 'course_page' ? setActiveTab('overview') : setActiveTab('course_page')}
               className="text-sm text-gray-600 dark:text-gray-400 hover:text-ruet-blue dark:hover:text-white font-medium"
            >
               &larr; {activeTab === 'course_page' ? 'Back to Overview' : 'Back to Course Page'}
            </button>
         )}
      </div>
      
      {renderContent()}
    </div>
  );
};

export default TeacherDashboard;
