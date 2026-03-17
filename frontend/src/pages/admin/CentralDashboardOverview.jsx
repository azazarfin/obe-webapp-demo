import React from 'react';
import { Building2, BookOpen, Users, GraduationCap, Calendar } from 'lucide-react';

const CentralDashboardOverview = ({ setActiveTab }) => {
  const stats = [
    { title: 'Total Departments', count: 14, icon: <Building2 className="text-blue-500" size={24} />, tab: 'departments' },
    { title: 'Total Courses Data', count: 245, icon: <BookOpen className="text-indigo-500" size={24} />, tab: 'courses' },
    { title: 'Total Teachers', count: 320, icon: <Users className="text-orange-500" size={24} />, tab: 'teachers' },
    { title: 'Total Students', count: 4500, icon: <GraduationCap className="text-green-500" size={24} />, tab: 'students' },
  ];

  const tiles = [
    { title: 'Department Info', desc: 'Manage faculties', icon: <Building2 size={22} />, color: 'blue', tab: 'departments' },
    { title: 'Course Info', desc: 'Manage syllabus schema', icon: <BookOpen size={22} />, color: 'indigo', tab: 'courses' },
    { title: 'Teacher Info', desc: 'Manage staff records', icon: <Users size={22} />, color: 'green', tab: 'teachers' },
    { title: 'Student Info', desc: 'Manage student roster', icon: <GraduationCap size={22} />, color: 'yellow', tab: 'students' },
    { title: 'Manage Series', desc: 'Add or remove series', icon: <Calendar size={22} />, color: 'purple', tab: 'series' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-[#1e1e1e] p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab(stat.tab)}>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{stat.title}</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stat.count}</h3>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-[#2d2d2d] rounded-full">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {tiles.map(item => (
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
};

export default CentralDashboardOverview;
