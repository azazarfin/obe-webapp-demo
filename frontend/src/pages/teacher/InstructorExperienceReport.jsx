import React from 'react';
import { FileText, MessageSquare } from 'lucide-react';

const InstructorExperienceReport = ({
  classInstance,
  onBack,
  title = 'Teacher Feedback and Report',
  description = 'This page is intentionally blank until the teacher feedback and reporting workflow is implemented.'
}) => {
  const sectionLabel = classInstance?.section === 'N/A' ? 'No Section' : `Section ${classInstance?.section}`;

  return (
    <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Class: {classInstance?.course?.courseCode || 'N/A'} ({sectionLabel}, {classInstance?.series || 'N/A'} Series)
          </p>
        </div>
        {onBack && (
          <button onClick={onBack} className="text-sm text-gray-600 dark:text-gray-400 hover:text-ruet-blue dark:hover:text-white font-medium">
            &larr; Back
          </button>
        )}
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#2d2d2d] px-6 py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-ruet-blue dark:bg-blue-900/30 dark:text-blue-400">
          <div className="flex items-center gap-1">
            <MessageSquare size={18} />
            <FileText size={18} />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Coming Soon</h3>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </div>
  );
};

export default InstructorExperienceReport;
