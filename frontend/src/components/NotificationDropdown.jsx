import React, { useEffect, useRef } from 'react';
import { Bell, ChevronRight, CheckCheck, Loader2, Inbox } from 'lucide-react';
import {
  useGetNoticesQuery,
  useMarkNoticeReadMutation,
  useMarkAllNoticesReadMutation,
} from '../store/slices/noticeSlice';
import { NoticeCardCompact } from '../pages/notices/NoticeCard';

const NotificationDropdown = ({ isOpen, onClose, onShowAll, onNoticeClick }) => {
  const panelRef = useRef(null);

  const { data, isLoading } = useGetNoticesQuery(
    { page: 1, limit: 5 },
    { skip: !isOpen }
  );
  const [markRead] = useMarkNoticeReadMutation();
  const [markAllRead, { isLoading: markingAll }] = useMarkAllNoticesReadMutation();

  const notices = data?.notices || [];
  const hasUnread = notices.some((n) => !n.isRead);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        // Check if click is on the bell button itself (parent handles toggle)
        const bellBtn = e.target.closest('[data-notification-bell]');
        if (!bellBtn) {
          onClose();
        }
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    // Delay to avoid the opening click from immediately closing
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNoticeClick = async (notice) => {
    if (!notice.isRead) {
      try { await markRead(notice._id).unwrap(); } catch { /* ignore */ }
    }
    if (onNoticeClick) {
      onNoticeClick(notice);
    }
  };

  const handleMarkAllRead = async () => {
    try { await markAllRead().unwrap(); } catch { /* ignore */ }
  };

  return (
    <div
      ref={panelRef}
      className="absolute z-[55] notification-dropdown-panel"
      style={{
        top: '0',
        left: '100%',
        marginLeft: '8px',
        width: '360px',
        maxWidth: 'calc(100vw - 120px)',
      }}
    >
      <div className="bg-white/95 dark:bg-[#1a2236]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/80 dark:border-gray-700/50 overflow-hidden animate-in slide-in-from-left-2 fade-in duration-200">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-blue-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Notifications</h3>
          </div>
          {hasUnread && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1 disabled:opacity-50"
            >
              <CheckCheck size={12} />
              {markingAll ? 'Marking...' : 'Mark all read'}
            </button>
          )}
        </div>

        {/* Notice List */}
        <div className="max-h-[350px] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="animate-spin text-blue-400" />
            </div>
          ) : notices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <Inbox size={28} className="text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
            </div>
          ) : (
            <div className="py-1 px-1 space-y-0.5">
              {notices.map((notice) => (
                <NoticeCardCompact
                  key={notice._id}
                  notice={notice}
                  onClick={() => handleNoticeClick(notice)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/80 dark:bg-white/[0.02]">
          <button
            onClick={() => { onShowAll(); onClose(); }}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
          >
            Show All Notifications
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationDropdown;
