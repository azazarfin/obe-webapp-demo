/**
 * NavItem and SectionLabel — atomic sidebar navigation sub-components.
 * Extracted from Sidebar.jsx to reduce file size.
 */

import React from 'react';

export const NavItem = ({ item, isActive, onClick, collapsed }) => {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`sidebar-nav-item flex w-full items-center rounded-lg transition-all duration-150 group ${
        collapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5 space-x-3'
      } ${
        isActive
          ? 'active text-blue-700 dark:text-white font-semibold'
          : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
      }`}
    >
      {isActive && <span className="sidebar-active-indicator" />}
      <Icon size={collapsed ? 22 : 18} className="flex-shrink-0 transition-transform duration-150 group-hover:scale-110" />
      {!collapsed && <span className="text-sm truncate">{item.name}</span>}
      {collapsed && <span className="sidebar-tooltip">{item.name}</span>}
    </button>
  );
};

export const SectionLabel = ({ label, collapsed }) => {
  if (collapsed) {
    return <div className="mx-auto my-2 w-6 h-px bg-gray-200 dark:bg-white/10" />;
  }
  return <div className="sidebar-section-label">{label}</div>;
};
