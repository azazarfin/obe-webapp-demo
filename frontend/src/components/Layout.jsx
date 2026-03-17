import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Sun, Moon, Menu, X, LayoutDashboard } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userRole, logoutDemo } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    if (currentUser?.email?.endsWith('@demo.com')) {
      logoutDemo();
    } else {
      logoutDemo();
    }
    navigate('/login');
  };

  const getNavLinks = () => {
    switch (userRole) {
      case 'CENTRAL_ADMIN':
        return [{ title: 'Central Admin', path: '/central-admin', icon: <LayoutDashboard size={20} /> }];
      case 'DEPT_ADMIN':
        return [{ title: 'Dept Admin', path: '/dept-admin', icon: <LayoutDashboard size={20} /> }];
      case 'TEACHER':
        return [{ title: 'Teacher Panel', path: '/teacher', icon: <LayoutDashboard size={20} /> }];
      case 'STUDENT':
        return [{ title: 'Student Portal', path: '/student', icon: <LayoutDashboard size={20} /> }];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center h-16 bg-ruet-dark text-white border-b border-white/10">
        <span className="text-xl font-bold tracking-wider">RUET OBE System</span>
      </div>
      <nav className="flex-grow px-4 py-6 space-y-2 overflow-y-auto">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center px-4 py-3 rounded-md transition-colors ${location.pathname.includes(link.path)
                ? 'bg-ruet-blue text-white'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
          >
            {link.icon}
            <span className="ml-3 font-medium">{link.title}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-red-400 rounded-md hover:bg-white/10 hover:text-red-300 transition-colors"
        >
          <LogOut size={20} />
          <span className="ml-3 font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-white text-gray-900 dark:bg-[#121212] dark:text-gray-100 transition-colors duration-200">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-ruet-dark fixed inset-y-0 z-10 shadow-xl">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setIsMobileMenuOpen(false)}></div>
          <aside className="relative w-64 max-w-sm bg-ruet-dark shadow-xl flex-col flex h-full transform transition-transform duration-300">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 text-gray-300 hover:text-white p-1"
            >
              <X size={24} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-64 min-w-0 transition-all duration-300">
        <header className="bg-ruet-blue text-white shadow-md sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
            <div className="flex items-center">
              <button
                className="md:hidden p-2 mr-3 -ml-2 rounded-md hover:bg-white/10 transition-colors"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu size={24} />
              </button>
              <h1 className="text-xl font-bold truncate">Dashboard</h1>
            </div>

            <div className="flex items-center">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
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
    </div>
  );
};

export default Layout;
