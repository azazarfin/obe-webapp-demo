import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSidebar } from '../contexts/SidebarContext';
import { buildNextWindowState, DASHBOARD_HISTORY_KEY, HISTORY_CHANGE_EVENT } from '../hooks/useHistoryBackedState';
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Users,
  GraduationCap,
  BookMarked,
  Calendar,
  ClipboardList,
  CalendarCheck,
  BarChart3,
  MessageSquare,
  FileText,
  Pencil,
  UserCog,
  Target,
  Search,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  Loader2,
  Star,
  FlaskConical,
  Sun,
  Moon,
  LogOut,
  Bell,
  Megaphone,
  UserCheck,
} from 'lucide-react';
import { useGetUnreadCountQuery } from '../store/slices/noticeSlice';
import { useGetAdvisedSectionsQuery } from '../store/slices/courseAdvisorSlice';
import NotificationDropdown from './NotificationDropdown';
import './Sidebar.css';

// ─── Helpers ───────────────────────────────────────────────

const getHistoryKey = (role) => {
  switch (role) {
    case 'CENTRAL_ADMIN': return 'central-admin-dashboard';
    case 'DEPT_ADMIN': return 'dept-admin-dashboard';
    case 'TEACHER': return 'teacher-dashboard';
    case 'STUDENT': return 'student-dashboard';
    default: return '';
  }
};

const getBasePath = (role) => {
  switch (role) {
    case 'CENTRAL_ADMIN': return '/central-admin';
    case 'DEPT_ADMIN': return '/dept-admin';
    case 'TEACHER': return '/teacher';
    case 'STUDENT': return '/student';
    default: return '/';
  }
};

const getRoleLabel = (role) => {
  switch (role) {
    case 'CENTRAL_ADMIN': return 'Central Admin';
    case 'DEPT_ADMIN': return 'Dept Admin';
    case 'TEACHER': return 'Teacher';
    case 'STUDENT': return 'Student';
    default: return 'User';
  }
};

const getRoleBadgeClass = (role) => {
  switch (role) {
    case 'CENTRAL_ADMIN': return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300';
    case 'DEPT_ADMIN': return 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300';
    case 'TEACHER': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300';
    case 'STUDENT': return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300';
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300';
  }
};

const COURSE_COLORS = [
  'text-blue-500 dark:text-blue-400',
  'text-purple-500 dark:text-purple-400',
  'text-emerald-500 dark:text-emerald-400',
  'text-amber-500 dark:text-amber-400',
  'text-pink-500 dark:text-pink-400',
  'text-cyan-500 dark:text-cyan-400',
  'text-rose-500 dark:text-rose-400',
  'text-indigo-500 dark:text-indigo-400',
];

const getCourseColorClass = (id) => {
  if (!id) return COURSE_COLORS[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length];
};

const getSectionLabel = (instance) =>
  instance?.section === 'N/A' ? '' : `Sec ${instance?.section}`;

const getCourseLabel = (item, role) => {
  if (role === 'TEACHER') {
    const code = item?.course?.courseCode || 'Course';
    const sec = getSectionLabel(item);
    return sec ? `${code} - ${sec}` : code;
  }
  // Student
  return item?.code || 'Course';
};

const getCourseSubLabel = (item, role) => {
  if (role === 'TEACHER') {
    return item?.course?.courseName || '';
  }
  return item?.name || '';
};

// ─── Navigation Config by Role ─────────────────────────────

const getCentralAdminNav = () => [
  { type: 'item', name: 'Dashboard', tabKey: 'overview', icon: LayoutDashboard },
  { type: 'item', name: 'Manage Notice', tabKey: 'notices', icon: Megaphone },
  { type: 'section', label: 'Management' },
  { type: 'item', name: 'Departments', tabKey: 'departments', icon: Building2 },
  { type: 'item', name: 'Courses', tabKey: 'courses', icon: BookOpen },
  { type: 'item', name: 'Teachers', tabKey: 'teachers', icon: Users },
  { type: 'item', name: 'Students', tabKey: 'students', icon: GraduationCap },
  { type: 'item', name: 'Series Management', tabKey: 'series', icon: Calendar },
];

