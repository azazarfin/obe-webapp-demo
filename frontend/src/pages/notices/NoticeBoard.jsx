import React, { useState, useMemo } from 'react';
import { Megaphone, Plus, Search, Filter, CheckCheck, Loader2, Inbox } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import {
  useGetNoticesQuery,
  useMarkNoticeReadMutation,
  useMarkAllNoticesReadMutation,
  useDeleteNoticeMutation,
} from '../../store/slices/noticeSlice';
import NoticeCard from './NoticeCard';
import CreateNoticeForm from './CreateNoticeForm';
import api from '../../utils/api';

const NoticeBoard = ({ initialCourseId }) => {
  const { currentUser, userRole } = useAuth();
  const { courseData } = useSidebar();
  const [page, setPage] = useState(1);
  const [scopeFilter, setScopeFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [expandedNotice, setExpandedNotice] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [deptsLoaded, setDeptsLoaded] = useState(false);

  const queryParams = useMemo(() => ({
    page,
    limit: 15,
    ...(scopeFilter && { scope: scopeFilter }),
    ...(typeFilter && { type: typeFilter }),
    ...(searchQuery && { search: searchQuery }),
  }), [page, scopeFilter, typeFilter, searchQuery]);

  const { data, isLoading, isFetching } = useGetNoticesQuery(queryParams);
  const [markRead] = useMarkNoticeReadMutation();
  const [markAllRead, { isLoading: markingAll }] = useMarkAllNoticesReadMutation();
  const [deleteNotice] = useDeleteNoticeMutation();

  const notices = data?.notices || [];
  const totalPages = data?.totalPages || 1;

  // Determine if user can create notices
  const canCreate = userRole === 'CENTRAL_ADMIN'
    || userRole === 'DEPT_ADMIN'
    || userRole === 'TEACHER'
    || (userRole === 'STUDENT' && currentUser?.isCR);

  // Get class instances for the create form
  const classInstances = useMemo(() => {
    const running = courseData.runningCourses || [];
    return running;
  }, [courseData.runningCourses]);

  const handleOpenCreate = async () => {
    // Load departments for central admin
    if (userRole === 'CENTRAL_ADMIN' && !deptsLoaded) {
      try {
        const depts = await api.get('/departments');
        setDepartments(Array.isArray(depts) ? depts : []);
        setDeptsLoaded(true);
      } catch { /* ignore */ }
    }
    setShowCreateForm(true);
  };

  const handleMarkRead = async (noticeId) => {
    try { await markRead(noticeId).unwrap(); } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try { await markAllRead().unwrap(); } catch { /* ignore */ }
  };

  const handleDelete = async (noticeId) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try { await deleteNotice(noticeId).unwrap(); } catch { /* ignore */ }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
    setPage(1);
  };

  const handleToggleExpand = (noticeId) => {
    setExpandedNotice((prev) => (prev === noticeId ? null : noticeId));
  };

  const hasUnread = notices.some((n) => !n.isRead);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-500/15 rounded-xl">
            <Megaphone size={24} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Notice</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {data?.total || 0} total notices
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasUnread && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <CheckCheck size={16} />
              {markingAll ? 'Marking...' : 'Mark All Read'}
            </button>
          )}
          {canCreate && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
            >
              <Plus size={16} />
              New Notice
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-[#1e1e1e] rounded-xl p-3 border border-gray-200 dark:border-gray-700/50 shadow-sm">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search notices..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#151b2e] text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
        </form>

        {/* Scope Filter */}
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-gray-400" />
          <select
            value={scopeFilter}
            onChange={(e) => { setScopeFilter(e.target.value); setPage(1); }}
            className="px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#151b2e] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="">All Scopes</option>
            <option value="ALL">System-wide</option>
            <option value="DEPARTMENT">Department</option>
            <option value="COURSE">Course</option>
          </select>
        </div>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#151b2e] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/30"
        >
          <option value="">All Types</option>
          <option value="MANUAL">Manual</option>
          <option value="ASSESSMENT">Assessment</option>
          <option value="FEEDBACK_OPEN">Feedback Open</option>
          <option value="FEEDBACK_CLOSE">Feedback Closed</option>
          <option value="CR_GENERAL">CR Notice</option>
        </select>

        {/* Clear filters */}
        {(scopeFilter || typeFilter || searchQuery) && (
          <button
            onClick={() => { setScopeFilter(''); setTypeFilter(''); setSearchQuery(''); setSearchInput(''); setPage(1); }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Notice List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-blue-500" />
        </div>
      ) : notices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Inbox size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No Notices</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
            {searchQuery || scopeFilter || typeFilter
              ? 'No notices match your current filters. Try adjusting them.'
              : 'There are no notices to display yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {isFetching && !isLoading && (
            <div className="flex justify-center py-2">
              <Loader2 size={18} className="animate-spin text-blue-400" />
            </div>
          )}
          {notices.map((notice) => (
            <NoticeCard
              key={notice._id}
              notice={notice}
              expanded={expandedNotice === notice._id}
              onToggle={handleToggleExpand}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
              currentUserId={currentUser?._id || currentUser?.id}
              currentUserRole={userRole}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <CreateNoticeForm
          onClose={() => setShowCreateForm(false)}
          departments={departments}
          classInstances={classInstances}
          initialCourseId={initialCourseId}
        />
      )}
    </div>
  );
};

export default NoticeBoard;
