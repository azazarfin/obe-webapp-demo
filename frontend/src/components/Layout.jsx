import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 dark:bg-[#121212] dark:text-gray-100 transition-colors duration-200">
      
      <header className="bg-ruet-blue text-white shadow-md sticky top-0 z-30 relative">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          
          <div className="flex items-center space-x-3">
            <img 
              src="src/assets/logo.png" 
              alt="RUET Logo" 
              className="h-11 w-11 object-contain bg-white rounded-lg p-1 shadow-sm" 
            />
            <h1 className="text-xl font-bold truncate">RUET OBE Evaluation System</h1>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 bg-red-600/90 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <LogOut size={18} className="mr-2" />
              <span className="font-medium">Logout</span>
            </button>
          </div>

          <div className="flex md:hidden items-center">
            <button
              className="p-2 rounded-md hover:bg-white/10 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-ruet-blue border-t border-white/10 shadow-xl z-40">
            <div className="px-4 py-3 space-y-2">
              <button
                onClick={() => {
                  toggleTheme();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center w-full px-4 py-3 text-white rounded-md hover:bg-white/10 transition-colors"
              >
                {theme === 'dark' ? <Sun size={20} className="mr-3" /> : <Moon size={20} className="mr-3" />}
                <span className="font-medium">Toggle Theme</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-red-200 rounded-md hover:bg-white/10 transition-colors"
              >
                <LogOut size={20} className="mr-3" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto w-full h-full">
          <Outlet />
        </div>
      </main>

      <footer className="bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-gray-800 text-center py-4 text-sm text-gray-500 dark:text-gray-400 mt-auto">
        &copy; {new Date().getFullYear()} RUET OBE Evaluation System. All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;