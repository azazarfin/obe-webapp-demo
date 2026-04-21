import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { SidebarProvider, useSidebar } from '../contexts/SidebarContext';
import Sidebar from './Sidebar';

const LayoutInner = () => {
  const { sidebarCollapsed } = useSidebar();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900 dark:bg-[#121212] dark:text-gray-100 transition-colors duration-200 overflow-hidden">
      
      {/* Sidebar - Handles both mobile and desktop states */}
      <Sidebar isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 relative"
        style={{ paddingLeft: '' }}
      >
        {/* Dynamic padding for desktop sidebar */}
        <style>{`
          @media (min-width: 1024px) {
            .main-content-area {
              padding-left: ${sidebarCollapsed ? '88px' : '288px'};
            }
          }
        `}</style>
        
        {/* Top Header — Mobile only */}
        <header className="main-content-area h-14 bg-white dark:bg-[#1E293B] border-b border-gray-200 dark:border-white/10 shadow-sm z-30 sticky top-0 px-4 flex items-center lg:hidden transition-all duration-300">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <Menu size={24} className="text-gray-700 dark:text-gray-300" />
          </button>
          <span className="font-bold text-[#171F32] dark:text-white text-lg truncate ml-3">
            OBE System
          </span>
        </header>

        {/* Scrollable Main Viewport */}
        <main className="main-content-area flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8 relative transition-all duration-300">
          <div className="max-w-7xl mx-auto w-full min-h-full pb-8 flex flex-col relative animate-in fade-in duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

const Layout = () => {
  return (
    <SidebarProvider>
      <LayoutInner />
    </SidebarProvider>
  );
};

export default Layout;
