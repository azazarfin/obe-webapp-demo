import React, { useEffect, useState } from 'react';
import { User, Mail, Building, BookOpen, Loader2 } from 'lucide-react';
import TakeAttendance from '../teacher/TakeAttendance';
import AddAssessment from '../teacher/AddAssessment';
import AddSessionalAssessment from '../teacher/AddSessionalAssessment';
import EvaluationReport from '../teacher/EvaluationReport';
import InstructorExperienceReport from '../teacher/InstructorExperienceReport';
import ModifyStudentRoster from '../teacher/ModifyStudentRoster';
import ManageCourseFeedback from '../teacher/ManageCourseFeedback';
import TeacherCoursePage from '../teacher/TeacherCoursePage';
import SemesterFinalMarking from '../teacher/SemesterFinalMarking';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [runningInstances, setRunningInstances] = useState([]);
  const [finishedInstances, setFinishedInstances] = useState([]);
  const [loadingInst, setLoadingInst] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchInstances = async () => {
      const teacherId = currentUser?._id || currentUser?.id;
      if (!teacherId) return;

      try {
        setLoadingInst(true);
        setError('');
        const [running, finished] = await Promise.all([
          api.get(`/class-instances?teacher=${teacherId}&status=Running`),
          api.get(`/class-instances?teacher=${teacherId}&status=Finished`)
        ]);
        setRunningInstances(Array.isArray(running) ? running : []);
        setFinishedInstances(Array.isArray(finished) ? finished : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingInst(false);
      }
    };

    fetchInstances();
  }, [currentUser]);

  const handleCourseClick = (instance) => {
    setSelectedInstance(instance);
    setActiveTab('course_page');
  };

  const handleFinishedAction = (instance, targetTab) => {
    setSelectedInstance(instance);
    setActiveTab(targetTab);
  };

  const renderContent = () => {
    const courseType = selectedInstance?.course?.type || 'Theory';

    switch (activeTab) {
      case 'course_page':
        return <TeacherCoursePage classInstance={selectedInstance} onNavigate={(tab) => setActiveTab(tab)} />;
      case 'attendance':
        return <TakeAttendance classInstance={selectedInstance} />;
      case 'assessment':
        return <AddAssessment classInstance={selectedInstance} />;
      case 'sessional_assessment':
        return <AddSessionalAssessment classInstance={selectedInstance} />;
      case 'semester_final':
        return <SemesterFinalMarking classInstance={selectedInstance} />;
      case 'evaluation':
        return <EvaluationReport courseType={courseType} classInstance={selectedInstance} />;
      case 'roster':
        return <ModifyStudentRoster classInstance={selectedInstance} />;
      case 'feedback':
        return <ManageCourseFeedback classInstance={selectedInstance} />;
      case 'experience_report':
        return <InstructorExperienceReport classInstance={selectedInstance} onBack={() => setActiveTab('overview')} />;
      case 'overview':
      default:
        return (
          <div className="space-y-6">
            {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded text-sm">{error}</div>}

            <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-ruet-blue/10 dark:bg-blue-900/30 flex items-center justify-center">
                  <User size={28} className="text-ruet-blue dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{currentUser?.name}</h2>
                  <p className="text-sm text-ruet-blue dark:text-blue-400 font-medium">{currentUser?.designation}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <div className="text-center p-2">
                  <p className="text-xs text-gray-500 uppercase font-medium flex items-center justify-center"><Building size={12} className="mr-1" />Department</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5">{currentUser?.department?.shortName || currentUser?.department?.name || 'N/A'}</p>
                </div>
                <div className="text-center p-2">
                  <p className="text-xs text-gray-500 uppercase font-medium flex items-center justify-center"><Mail size={12} className="mr-1" />Email</p>
                  <p className="text-sm font-medium text-ruet-blue dark:text-blue-400 mt-0.5 break-all">{currentUser?.email}</p>
                </div>
                <div className="text-center p-2">
                  <p className="text-xs text-gray-500 uppercase font-medium flex items-center justify-center"><BookOpen size={12} className="mr-1" />Running Courses</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{runningInstances.length}</p>
                </div>
                <div className="text-center p-2">
                  <p className="text-xs text-gray-500 uppercase font-medium flex items-center justify-center"><BookOpen size={12} className="mr-1" />Finished Courses</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{finishedInstances.length}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Running Courses</h2>
                {loadingInst ? (
                  <div className="flex justify-center py-6"><Loader2 className="animate-spin text-ruet-blue" size={24} /></div>
                ) : runningInstances.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">No running courses assigned.</p>
                ) : (
                  <ul className="space-y-3">
                    {runningInstances.map((instance) => (
                      <li key={instance._id} className="p-4 bg-gray-50 dark:bg-[#2d2d2d] rounded-lg border border-transparent hover:border-ruet-blue/30 transition-all cursor-pointer" onClick={() => handleCourseClick(instance)}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-gray-800 dark:text-gray-200">{instance.course?.courseCode} - {instance.course?.courseName}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Section {instance.section}, {instance.series} Series</p>
                          </div>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded ${instance.course?.type === 'Sessional' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>{instance.course?.type}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Finished Courses</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Past reports, feedback summaries, and instructor reflections.</p>
                {loadingInst ? (
                  <div className="flex justify-center py-6"><Loader2 className="animate-spin text-ruet-blue" size={24} /></div>
                ) : finishedInstances.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">No finished courses yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {finishedInstances.map((instance) => (
                      <li key={instance._id} className="flex justify-between items-center p-3 border border-gray-100 dark:border-gray-700 rounded-md">
                        <span className="font-medium text-gray-800 dark:text-gray-300">{instance.course?.courseCode} - {instance.course?.courseName}</span>
                        <div className="space-x-3">
                          <button onClick={() => handleFinishedAction(instance, 'experience_report')} className="text-sm text-orange-600 hover:underline">Submit Feedback</button>
                          <button onClick={() => handleFinishedAction(instance, 'evaluation')} className="text-sm text-ruet-blue hover:underline">View Reports</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
          <button onClick={() => activeTab === 'course_page' ? setActiveTab('overview') : setActiveTab('course_page')} className="text-sm text-gray-600 dark:text-gray-400 hover:text-ruet-blue dark:hover:text-white font-medium">
            &larr; {activeTab === 'course_page' ? 'Back to Overview' : 'Back to Course Page'}
          </button>
        )}
      </div>

      {renderContent()}
    </div>
  );
};

export default TeacherDashboard;
