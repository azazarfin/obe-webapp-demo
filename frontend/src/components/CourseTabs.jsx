import React from 'react';
import { 
  BarChart3, 
  CalendarCheck, 
  ClipboardList, 
  FileText, 
  UserCog, 
  MessageSquare,
  LayoutDashboard
} from 'lucide-react';

const CourseTabs = ({ activeTab, onNavigate, tabsConfig }) => {
  return (
    <div className="bg-white dark:bg-[#1E293B] border-b border-gray-200 dark:border-white/10 px-4 pt-3 flex overflow-x-auto hide-scrollbar sticky top-0 z-20 shadow-sm mb-6 rounded-t-lg">
      <div className="flex space-x-2 pb-1">
        {tabsConfig.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onNavigate(tab.key)}
              className={`flex items-center px-4 py-2.5 rounded-t-lg transition-colors font-medium text-sm whitespace-nowrap min-w-fit ${
                isActive 
                  ? 'bg-ruet-blue text-white dark:bg-blue-600 border-b-2 border-[#1E293B] dark:border-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 border-b-2 border-transparent'
              }`}
            >
              {Icon && <Icon size={16} className="mr-2" />}
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CourseTabs;
