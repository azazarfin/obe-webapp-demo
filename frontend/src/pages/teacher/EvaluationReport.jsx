import React, { useState } from 'react';
import { Download, FileText, Target } from 'lucide-react';

const mockMarksData = [
  { id: '2103001', name: 'Rahim Uddin', att: 9.5, ct: 18, assign: 8, final: 45 },
  { id: '2103002', name: 'Karim Hasan', att: 8.0, ct: 15, assign: 7, final: 35 },
  { id: '2103003', name: 'Sadia Rahman', att: 10, ct: 19, assign: 9, final: 52 },
  { id: '2103004', name: 'Tamim Iqbal', att: 7.5, ct: 12, assign: 6, final: 28 },
  { id: '2103005', name: 'Nadia Sultana', att: 9.0, ct: 17, assign: 8, final: 48 },
];

const mockObeData = {
  classAttainment: {
    CO1: { percentage: 85, kpi: 60, achieved: true },
    CO2: { percentage: 70, kpi: 60, achieved: true },
    CO3: { percentage: 55, kpi: 60, achieved: false },
    CO4: { percentage: 90, kpi: 60, achieved: true },
  },
  studentAttainment: [
    { id: '2103001', name: 'Rahim Uddin', co1: 88, co2: 75, co3: 65, co4: 92, po1: 82, po2: 78 },
    { id: '2103002', name: 'Karim Hasan', co1: 65, co2: 55, co3: 50, co4: 70, po1: 60, po2: 60 },
    { id: '2103003', name: 'Sadia Rahman', co1: 95, co2: 85, co3: 75, co4: 98, po1: 90, po2: 85 },
    { id: '2103004', name: 'Tamim Iqbal', co1: 55, co2: 45, co3: 40, co4: 60, po1: 50, po2: 50 },
    { id: '2103005', name: 'Nadia Sultana', co1: 90, co2: 80, co3: 70, co4: 95, po1: 85, po2: 80 },
  ]
};

const EvaluationReport = () => {
  const [activeTab, setActiveTab] = useState('marksheet');

  const getGrade = (total) => {
    if (total >= 80) return 'A+';
    if (total >= 75) return 'A';
    if (total >= 70) return 'A-';
    if (total >= 65) return 'B+';
    if (total >= 60) return 'B';
    if (total >= 55) return 'B-';
    if (total >= 50) return 'C+';
    if (total >= 45) return 'C';
    if (total >= 40) return 'D';
    return 'F';
  };

  const renderMarksheet = () => (
    <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student Info</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Attendance (10)</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">CT Best 3 (20)</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Assignment (10)</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Final Exam (60)</th>
            <th className="px-6 py-3 text-center text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider bg-gray-100 dark:bg-gray-800">Total (100)</th>
            <th className="px-6 py-3 text-center text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider bg-gray-100 dark:bg-gray-800">Grade</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
          {mockMarksData.map((s) => {
            const total = s.att + s.ct + s.assign + s.final;
            return (
              <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{s.id}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{s.name}</div>
                </td>
                <td className="px-4 py-4 text-center text-sm text-gray-700 dark:text-gray-300">{s.att}</td>
                <td className="px-4 py-4 text-center text-sm text-gray-700 dark:text-gray-300">{s.ct}</td>
                <td className="px-4 py-4 text-center text-sm text-gray-700 dark:text-gray-300">{s.assign}</td>
                <td className="px-4 py-4 text-center text-sm text-gray-700 dark:text-gray-300">{s.final}</td>
                <td className="px-6 py-4 text-center text-sm font-bold text-ruet-blue dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/10">{total}</td>
                <td className="px-6 py-4 text-center text-sm font-bold text-gray-900 dark:text-white bg-blue-50/30 dark:bg-blue-900/10">{getGrade(total)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderObeAttainment = () => (
    <div className="space-y-6">
      {/* Class Level KPI Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(mockObeData.classAttainment).map(([co, data]) => (
          <div key={co} className={`p-4 rounded-lg border ${data.achieved ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
            <h4 className="font-bold text-gray-900 dark:text-white flex justify-between items-center">
              <span>{co} Attainment</span>
              {data.achieved ? <span className="text-xs text-green-600 dark:text-green-400 font-bold bg-green-100 dark:bg-green-900 rounded px-2 py-0.5">Met</span> : <span className="text-xs text-red-600 dark:text-red-400 font-bold bg-red-100 dark:bg-red-900 rounded px-2 py-0.5">Failed</span>}
            </h4>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className={`text-2xl font-extrabold ${data.achieved ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{data.percentage}%</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Class Pass Rate</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Threshold KPI: {data.kpi}%</p>
          </div>
        ))}
      </div>

      {/* Student Level OBE Grid */}
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6">Individual Student Outcomes</h3>
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student Info</th>
              {['CO1', 'CO2', 'CO3', 'CO4', 'PO1', 'PO2'].map((col) => (
                <th key={col} className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-l border-gray-200 dark:border-gray-700">{col} (%)</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
            {mockObeData.studentAttainment.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{s.id}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{s.name}</div>
                </td>
                {['co1', 'co2', 'co3', 'co4', 'po1', 'po2'].map((k) => (
                  <td key={k} className={`px-4 py-4 text-center text-sm font-medium border-l border-gray-100 dark:border-gray-800 ${s[k] >= 60 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                    {s[k]}%
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Evaluation Report</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Class: CSE 3101 (Section A, 2021 Series)</p>
        </div>
        
        {/* Export Buttons */}
        <div className="flex space-x-2">
          <button className="flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Download size={14} className="mr-1.5" /> Execl
          </button>
          <button className="flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Download size={14} className="mr-1.5" /> PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('marksheet')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'marksheet' ? 'border-ruet-blue text-ruet-blue dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}`}
        >
          <FileText size={16} className="mr-2" />
          General Marksheet
        </button>
        <button
          onClick={() => setActiveTab('obe')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'obe' ? 'border-ruet-blue text-ruet-blue dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}`}
        >
          <Target size={16} className="mr-2" />
          OBE Attainment Profile
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'marksheet' ? renderMarksheet() : renderObeAttainment()}
      </div>
    </div>
  );
};

export default EvaluationReport;
