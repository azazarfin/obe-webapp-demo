import React, { useEffect, useState } from 'react';
import { Building2, BookOpen, Users, GraduationCap, Calendar, Loader2 } from 'lucide-react';
import api from '../../utils/api';

const fallbackStats = {
  totalDepartments: 0,
  totalCourses: 0,
  totalTeachers: 0,
  totalStudents: 0
};

const CentralDashboardOverview = ({ setActiveTab }) => {
  const [stats, setStats] = useState(fallbackStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const data = await api.get('/dashboard/central');
        setStats({
          totalDepartments: data.totalDepartments || 0,
          totalCourses: data.totalCourses || 0,
          totalTeachers: data.totalTeachers || 0,
          totalStudents: data.totalStudents || 0
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const statCards = [
    { title: 'Total Departments', count: stats.totalDepartments, icon: <Building2 className="text-blue-500" size={24} />, tab: 'departments' },
    { title: 'Total Courses Data', count: stats.totalCourses, icon: <BookOpen className="text-indigo-500" size={24} />, tab: 'courses' },
    { title: 'Total Teachers', count: stats.totalTeachers, icon: <Users className="text-orange-500" size={24} />, tab: 'teachers' },
    { title: 'Total Students', count: stats.totalStudents, icon: <GraduationCap className="text-green-500" size={24} />, tab: 'students' }
  ];

  const tiles = [
    { title: 'Department Info', desc: 'Manage faculties', icon: <Building2 size={22} />, iconClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', tab: 'departments' },
    { title: 'Course Info', desc: 'Manage syllabus schema', icon: <BookOpen size={22} />, iconClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', tab: 'courses' },
    { title: 'Teacher Info', desc: 'Manage staff records', icon: <Users size={22} />, iconClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', tab: 'teachers' },
    { title: 'Student Info', desc: 'Manage student roster', icon: <GraduationCap size={22} />, iconClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', tab: 'students' },
    { title: 'Manage Series', desc: 'Add or remove series', icon: <Calendar size={22} />, iconClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', tab: 'series' }
  ];

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <button
            key={stat.tab}
            type="button"
            className="bg-white dark:bg-[#1e1e1e] p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow text-left"
            onClick={() => setActiveTab(stat.tab)}
          >
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{stat.title}</p>
              {loading ? (
                <Loader2 className="animate-spin text-ruet-blue" size={24} />
              ) : (
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stat.count}</h3>
              )}
            </div>
            <div className="p-3 bg-gray-50 dark:bg-[#2d2d2d] rounded-full">
              {stat.icon}
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {tiles.map((item) => (
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
};

export default CentralDashboardOverview;
