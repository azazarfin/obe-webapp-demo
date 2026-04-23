import React, { useState } from 'react';
import { X, Send, Globe, Building2, BookOpen, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCreateNoticeMutation } from '../../store/slices/noticeSlice';

const SCOPE_OPTIONS = [
  { value: 'ALL', label: 'All Users', icon: Globe, desc: 'Everyone in the system' },
  { value: 'DEPARTMENT', label: 'Department', icon: Building2, desc: 'All members of a department' },
  { value: 'COURSE', label: 'Course', icon: BookOpen, desc: 'Students & teachers of a course' },
];

const CreateNoticeForm = ({ onClose, departments = [], classInstances = [], initialCourseId }) => {
  const { userRole, currentUser } = useAuth();
  const [createNotice, { isLoading }] = useCreateNoticeMutation();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [scope, setScope] = useState(
    initialCourseId ? 'COURSE' :
    userRole === 'CENTRAL_ADMIN' ? 'ALL'
    : userRole === 'DEPT_ADMIN' ? 'DEPARTMENT'
    : 'COURSE'
  );
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedClassInstance, setSelectedClassInstance] = useState(initialCourseId || '');
  const [error, setError] = useState('');

  const allowedScopes = SCOPE_OPTIONS.filter((opt) => {
    if (userRole === 'CENTRAL_ADMIN') return true;
    if (userRole === 'DEPT_ADMIN') return opt.value !== 'ALL';
    // Teacher + CR student
    return opt.value === 'COURSE';
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) return setError('Title is required');
    if (!body.trim()) return setError('Body is required');
    if (scope === 'COURSE' && !selectedClassInstance) return setError('Please select a course');

    try {
      const payload = {
        title: title.trim(),
        body: body.trim(),
        scope,
      };

      if (scope === 'DEPARTMENT') {
        if (userRole === 'CENTRAL_ADMIN' && !selectedDept) return setError('Please select a department');
        if (userRole === 'CENTRAL_ADMIN') payload.department = selectedDept;
        // Dept admin's department is auto-resolved on the backend
      }

      if (scope === 'COURSE') {
        payload.classInstance = selectedClassInstance;
      }

      await createNotice(payload).unwrap();
      onClose();
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to create notice');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1e2538] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700/50 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700/50">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Notice</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notice title..."
              maxLength={200}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#151b2e] text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-sm"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Content</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your notice content here..."
              rows={5}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#151b2e] text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-sm resize-none"
            />
          </div>

          {/* Scope Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Audience</label>
            <div className="grid grid-cols-1 gap-2">
              {allowedScopes.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setScope(opt.value)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all text-sm ${
                      scope === opt.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/20'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon size={16} className="flex-shrink-0" />
                    <div>
                      <span className="font-medium">{opt.label}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{opt.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Department Selector (Central Admin + DEPARTMENT scope) */}
          {scope === 'DEPARTMENT' && userRole === 'CENTRAL_ADMIN' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Department</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#151b2e] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              >
                <option value="">Select department...</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.shortName || dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Class Instance Selector (COURSE scope) */}
          {scope === 'COURSE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Course</label>
              <select
                value={selectedClassInstance}
                onChange={(e) => setSelectedClassInstance(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#151b2e] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              >
                <option value="">Select course...</option>
                {classInstances.map((ci) => {
                  const code = ci.course?.courseCode || ci.code || 'Course';
                  const name = ci.course?.courseName || ci.name || '';
                  const sec = ci.section && ci.section !== 'N/A' ? ` - Sec ${ci.section}` : '';
                  return (
                    <option key={ci._id || ci.classInstanceId} value={ci._id || ci.classInstanceId}>
                      {code}{sec} {name ? `(${name})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {isLoading ? 'Publishing...' : 'Publish Notice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateNoticeForm;
