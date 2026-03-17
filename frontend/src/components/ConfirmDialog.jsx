import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'danger' }) => {
  if (!isOpen) return null;

  const confirmColors = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-ruet-blue hover:bg-ruet-dark text-white';

  const iconColors = variant === 'danger'
    ? 'text-red-500 bg-red-100 dark:bg-red-900/30'
    : 'text-ruet-blue bg-blue-100 dark:bg-blue-900/30';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-lg shadow-xl w-full max-w-sm p-6 border border-gray-200 dark:border-gray-800">
        <div className="flex items-start space-x-4">
          <div className={`p-2 rounded-full ${iconColors} flex-shrink-0`}>
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{message}</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0">
            <X size={18} />
          </button>
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button onClick={onCancel} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${confirmColors}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
