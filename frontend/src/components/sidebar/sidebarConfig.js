/**
 * Sidebar configuration: helpers, constants, and role-based navigation builders.
 * Extracted from Sidebar.jsx to reduce file size.
 */

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
  FlaskConical,
  Star,
  Megaphone,
  UserCheck,
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────

export const getHistoryKey = (role) => {
  switch (role) {
    case 'CENTRAL_ADMIN': return 'central-admin-dashboard';
    case 'DEPT_ADMIN': return 'dept-admin-dashboard';
    case 'TEACHER': return 'teacher-dashboard';
    case 'STUDENT': return 'student-dashboard';
    default: return '';
  }
};

export const getBasePath = (role) => {
  switch (role) {
    case 'CENTRAL_ADMIN': return '/central-admin';
    case 'DEPT_ADMIN': return '/dept-admin';
    case 'TEACHER': return '/teacher';
    case 'STUDENT': return '/student';
    default: return '/';
  }
};

export const getRoleLabel = (role) => {
  switch (role) {
    case 'CENTRAL_ADMIN': return 'Central Admin';
    case 'DEPT_ADMIN': return 'Dept Admin';
    case 'TEACHER': return 'Teacher';
    case 'STUDENT': return 'Student';
    default: return 'User';
  }
};

export const getRoleBadgeClass = (role) => {
  switch (role) {
    case 'CENTRAL_ADMIN': return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300';
    case 'DEPT_ADMIN': return 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300';
    case 'TEACHER': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300';
    case 'STUDENT': return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300';
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300';
  }
};

export const COURSE_COLORS = [
  'text-blue-500 dark:text-blue-400',
  'text-purple-500 dark:text-purple-400',
  'text-emerald-500 dark:text-emerald-400',
  'text-amber-500 dark:text-amber-400',
  'text-pink-500 dark:text-pink-400',
  'text-cyan-500 dark:text-cyan-400',
  'text-rose-500 dark:text-rose-400',
  'text-indigo-500 dark:text-indigo-400',
];

export const getCourseColorClass = (id) => {
  if (!id) return COURSE_COLORS[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length];
};

export const getSectionLabel = (instance) =>
  instance?.section === 'N/A' ? '' : `Sec ${instance?.section}`;

export const getCourseLabel = (item, role) => {
  if (role === 'TEACHER') {
    const code = item?.course?.courseCode || 'Course';
    const sec = getSectionLabel(item);
    return sec ? `${code} - ${sec}` : code;
  }
  // Student
  return item?.code || 'Course';
};

export const getCourseSubLabel = (item, role) => {
  if (role === 'TEACHER') {
    return item?.course?.courseName || '';
  }
  return item?.name || '';
};

// ─── Navigation Config by Role ─────────────────────────────

export const getCentralAdminNav = () => [
  { type: 'item', name: 'Dashboard', tabKey: 'overview', icon: LayoutDashboard },
  { type: 'item', name: 'Manage Notice', tabKey: 'notices', icon: Megaphone },
  { type: 'section', label: 'Management' },
  { type: 'item', name: 'Departments', tabKey: 'departments', icon: Building2 },
  { type: 'item', name: 'Courses', tabKey: 'courses', icon: BookOpen },
  { type: 'item', name: 'Teachers', tabKey: 'teachers', icon: Users },
  { type: 'item', name: 'Students', tabKey: 'students', icon: GraduationCap },
  { type: 'item', name: 'Series Management', tabKey: 'series', icon: Calendar },
];

export const getDeptAdminNav = () => [
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
  { type: 'item', name: 'Feedback Analytics', tabKey: 'reviews', icon: Star },
];

export const getTeacherCourseChildren = (instance) => {
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

export const getStudentCourseChildren = () => [
  { name: 'Overview', tabKey: 'course_page', icon: LayoutDashboard },
  { name: 'Attendance', tabKey: 'attendance_info', icon: CalendarCheck },
  { name: 'Marks', tabKey: 'marksheet', icon: BarChart3 },
  { name: 'OBE Progress', tabKey: 'obe_attainment', icon: Target },
  { name: 'Feedback', tabKey: 'give_feedback', icon: MessageSquare },
];
