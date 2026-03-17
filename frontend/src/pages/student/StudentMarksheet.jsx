import React from 'react';
import { FileText, AlertCircle } from 'lucide-react';

const StudentMarksheet = ({ course }) => {
  if (!course) return null;

  const marks = course.marks;
  const totalEarned = Object.values(marks).reduce((acc, curr) => acc + (curr.earned || 0), 0);
  const totalPossible = Object.values(marks).reduce((acc, curr) => acc + curr.total, 0);
  const percentage = totalPossible > 0 ? ((totalEarned / totalPossible) * 100).toFixed(1) : 0;

  const labelMap = {
    ct: 'Class Tests (Best 3 avg)',
    attendance: 'Attendance Marks',
    assignment: 'Assignment',
    final: 'Semester Final Exam',
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Marksheet</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{course.code} — {course.name} · Instructor: {course.teacher}</p>
      </div>

      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Component</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Obtained</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Percentage</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
            {Object.entries(marks).map(([type, data]) => (
              <tr key={type} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{labelMap[type] || type}</td>
                <td className="px-6 py-4 text-center text-sm">
                  {data.earned !== null ? (
                    <span className="font-bold text-gray-900 dark:text-white">{data.earned}</span>
                  ) : (
                    <span className="inline-flex items-center text-xs text-amber-600 dark:text-amber-400 italic">
                      <AlertCircle size={12} className="mr-1" /> Pending
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">{data.total}</td>
                <td className="px-6 py-4 text-center text-sm">
                  {data.earned !== null ? (
                    <span className={`font-semibold ${((data.earned / data.total) * 100) >= 40 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {((data.earned / data.total) * 100).toFixed(0)}%
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-blue-50 dark:bg-ruet-dark/20">
              <td className="px-6 py-4 text-sm font-bold text-ruet-blue dark:text-blue-300">Grand Total</td>
              <td className="px-6 py-4 text-center text-lg font-extrabold text-ruet-blue dark:text-blue-300">{totalEarned.toFixed(1)}</td>
              <td className="px-6 py-4 text-center text-sm font-bold text-gray-500 dark:text-gray-400">{totalPossible}</td>
              <td className="px-6 py-4 text-center text-lg font-extrabold text-ruet-blue dark:text-blue-300">{percentage}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default StudentMarksheet;
