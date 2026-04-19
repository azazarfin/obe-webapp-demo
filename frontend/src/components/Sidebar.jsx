import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { buildNextWindowState, DASHBOARD_HISTORY_KEY, HISTORY_CHANGE_EVENT } from '../hooks/useHistoryBackedState';
import { 
  LayoutDashboard, 
  Building2, 
  BookOpen, 
  Users, 
  UserPlus, 
  GraduationCap, 
  BookMarked,
  Info 
} from 'lucide-react';

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { userRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState('overview');

  useEffect(() => {
    const handleHistoryChange = () => {
      let historyKey;
      if (userRole === 'CENTRAL_ADMIN') historyKey = 'central-admin-dashboard';
      else if (userRole === 'DEPT_ADMIN') historyKey = 'dept-admin-dashboard';
      else if (userRole === 'TEACHER') historyKey = 'teacher-dashboard';
      else if (userRole === 'STUDENT') historyKey = 'student-dashboard';

      if (historyKey && window.history.state?.[DASHBOARD_HISTORY_KEY]?.[historyKey]) {
        setCurrentTab(window.history.state[DASHBOARD_HISTORY_KEY][historyKey].activeTab || 'overview');
      }
    };
    
    handleHistoryChange();
    window.addEventListener('popstate', handleHistoryChange);
    window.addEventListener(HISTORY_CHANGE_EVENT, handleHistoryChange);
    return () => {
      window.removeEventListener('popstate', handleHistoryChange);
      window.removeEventListener(HISTORY_CHANGE_EVENT, handleHistoryChange);
    };
  }, [userRole]);

  const getNavItems = () => {
    switch (userRole) {
      case 'CENTRAL_ADMIN':
        return [
          { name: 'Dashboard', tabKey: 'overview', icon: LayoutDashboard },
          { name: 'Departments', tabKey: 'departments', icon: Building2 },
          { name: 'Courses', tabKey: 'courses', icon: BookOpen },
          { name: 'Teachers', tabKey: 'teachers', icon: Users },
          { name: 'Students', tabKey: 'students', icon: GraduationCap },
        ];
      case 'DEPT_ADMIN':
        return [
          { name: 'Dashboard', tabKey: 'overview', icon: LayoutDashboard },
          { name: 'Course Management', tabKey: 'course_mgmt', icon: BookOpen },
          { name: 'Add / Edit Courses', tabKey: 'add_course', icon: BookMarked },
          { name: 'Teachers', tabKey: 'teachers', icon: Users },
          { name: 'Students', tabKey: 'students', icon: GraduationCap },
        ];
      case 'TEACHER':
        return [
          { name: 'Dashboard', tabKey: 'overview', icon: LayoutDashboard },
        ];
      case 'STUDENT':
        return [
          { name: 'Dashboard', tabKey: 'overview', icon: LayoutDashboard },
          { name: 'Directory', tabKey: 'directory', icon: Users },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const handleNavClick = (tabKey) => {
    let historyKey = '';
    let basePath = '';
    
    if (userRole === 'CENTRAL_ADMIN') { historyKey = 'central-admin-dashboard'; basePath = '/central-admin'; }
    if (userRole === 'DEPT_ADMIN') { historyKey = 'dept-admin-dashboard'; basePath = '/dept-admin'; }
    if (userRole === 'TEACHER') { historyKey = 'teacher-dashboard'; basePath = '/teacher'; }
    if (userRole === 'STUDENT') { historyKey = 'student-dashboard'; basePath = '/student'; }

    // If somehow not on base path, navigate there first
    if (location.pathname !== basePath) {
      navigate(basePath, { replace: true });
    }

    const nextState = { activeTab: tabKey };
    if (userRole === 'STUDENT') nextState.selectedCourse = null; // reset course selection on nav
    if (userRole === 'TEACHER') nextState.selectedInstance = null; // reset instance on nav

    window.history.pushState(buildNextWindowState(historyKey, nextState), '', basePath);
    window.dispatchEvent(new Event(HISTORY_CHANGE_EVENT));
    
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  const NavContent = () => (
    <div className="flex flex-col h-full bg-[#171F32] text-white transition-all duration-300">
      <div className="flex items-center justify-center h-16 border-b border-white/10 px-4">
        <div className="flex items-center space-x-3 w-full">
            <img 
              src="/logo.png" 
              alt="RUET Logo" 
              className="h-10 w-10 object-contain bg-white rounded-lg p-1 shadow-sm" 
            />
            <span className="text-lg font-bold truncate">OBE System</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.tabKey;
          
          return (
            <button
              key={item.tabKey}
              onClick={() => handleNavClick(item.tabKey)}
              className={`flex w-full items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-white/20 text-white font-semibold shadow-lg backdrop-blur-sm' 
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={20} className="transition-transform duration-200 group-hover:scale-110" />
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed) */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-40 bg-[#171F32] shadow-2xl">
        <NavContent />
      </aside>

      {/* Mobile Sidebar (Off-canvas overlay) */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileOpen(false)}
          ></div>
          
          {/* Sidebar Panel */}
          <aside className="relative w-64 max-w-[80vw] flex-col flex h-full shadow-2xl animate-in slide-in-from-left duration-300 z-50">
            <NavContent />
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
