/**
 * CourseGroup and FinishedCoursesGroup — sidebar course navigation sub-components.
 * Extracted from Sidebar.jsx to reduce file size.
 */

import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  GraduationCap,
  BookOpen,
  FlaskConical,
} from 'lucide-react';
import {
  getCourseLabel,
  getCourseSubLabel,
  getCourseColorClass,
  getTeacherCourseChildren,
  getStudentCourseChildren,
} from './sidebarConfig';

export const CourseGroup = ({
  course,
  children,
  isExpanded,
  onToggle,
  onChildClick,
  activeTabKey,
  selectedId,
  collapsed,
  role,
  statusBadge,
}) => {
  const courseId = role === 'TEACHER'
    ? course?._id
    : (course?.classInstanceId || course?.id);
  const isSelected = selectedId === courseId;
  const label = getCourseLabel(course, role);
  const subLabel = getCourseSubLabel(course, role);

  const courseType = role === 'TEACHER' ? course?.course?.type : course?.type;
  const isSessional = courseType === 'Sessional' || (course?.name || '').toLowerCase().includes('sessional');
  const Icon = isSessional ? FlaskConical : BookOpen;
  const colorClass = getCourseColorClass(courseId);

  if (collapsed) {
    return (
      <button
        onClick={() => onChildClick(course, children[0]?.tabKey || 'course_page')}
        className={`sidebar-nav-item flex w-full items-center justify-center rounded-lg px-2 py-3 ${
          isSelected ? 'active text-blue-700 dark:text-white' : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
        }`}
      >
        <Icon size={18} className={`flex-shrink-0 ${colorClass}`} />
        <span className="sidebar-tooltip">{label}</span>
      </button>
    );
  }

  return (
    <div className="mb-0.5">
      <button
        onClick={onToggle}
        className={`sidebar-nav-item flex w-full items-center justify-between rounded-lg px-3 py-2 group ${
          isSelected && !isExpanded ? 'active text-blue-700 dark:text-white' : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
        }`}
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          <Icon size={16} className={`flex-shrink-0 ${colorClass}`} />
          <div className="min-w-0 text-left">
            <span className="text-sm font-medium block truncate">{label}</span>
            {subLabel && (
              <span className="text-[10px] text-gray-500 block truncate leading-tight">{subLabel}</span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          {statusBadge && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
              statusBadge === 'Running' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
            }`}>
              {statusBadge === 'Running' ? '●' : '○'}
            </span>
          )}
          <ChevronRight
            size={14}
            className={`sidebar-chevron text-gray-500 ${isExpanded ? 'rotated' : ''}`}
          />
        </div>
      </button>

      <div className={`sidebar-group-children sidebar-course-child ${isExpanded ? 'expanded' : ''}`}>
        {children.map((child) => {
          const Icon = child.icon;
          const isChildActive = isSelected && activeTabKey === child.tabKey;
          return (
            <button
              key={child.tabKey}
              onClick={() => onChildClick(course, child.tabKey)}
              className={`sidebar-nav-item flex w-full items-center space-x-2.5 rounded-md px-3 py-1.5 ml-3 group ${
                isChildActive
                  ? 'active text-blue-700 dark:text-white font-medium'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Icon size={14} className="flex-shrink-0 opacity-70" />
              <span className="text-xs truncate">{child.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const FinishedCoursesGroup = ({
  courses,
  expandedCourses,
  toggleCourseExpand,
  handleCourseChildClick,
  activeTabKey,
  selectedId,
  collapsed,
  role,
}) => {
  const [groupExpanded, setGroupExpanded] = useState(false);

  if (collapsed) {
    return null; // Don't show finished courses in collapsed mode for cleanliness
  }

  return (
    <div className="mt-1">
      <button
        onClick={() => setGroupExpanded((prev) => !prev)}
        className="sidebar-nav-item flex w-full items-center justify-between rounded-lg px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <div className="flex items-center space-x-2.5">
          <GraduationCap size={16} className="opacity-60" />
          <span className="text-xs font-medium">Finished Courses</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] bg-gray-200 text-gray-600 dark:bg-gray-600/30 dark:text-gray-400 px-1.5 py-0.5 rounded-full font-bold">
            {courses.length}
          </span>
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${groupExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      <div className={`sidebar-group-children ${groupExpanded ? 'expanded' : ''}`}>
        {courses.map((course) => {
          const courseId = role === 'TEACHER'
            ? course._id
            : (course.classInstanceId || course.id);
          const children = role === 'TEACHER'
            ? getTeacherCourseChildren(course)
            : getStudentCourseChildren();

          return (
            <CourseGroup
              key={courseId}
              course={course}
              children={children}
              isExpanded={expandedCourses.has(courseId)}
              onToggle={() => toggleCourseExpand(courseId)}
              onChildClick={handleCourseChildClick}
              activeTabKey={activeTabKey}
              selectedId={selectedId}
              collapsed={collapsed}
              role={role}
              statusBadge="Finished"
            />
          );
        })}
      </div>
    </div>
  );
};
