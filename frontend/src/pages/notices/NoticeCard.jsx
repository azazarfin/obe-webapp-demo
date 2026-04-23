import React from 'react';
import { Bell, Megaphone, BookOpen, MessageSquare, ClipboardList, Users, Clock } from 'lucide-react';

/**
 * Format a timestamp into relative time (e.g., "2h ago", "Yesterday").
 */
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const TYPE_CONFIG = {
  MANUAL: { icon: Megaphone, label: 'Notice', color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  ASSESSMENT: { icon: ClipboardList, label: 'Assessment', color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  FEEDBACK_OPEN: { icon: MessageSquare, label: 'Feedback Open', color: 'text-green-500 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10' },
  FEEDBACK_CLOSE: { icon: MessageSquare, label: 'Feedback Closed', color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
  CR_GENERAL: { icon: Users, label: 'CR Notice', color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10' },
};

const SCOPE_BADGES = {
  ALL: { label: 'All', bg: 'bg-gray-100 text-gray-600 dark:bg-gray-600/30 dark:text-gray-300' },
  DEPARTMENT: { label: 'Dept', bg: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300' },
  COURSE: { label: 'Course', bg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300' },
};

const getScopeLabel = (notice) => {
  if (notice.scope === 'DEPARTMENT' && notice.department) {
    return notice.department.shortName || notice.department.name || 'Dept';
  }
  if (notice.scope === 'COURSE' && notice.classInstance?.course) {
    const ci = notice.classInstance;
    const code = ci.course.courseCode || 'Course';
    const sec = ci.section && ci.section !== 'N/A' ? ` ${ci.section}` : '';
    return `${code}${sec}`;
  }
  return SCOPE_BADGES[notice.scope]?.label || notice.scope;
};

/**
 * Compact notice card used in the dropdown panel.
 */
export const NoticeCardCompact = ({ notice, onClick }) => {
  const typeConfig = TYPE_CONFIG[notice.type] || TYPE_CONFIG.MANUAL;
  const TypeIcon = typeConfig.icon;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 group hover:bg-gray-50 dark:hover:bg-white/5 ${
        !notice.isRead ? 'bg-blue-50/50 dark:bg-blue-500/5' : ''
      }`}
    >
      <div className="flex items-start gap-2.5">
        {!notice.isRead && (
          <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 animate-pulse" />
        )}
        {notice.isRead && <span className="mt-1.5 w-2 h-2 flex-shrink-0" />}
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium truncate ${
            !notice.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
          }`}>
            {notice.title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {notice.body?.substring(0, 60)}{notice.body?.length > 60 ? '…' : ''}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${typeConfig.bg} ${typeConfig.color}`}>
              <TypeIcon size={10} />
              {typeConfig.label}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-0.5">
              <Clock size={9} />
              {formatRelativeTime(notice.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

/**
 * Full notice card used on the Notice Board page.
 */
const NoticeCard = ({ notice, expanded, onToggle, onMarkRead, onDelete, currentUserId, currentUserRole }) => {
  const typeConfig = TYPE_CONFIG[notice.type] || TYPE_CONFIG.MANUAL;
  const TypeIcon = typeConfig.icon;
  const scopeBadge = SCOPE_BADGES[notice.scope] || SCOPE_BADGES.ALL;

  const handleClick = () => {
    if (!notice.isRead && onMarkRead) {
      onMarkRead(notice._id);
    }
    if (onToggle) {
      onToggle(notice._id);
    }
  };

  const isAuthor = String(notice.author?._id || notice.author) === String(currentUserId);
  const canDelete = isAuthor || currentUserRole === 'CENTRAL_ADMIN';

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        !notice.isRead
          ? 'border-blue-200 dark:border-blue-500/30 bg-white dark:bg-[#1a2236] shadow-sm shadow-blue-100/50 dark:shadow-blue-900/20'
          : 'border-gray-200 dark:border-gray-700/50 bg-white dark:bg-[#1e1e1e]'
      } ${expanded ? 'ring-2 ring-blue-400/30 dark:ring-blue-500/20' : 'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600'}`}
    >
      <button
        onClick={handleClick}
        className="w-full text-left px-5 py-4 group"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {!notice.isRead && (
              <span className="mt-2 w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 animate-pulse" />
            )}
            <div className="min-w-0 flex-1">
              <h3 className={`text-base font-semibold leading-tight ${
                !notice.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-800 dark:text-gray-200'
              }`}>
                {notice.title}
              </h3>
              {!expanded && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {notice.body}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${typeConfig.bg} ${typeConfig.color}`}>
              <TypeIcon size={11} />
              {typeConfig.label}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${scopeBadge.bg}`}>
              {getScopeLabel(notice)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2.5 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300">
              {(notice.author?.name || 'U').charAt(0).toUpperCase()}
            </span>
            {notice.author?.name || 'Unknown'}
          </span>
          <span className="flex items-center gap-0.5">
            <Clock size={11} />
            {formatRelativeTime(notice.createdAt)}
          </span>
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="px-5 pb-4 border-t border-gray-100 dark:border-gray-700/50">
          <div className="pt-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            {notice.body}
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50">
            <span className="text-xs text-gray-400">
              {new Date(notice.createdAt).toLocaleString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </span>
            {canDelete && onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(notice._id); }}
                className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticeCard;
