import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Sun, Moon, Menu } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';

const Layout = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { logout, userRole } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900 dark:bg-[#121212] dark:text-gray-100 transition-colors duration-200 overflow-hidden">
      
      {/* Sidebar - Handles both mobile and desktop states */}
      <Sidebar isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen lg:pl-64 transition-all duration-300 relative">
        
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-[#1E293B] border-b border-gray-200 dark:border-white/10 shadow-sm z-30 sticky top-0 px-4 flex items-center justify-between lg:justify-end transition-colors">
          
          {/* Mobile Header Left (Logo + Menu Toggle) */}
          <div className="flex items-center space-x-3 lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <Menu size={24} className="text-gray-700 dark:text-gray-300" />
            </button>
            <span className="font-bold text-[#171F32] dark:text-white text-lg truncate">
              OBE System
            </span>
          </div>

          {/* Header Right Items (Theme + Logout) */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-300"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <div className="hidden sm:block h-6 w-px bg-gray-300 dark:bg-gray-700 mx-2"></div>
            
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut size={18} className="sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Scrollable Main Viewport */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          <div className="max-w-7xl mx-auto w-full min-h-full pb-8 flex flex-col relative animate-in fade-in duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
