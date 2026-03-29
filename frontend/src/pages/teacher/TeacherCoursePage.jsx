import React, { useMemo } from 'react';
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  Loader2,
  MessageSquare,
  Pencil,
  UserCog,
  Users
} from 'lucide-react';
import { useGetClassSummaryQuery } from '../../store/slices/classInstanceSlice';

const actionCardClasses = {
  blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-800 dark:text-blue-300',
  indigo: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300',
  purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-800 dark:text-purple-300',
  teal: 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-teal-800 dark:text-teal-300',
  gray: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-300',
  green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-800 dark:text-green-300',
  orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/40 text-orange-800 dark:text-orange-300',
  amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300',
  rose: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-800 dark:text-rose-300'
};

const TeacherCoursePage = ({ classInstance, onNavigate, mode = 'teacher-running' }) => {
  const { data: summary, isLoading: loading, error: fetchError } = useGetClassSummaryQuery(classInstance?._id, {
    skip: !classInstance?._id
  });
  const error = fetchError?.data?.error || fetchError?.message || '';

  const course = summary?.classInstance?.course || classInstance?.course;
  const stats = summary?.stats;
  const isTheory = course?.type !== 'Sessional';
  const sectionLabel = classInstance?.section === 'N/A' ? 'No Section' : `Section ${classInstance?.section}`;

  const statTiles = useMemo(() => {
    if (!stats) return [];

    return isTheory
      ? [
          { label: 'Students', value: stats.students, icon: <Users size={20} className="text-blue-500" /> },
          { label: 'CTs Taken', value: stats.ctsTaken, icon: <ClipboardList size={20} className="text-indigo-500" /> },
          { label: 'Assignments', value: stats.assignmentsTaken, icon: <FileText size={20} className="text-green-500" /> },
          { label: 'Attendance', value: stats.attendanceClasses, icon: <CalendarCheck size={20} className="text-orange-500" /> }
        ]
      : [
          { label: 'Students', value: stats.students, icon: <Users size={20} className="text-blue-500" /> },
          { label: 'Quizzes', value: stats.quizzesTaken, icon: <ClipboardList size={20} className="text-indigo-500" /> },
          { label: 'Reports', value: stats.reportsTaken, icon: <FileText size={20} className="text-green-500" /> },
          { label: 'Attendance', value: stats.attendanceClasses, icon: <CalendarCheck size={20} className="text-orange-500" /> }
        ];
  }, [isTheory, stats]);

  const actionTiles = useMemo(() => {
    if (mode === 'teacher-finished') {
      return [
        {
          key: 'evaluation',
          title: 'Evaluation Report',
          description: 'Marksheet and OBE attainment',
          icon: <BarChart3 size={22} className="text-green-600 dark:text-green-400 mr-3 group-hover:scale-110 transition-transform" />,
          tone: 'green'
        },
        {
          key: 'feedback',
          title: 'Student Feedback',
          description: 'Publish and review student feedback',
          icon: <MessageSquare size={22} className="text-orange-600 dark:text-orange-400 mr-3 group-hover:scale-110 transition-transform" />,
          tone: 'amber'
        },
        {
          key: 'experience_report',
          title: 'Submit Feedback and Report',
          description: 'Reserved for the upcoming teacher feedback workflow',
          icon: <FileText size={22} className="text-indigo-600 dark:text-indigo-400 mr-3 group-hover:scale-110 transition-transform" />,
          tone: 'indigo'
        }
      ];
    }

    if (mode === 'dept-admin') {
      return [
        {
          key: 'evaluation',
          title: 'Evaluation Report',
          description: 'Marksheet and OBE attainment',
          icon: <BarChart3 size={22} className="text-green-600 dark:text-green-400 mr-3 group-hover:scale-110 transition-transform" />,
          tone: 'green'
        },
        {
          key: 'feedback',
          title: 'Student Feedback',
          description: 'Publish and review student feedback',
          icon: <MessageSquare size={22} className="text-orange-600 dark:text-orange-400 mr-3 group-hover:scale-110 transition-transform" />,
          tone: 'amber'
        },
        {
          key: 'experience_report',
          title: 'Teacher Feedback and Report',
          description: 'Reserved for the upcoming teacher feedback workflow',
          icon: <FileText size={22} className="text-indigo-600 dark:text-indigo-400 mr-3 group-hover:scale-110 transition-transform" />,
          tone: 'indigo'
        }
      ];
    }

    const tiles = [
      {
        key: 'attendance',
        title: 'Take Attendance',
        description: 'Mark daily class attendance',
        icon: <CalendarCheck size={22} className="text-blue-600 dark:text-blue-400 mr-3 group-hover:scale-110 transition-transform" />,
        tone: 'blue'
      },
      isTheory
        ? {
            key: 'assessment',
            title: 'Add CT / Assignment',
            description: 'Theory course assessments',
            icon: <ClipboardList size={22} className="text-indigo-600 dark:text-indigo-400 mr-3 group-hover:scale-110 transition-transform" />,
            tone: 'indigo'
          }
        : {
            key: 'sessional_assessment',
            title: 'Add Assessment',
            description: 'Lab and sessional assessments',
            icon: <BookOpen size={22} className="text-purple-600 dark:text-purple-400 mr-3 group-hover:scale-110 transition-transform" />,
            tone: 'purple'
          }
    ];

    if (isTheory) {
      tiles.push({
        key: 'semester_final',
        title: 'Semester Final',
        description: 'Configure and save final question marks',
        icon: <GraduationCap size={22} className="text-teal-600 dark:text-teal-400 mr-3 group-hover:scale-110 transition-transform" />,
        tone: 'teal'
      });
    }

    tiles.push(
      {
        key: 'manage_assessments',
        title: 'Manage Assessments',
        description: 'Edit marks, metadata, or delete assessments',
        icon: <Pencil size={22} className="text-red-600 dark:text-red-400 mr-3 group-hover:scale-110 transition-transform" />,
        tone: 'rose'
      },
      {
        key: 'roster',
        title: 'Modify Student Roster',
        description: 'Add irregular or hide dropped students',
        icon: <UserCog size={22} className="text-gray-600 dark:text-gray-400 mr-3 group-hover:scale-110 transition-transform" />,
        tone: 'gray'
      },
      {
        key: 'evaluation',
        title: 'Evaluation Report',
        description: 'Marksheet and OBE attainment',
        icon: <BarChart3 size={22} className="text-green-600 dark:text-green-400 mr-3 group-hover:scale-110 transition-transform" />,
        tone: 'green'
      },
      {
        key: 'feedback',
        title: 'Student Feedback',
        description: 'Publish and review student feedback',
        icon: <MessageSquare size={22} className="text-orange-600 dark:text-orange-400 mr-3 group-hover:scale-110 transition-transform" />,
        tone: 'amber'
      }
    );

    return tiles;
  }, [isTheory, mode]);

  if (!classInstance) {
    return null;
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-ruet-blue" size={28} /></div>;
  }

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded text-sm">{error}</div>}

      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{course?.courseCode} - {course?.courseName}</h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${isTheory ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'}`}>
                {course?.type}
              </span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${classInstance?.status === 'Finished' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
                {classInstance?.status || 'Running'}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{sectionLabel} | Series {classInstance?.series}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statTiles.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-[#1e1e1e] shadow-sm rounded-lg p-4 border border-gray-100 dark:border-gray-800 flex items-center space-x-3">
            <div className="p-2 bg-gray-50 dark:bg-[#2d2d2d] rounded-full">{stat.icon}</div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          {mode === 'teacher-running' ? 'Quick Actions' : 'Course Tools'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {actionTiles.map((tile) => (
            <button
              key={tile.key}
              onClick={() => onNavigate(tile.key)}
              className={`flex items-center p-4 border rounded-lg transition-colors text-left group ${actionCardClasses[tile.tone]}`}
            >
              {tile.icon}
              <div>
                <span className="block font-semibold">{tile.title}</span>
                <span className="text-xs opacity-80">{tile.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherCoursePage;