const getDeptAdminNav = () => [
  { type: 'item', name: 'Dashboard', tabKey: 'overview', icon: LayoutDashboard },
  { type: 'item', name: 'Manage Notice', tabKey: 'notices', icon: Megaphone },
  { type: 'section', label: 'Course Operations' },
  { type: 'item', name: 'Course Management', tabKey: 'course_mgmt', icon: ClipboardList },
  { type: 'item', name: 'Add / Edit Courses', tabKey: 'add_course', icon: BookMarked },
  { type: 'section', label: 'People' },
  { type: 'item', name: 'Teachers', tabKey: 'teachers', icon: Users },
  { type: 'item', name: 'Students', tabKey: 'students', icon: GraduationCap },
  { type: 'item', name: 'Course Advisors', tabKey: 'advisors', icon: UserCheck },
  { type: 'section', label: 'Analytics' },
  { type: 'item', name: 'Course Reviews', tabKey: 'reviews', icon: Star },
];

const getTeacherCourseChildren = (instance) => {
  const isTheory = instance?.course?.type !== 'Sessional';
  const isFinished = instance?.status === 'Finished';

  if (isFinished) {
    return [
      { name: 'Overview', tabKey: 'course_page', icon: LayoutDashboard },
      { name: 'Evaluation', tabKey: 'evaluation', icon: BarChart3 },
      { name: 'Feedback', tabKey: 'feedback', icon: MessageSquare },
      { name: 'CQI Report', tabKey: 'experience_report', icon: FileText },
    ];
  }

  const children = [
    { name: 'Overview', tabKey: 'course_page', icon: LayoutDashboard },
    { name: 'Attendance', tabKey: 'attendance', icon: CalendarCheck },
    isTheory
      ? { name: 'Assessments', tabKey: 'assessment', icon: ClipboardList }
      : { name: 'Assessments', tabKey: 'sessional_assessment', icon: BookOpen },
  ];

  if (isTheory) {
    children.push({ name: 'Semester Final', tabKey: 'semester_final', icon: GraduationCap });
  }

  children.push(
    { name: 'Manage Tools', tabKey: 'manage_assessments', icon: Pencil },
    { name: 'Roster', tabKey: 'roster', icon: UserCog },
    { name: 'Evaluation', tabKey: 'evaluation', icon: BarChart3 },
    { name: 'Feedback', tabKey: 'feedback', icon: MessageSquare }
  );

  return children;
};

const getStudentCourseChildren = () => [
  { name: 'Overview', tabKey: 'course_page', icon: LayoutDashboard },
  { name: 'Attendance', tabKey: 'attendance_info', icon: CalendarCheck },
  { name: 'Marks', tabKey: 'marksheet', icon: BarChart3 },
  { name: 'OBE Progress', tabKey: 'obe_attainment', icon: Target },
  { name: 'Feedback', tabKey: 'give_feedback', icon: MessageSquare },
];

// ─── Sub-components ──────────────────────────────────────────

