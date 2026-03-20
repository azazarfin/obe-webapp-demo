import React from 'react';
import { AlertCircle, Lock, ShieldCheck } from 'lucide-react';
import { getGrade, getGPA } from '../../utils/gradeUtils';

const labelMap = {
  attendance: 'Attendance Marks',
  ct: 'Class Tests (Best 3 avg)',
  assignment: 'Continuous Assessment',
  quiz: 'Quiz',
  performance: 'Performance / Report',
  viva: 'Viva',
  labFinal: 'Lab Final'
};

const StudentMarksheet = ({ course }) => {
  if (!course) return null;

  const isSessional = course.type === 'Sessional';
  const marks = course.marks || {};

  if (isSessional) {
    const visibleKeys = ['attendance', 'quiz', 'performance', 'viva', 'labFinal'];
    const visibleEntries = visibleKeys
      .map((key) => [key, marks[key]])
      .filter(([, value]) => value && value.total > 0);
    const totalEarned = course.total?.earned || 0;
    const totalPossible = course.total?.total || 0;
    const gpa = getGPA(totalEarned);
    const grade = getGrade(totalEarned);

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Marksheet</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{course.code} - {course.name} · Instructor: {course.teacher}</p>
          <span className="inline-block mt-2 px-2.5 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">Sessional</span>
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
              {visibleEntries.map(([key, value]) => (
                <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{labelMap[key] || key}</td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-gray-900 dark:text-white">{value.earned}</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">{value.total}</td>
                  <td className="px-6 py-4 text-center text-sm font-semibold text-green-600 dark:text-green-400">{value.total > 0 ? ((value.earned / value.total) * 100).toFixed(0) : 0}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-blue-50 dark:bg-ruet-dark/20">
                <td className="px-6 py-4 text-sm font-bold text-ruet-blue dark:text-blue-300">Total</td>
                <td className="px-6 py-4 text-center text-lg font-extrabold text-ruet-blue dark:text-blue-300">{totalEarned.toFixed(1)}</td>
                <td className="px-6 py-4 text-center text-sm font-bold text-gray-500 dark:text-gray-400">{totalPossible}</td>
                <td className="px-6 py-4 text-center text-lg font-extrabold text-ruet-blue dark:text-blue-300">{totalPossible > 0 ? ((totalEarned / totalPossible) * 100).toFixed(1) : 0}%</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-8 border border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-lg mx-auto">
            <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Grade Point Average</p>
              <p className="text-5xl font-extrabold text-ruet-blue dark:text-blue-400">{gpa.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">out of 4.00</p>
            </div>
            <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Letter Grade</p>
              <p className="text-5xl font-extrabold text-green-700 dark:text-green-400">{grade}</p>
              <div className="flex items-center justify-center mt-2">
                <ShieldCheck size={14} className="text-green-600 dark:text-green-400 mr-1" />
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">{grade === 'F' ? 'Not Passed' : 'Passed'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const visibleEntries = ['attendance', 'ct', 'assignment']
    .map((key) => [key, marks[key]])
    .filter(([, value]) => value && value.total > 0);

  const visibleEarned = visibleEntries.reduce((sum, [, value]) => sum + value.earned, 0);
  const visibleTotal = visibleEntries.reduce((sum, [, value]) => sum + value.total, 0);
  const visiblePercentage = visibleTotal > 0 ? ((visibleEarned / visibleTotal) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Marksheet</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{course.code} - {course.name} · Instructor: {course.teacher}</p>
        <span className="inline-block mt-2 px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Theory</span>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start space-x-3">
        <Lock size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Semester Final marks are not disclosed to students.</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Only the available continuous assessment marks are shown here.</p>
        </div>
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
            {visibleEntries.map(([key, value]) => (
              <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{labelMap[key] || key}</td>
                <td className="px-6 py-4 text-center text-sm">
                  {typeof value.earned === 'number' ? (
                    <span className="font-bold text-gray-900 dark:text-white">{value.earned}</span>
                  ) : (
                    <span className="inline-flex items-center text-xs text-amber-600 dark:text-amber-400 italic">
                      <AlertCircle size={12} className="mr-1" /> Pending
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">{value.total}</td>
                <td className="px-6 py-4 text-center text-sm">
                  <span className={`font-semibold ${value.total > 0 && ((value.earned / value.total) * 100) >= 40 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {value.total > 0 ? ((value.earned / value.total) * 100).toFixed(0) : 0}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-blue-50 dark:bg-ruet-dark/20">
              <td className="px-6 py-4 text-sm font-bold text-ruet-blue dark:text-blue-300">Total (without Semester Final)</td>
              <td className="px-6 py-4 text-center text-lg font-extrabold text-ruet-blue dark:text-blue-300">{visibleEarned.toFixed(1)}</td>
              <td className="px-6 py-4 text-center text-sm font-bold text-gray-500 dark:text-gray-400">{visibleTotal}</td>
              <td className="px-6 py-4 text-center text-lg font-extrabold text-ruet-blue dark:text-blue-300">{visiblePercentage}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default StudentMarksheet;
