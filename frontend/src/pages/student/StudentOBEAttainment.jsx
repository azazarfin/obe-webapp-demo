import React from 'react';
import { Target, TrendingUp, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';

const StudentOBEAttainment = ({ course }) => {
  if (!course) return null;

  const coEntries = Object.entries(course.obe || {});
  const poEntries = Object.entries(course.poAttainment || {}).map(([po, percentage]) => ({ po, percentage }));
  const totalCOs = coEntries.length;
  const attainedCOs = coEntries.filter(([, data]) => data.percentage >= data.threshold).length;
  const overallAttainment = totalCOs > 0 ? Math.round(coEntries.reduce((sum, [, data]) => sum + data.percentage, 0) / totalCOs) : 0;
  const kpi = totalCOs > 0 ? ((attainedCOs / totalCOs) * 100).toFixed(0) : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">OBE Attainment Info</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{course.code} - {course.name} · Instructor: {course.teacher}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1e1e1e] shadow-sm rounded-lg p-5 border border-gray-100 dark:border-gray-800 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
            <BarChart3 size={24} className="text-ruet-blue dark:text-blue-400" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Overall CO Attainment</p>
          <p className="text-3xl font-bold text-ruet-blue dark:text-blue-400 mt-1">{overallAttainment}%</p>
        </div>

        <div className="bg-white dark:bg-[#1e1e1e] shadow-sm rounded-lg p-5 border border-gray-100 dark:border-gray-800 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
            <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">COs Attained</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{attainedCOs}<span className="text-lg font-normal text-gray-500">/{totalCOs}</span></p>
        </div>

        <div className="bg-white dark:bg-[#1e1e1e] shadow-sm rounded-lg p-5 border border-gray-100 dark:border-gray-800 text-center">
          <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3 ${parseInt(kpi, 10) >= 60 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
            <TrendingUp size={24} className={parseInt(kpi, 10) >= 60 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">KPI Score</p>
          <p className={`text-3xl font-bold mt-1 ${parseInt(kpi, 10) >= 60 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{kpi}%</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Target className="mr-2 text-ruet-blue dark:text-blue-400" size={20} /> Course Outcome (CO) Attainment
        </h3>
        <div className="space-y-3">
          {coEntries.length > 0 ? coEntries.map(([co, data]) => {
            const met = data.percentage >= data.threshold;
            return (
              <div key={co} className="flex items-center gap-4">
                <span className="w-12 text-sm font-bold text-gray-700 dark:text-gray-300">{co}</span>
                <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative">
                  <div className={`h-full rounded-full transition-all duration-500 ${met ? 'bg-green-500 dark:bg-green-600' : 'bg-red-500 dark:bg-red-600'}`} style={{ width: `${Math.min(data.percentage, 100)}%` }} />
                  <div className="absolute top-0 h-full border-l-2 border-dashed border-gray-400 dark:border-gray-500" style={{ left: `${data.threshold}%` }} title={`Threshold: ${data.threshold}%`} />
                </div>
                <div className="w-16 text-right">
                  <span className={`text-sm font-bold ${met ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{data.percentage}%</span>
                </div>
                <div className="w-6">
                  {met ? <CheckCircle size={16} className="text-green-500" /> : <AlertTriangle size={16} className="text-red-500" />}
                </div>
              </div>
            );
          }) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No CO-mapped assessments have been recorded yet.</p>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">Dashed line indicates the threshold target (≥{coEntries[0]?.[1]?.threshold || 50}%).</p>
      </div>

      {poEntries.length > 0 && (
        <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrendingUp className="mr-2 text-indigo-500" size={20} /> Program Outcome (PO) Contribution
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {poEntries.map(({ po, percentage }) => (
              <div key={po} className={`rounded-lg p-4 text-center border ${percentage >= 60 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{po}</p>
                <p className={`text-2xl font-bold mt-1 ${percentage >= 60 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{percentage}%</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">Derived from the CO-to-PO mapping stored for this class instance.</p>
        </div>
      )}
    </div>
  );
};

export default StudentOBEAttainment;