const NavItem = ({ item, isActive, onClick, collapsed }) => {
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

const SectionLabel = ({ label, collapsed }) => {
  if (collapsed) {
    return <div className="mx-auto my-2 w-6 h-px bg-gray-200 dark:bg-white/10" />;
  }
  return <div className="sidebar-section-label">{label}</div>;
};

const CourseGroup = ({
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

// ─── Main Sidebar ─────────────────────────────────────────

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { userRole, currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { sidebarCollapsed, toggleSidebar, courseData } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  // Current dashboard state from history
  const [currentTab, setCurrentTab] = useState('overview');
  const [selectedId, setSelectedId] = useState(null);
  const [expandedCourses, setExpandedCourses] = useState(new Set());
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const isNotifRole = userRole === 'TEACHER' || userRole === 'STUDENT';

  // Poll unread notification count every 60 seconds (only for teacher/student)
  const { data: unreadData } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 60000,
    skip: !isNotifRole,
  });
  const unreadCount = isNotifRole ? (unreadData?.count || 0) : 0;

  // Check if teacher is a course advisor
  const { data: advisedSections = [] } = useGetAdvisedSectionsQuery(undefined, {
    skip: userRole !== 'TEACHER',
  });
  const isCourseAdvisor = advisedSections.length > 0;

  // Sync with history state
  useEffect(() => {
    const handleHistoryChange = () => {
      const historyKey = getHistoryKey(userRole);
      if (historyKey && window.history.state?.[DASHBOARD_HISTORY_KEY]?.[historyKey]) {
        const state = window.history.state[DASHBOARD_HISTORY_KEY][historyKey];
        setCurrentTab(state.activeTab || 'overview');

        // Extract selected instance/course ID
        if (userRole === 'TEACHER' && state.selectedInstance) {
          const id = state.selectedInstance._id;
          setSelectedId(id);
          setExpandedCourses((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
          });
        } else if (userRole === 'STUDENT' && state.selectedCourse) {
          const id = state.selectedCourse.classInstanceId || state.selectedCourse.id;
          setSelectedId(id);
          setExpandedCourses((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
          });
        } else {
          setSelectedId(null);
        }
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

  // Navigate to a simple tab
  const handleNavClick = useCallback((tabKey) => {
    const historyKey = getHistoryKey(userRole);
    const basePath = getBasePath(userRole);

    if (location.pathname !== basePath) {
      navigate(basePath, { replace: true });
    }

    const nextState = { activeTab: tabKey };
    if (userRole === 'STUDENT') nextState.selectedCourse = null;
    if (userRole === 'TEACHER') nextState.selectedInstance = null;

    window.history.pushState(buildNextWindowState(historyKey, nextState), '', basePath);
    window.dispatchEvent(new Event(HISTORY_CHANGE_EVENT));
    if (setIsMobileOpen) setIsMobileOpen(false);
  }, [userRole, location.pathname, navigate, setIsMobileOpen]);

  // Navigate to a course child tab
  const handleCourseChildClick = useCallback((course, tabKey) => {
    const historyKey = getHistoryKey(userRole);
    const basePath = getBasePath(userRole);

    if (location.pathname !== basePath) {
      navigate(basePath, { replace: true });
    }

    let nextState;
    if (userRole === 'TEACHER') {
      nextState = { activeTab: tabKey, selectedInstance: course };
    } else if (userRole === 'STUDENT') {
      nextState = { activeTab: tabKey, selectedCourse: course };
    }

    window.history.pushState(buildNextWindowState(historyKey, nextState), '', basePath);
    window.dispatchEvent(new Event(HISTORY_CHANGE_EVENT));
    if (setIsMobileOpen) setIsMobileOpen(false);
  }, [userRole, location.pathname, navigate, setIsMobileOpen]);

  const toggleCourseExpand = useCallback((courseId) => {
    setExpandedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  }, []);

  // ─── Build nav items ───
  const staticNavItems = useMemo(() => {
    switch (userRole) {
      case 'CENTRAL_ADMIN': return getCentralAdminNav();
      case 'DEPT_ADMIN': return getDeptAdminNav();
      case 'TEACHER': {
        const nav = [
          { type: 'item', name: 'Dashboard', tabKey: 'overview', icon: LayoutDashboard },
          { type: 'item', name: 'Manage Notice', tabKey: 'notices', icon: Megaphone },
        ];
        if (isCourseAdvisor) {
          nav.push({ type: 'item', name: 'Manage Section CRs', tabKey: 'class_reps', icon: UserCog });
        }
        return nav;
      }
      case 'STUDENT': return [
        { type: 'item', name: 'Dashboard', tabKey: 'overview', icon: LayoutDashboard },
        { type: 'item', name: 'Manage Notice', tabKey: 'notices', icon: Megaphone },
      ];
      default: return [];
    }
  }, [userRole, isCourseAdvisor]);

  const studentStaticBottom = useMemo(() => {
    if (userRole === 'STUDENT') {
      return [
        { type: 'section', label: 'Explore' },
        { type: 'item', name: 'University Directory', tabKey: 'directory', icon: Search },
      ];
    }
    return [];
  }, [userRole]);

  const runningCourses = courseData.runningCourses || [];
  const finishedCourses = courseData.finishedCourses || [];
  const coursesLoading = courseData.loading;

  // ─── Render ───
  const NavContent = ({ isMobile }) => {
    const isCollapsed = !isMobile && sidebarCollapsed;

    return (
      <div className="flex flex-col h-full bg-white dark:bg-[#171F32] text-gray-900 dark:text-white border-r border-gray-200 dark:border-none">
        {/* ── Logo Header ── */}
        <div className={`flex items-center h-16 border-b border-gray-200 dark:border-white/10 px-4 flex-shrink-0 ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}>
          <div className={`flex items-center ${isCollapsed ? '' : 'space-x-3'} min-w-0`}>
            <img
              src="/logo.png"
              alt="RUET Logo"
              className="h-9 w-9 object-contain bg-white rounded-lg p-0.5 shadow-sm flex-shrink-0"
            />
            {!isCollapsed && (
              <span className="text-base font-bold truncate">OBE System</span>
            )}
          </div>
          {!isMobile && (
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors flex-shrink-0"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          )}
        </div>

        {/* ── Notification Bell (Teacher/Student only) ── */}
        {isNotifRole && (
          <div className={`px-2 pb-1 flex-shrink-0 relative ${isCollapsed ? 'flex justify-center' : ''}`}>
            <button
              data-notification-bell
              onClick={() => setNotifDropdownOpen((prev) => !prev)}
              className={`sidebar-nav-item flex items-center rounded-lg transition-all duration-150 group ${
                isCollapsed ? 'justify-center px-2 py-3' : 'w-full px-3 py-2.5 space-x-3'
              } text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white`}
              title="Notifications"
            >
              <span className="relative inline-flex flex-shrink-0" style={{ width: isCollapsed ? 22 : 18, height: isCollapsed ? 22 : 18 }}>
                <Bell size={isCollapsed ? 22 : 18} className="transition-transform duration-150 group-hover:scale-110" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </span>
              {!isCollapsed && (
                <span className="text-sm truncate">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 font-bold">
                      {unreadCount}
                    </span>
                  )}
                </span>
              )}
              {isCollapsed && <span className="sidebar-tooltip">Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}</span>}
            </button>

            {/* Notification Dropdown Panel */}
            <NotificationDropdown
              isOpen={notifDropdownOpen}
              onClose={() => setNotifDropdownOpen(false)}
              onShowAll={() => {
                handleNavClick('notices');
                setNotifDropdownOpen(false);
              }}
              onNoticeClick={() => {
                handleNavClick('notices');
                setNotifDropdownOpen(false);
              }}
            />
          </div>
        )}

        {/* ── Theme Toggle ── */}
        <div className={`px-2 pb-1 flex-shrink-0 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={toggleTheme}
            className={`sidebar-nav-item flex items-center rounded-lg transition-all duration-150 group ${
              isCollapsed ? 'justify-center px-2 py-3' : 'w-full px-3 py-2.5 space-x-3'
            } text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white`}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={isCollapsed ? 22 : 18} className="flex-shrink-0 transition-transform duration-150 group-hover:scale-110" /> : <Moon size={isCollapsed ? 22 : 18} className="flex-shrink-0 transition-transform duration-150 group-hover:scale-110" />}
            {!isCollapsed && <span className="text-sm truncate">Switch Theme</span>}
            {isCollapsed && <span className="sidebar-tooltip">Switch Theme</span>}
          </button>
        </div>

        {/* ── Nav List ── */}
        <div className="flex-1 overflow-y-auto sidebar-nav py-2 px-2">
          {/* Static nav items */}
          {staticNavItems.map((item, idx) => {
            if (item.type === 'section') {
              return <SectionLabel key={`sec-${idx}`} label={item.label} collapsed={isCollapsed} />;
            }
            return (
              <NavItem
                key={item.tabKey}
                item={item}
                isActive={currentTab === item.tabKey && !selectedId}
                onClick={() => handleNavClick(item.tabKey)}
                collapsed={isCollapsed}
              />
            );
          })}

          {/* Course sections for Teacher/Student */}
          {(userRole === 'TEACHER' || userRole === 'STUDENT') && (
            <>
              {/* Running Courses */}
              <SectionLabel label="My Courses" collapsed={isCollapsed} />

              {coursesLoading ? (
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-3`}>
                  <Loader2 size={16} className="animate-spin text-gray-400" />
                  {!isCollapsed && <span className="text-xs text-gray-500 ml-2">Loading...</span>}
                </div>
              ) : runningCourses.length === 0 ? (
                !isCollapsed && (
                  <p className="text-[11px] text-gray-500 px-3 py-2 italic">No running courses</p>
                )
              ) : (
                runningCourses.map((course) => {
                  const courseId = userRole === 'TEACHER'
                    ? course._id
                    : (course.classInstanceId || course.id);
                  const children = userRole === 'TEACHER'
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
                      activeTabKey={currentTab}
                      selectedId={selectedId}
                      collapsed={isCollapsed}
                      role={userRole}
                      statusBadge="Running"
                    />
                  );
                })
              )}

              {/* Finished Courses (collapsible group) */}
              {finishedCourses.length > 0 && (
                <FinishedCoursesGroup
                  courses={finishedCourses}
                  expandedCourses={expandedCourses}
                  toggleCourseExpand={toggleCourseExpand}
                  handleCourseChildClick={handleCourseChildClick}
                  activeTabKey={currentTab}
                  selectedId={selectedId}
                  collapsed={isCollapsed}
                  role={userRole}
                />
              )}
            </>
          )}

          {/* Student bottom nav items */}
          {studentStaticBottom.map((item, idx) => {
            if (item.type === 'section') {
              return <SectionLabel key={`bot-sec-${idx}`} label={item.label} collapsed={isCollapsed} />;
            }
            return (
              <NavItem
                key={item.tabKey}
                item={item}
                isActive={currentTab === item.tabKey}
                onClick={() => handleNavClick(item.tabKey)}
                collapsed={isCollapsed}
              />
            );
          })}
        </div>


        {/* ── User Footer ── */}
        {!isCollapsed && currentUser && (
          <div className="sidebar-user-footer flex-shrink-0">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 dark:bg-white/10 flex items-center justify-center flex-shrink-0 text-sm font-bold dark:text-white/80">
                {(currentUser.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{currentUser.name || 'User'}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${getRoleBadgeClass(userRole)}`}>
                  {getRoleLabel(userRole)}
                </span>
              </div>
            </div>
            <button
              onClick={() => { logout(); navigate('/login', { replace: true }); }}
              className="mt-3 w-full flex items-center justify-start space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/20 transition-colors"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
        {isCollapsed && currentUser && (
          <div className="sidebar-user-footer flex-shrink-0 flex flex-col items-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 dark:bg-white/10 flex items-center justify-center text-sm font-bold dark:text-white/80">
              {(currentUser.name || 'U').charAt(0).toUpperCase()}
            </div>
            <button
              onClick={() => { logout(); navigate('/login', { replace: true }); }}
              className="p-1.5 rounded-md text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 z-40 bg-white dark:bg-[#171F32] shadow-2xl sidebar-panel ${
          sidebarCollapsed ? 'collapsed' : 'expanded'
        }`}
      >
        <NavContent isMobile={false} />
      </aside>

      {/* Mobile Sidebar (overlay) */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] flex-col flex h-full shadow-2xl z-50 sidebar-mobile-enter">
            <NavContent isMobile={true} />
          </aside>
        </div>
      )}
    </>
  );
};

// ─── Finished Courses Wrapper ─────────────────────────────

const FinishedCoursesGroup = ({
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

export default Sidebar;
