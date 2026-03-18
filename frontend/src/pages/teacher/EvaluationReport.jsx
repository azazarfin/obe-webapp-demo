import React, { useState } from 'react';
import { Download, FileText, Target } from 'lucide-react';
import { getGrade, getGPA } from '../../utils/gradeUtils';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';

const mockTheoryMarksData = [
  { id: '2103001', name: 'Rahim Uddin', att: 9.5, ct: 18, assign: 8, final: 45 },
  { id: '2103002', name: 'Karim Hasan', att: 8.0, ct: 15, assign: 7, final: 35 },
  { id: '2103003', name: 'Sadia Rahman', att: 10, ct: 19, assign: 9, final: 52 },
  { id: '2103004', name: 'Tamim Iqbal', att: 7.5, ct: 12, assign: 6, final: 28 },
  { id: '2103005', name: 'Nadia Sultana', att: 9.0, ct: 17, assign: 8, final: 48 },
];

const mockSessionalMarksData = [
  { id: '2103001', name: 'Rahim Uddin', att: 9.0, quiz: 16, performance: 22, viva: 14, labFinal: 28 },
  { id: '2103002', name: 'Karim Hasan', att: 7.5, quiz: 13, performance: 18, viva: 11, labFinal: 22 },
  { id: '2103003', name: 'Sadia Rahman', att: 10, quiz: 18, performance: 24, viva: 15, labFinal: 30 },
  { id: '2103004', name: 'Tamim Iqbal', att: 6.5, quiz: 10, performance: 15, viva: 9, labFinal: 18 },
  { id: '2103005', name: 'Nadia Sultana', att: 8.5, quiz: 15, performance: 20, viva: 13, labFinal: 26 },
];

const mockTheoryObeData = {
  poAttainment: {
    PO1: { percentage: 82, kpi: 50, achieved: true },
    PO2: { percentage: 78, kpi: 50, achieved: true },
    PO3: { percentage: 45, kpi: 50, achieved: false },
  },
  coAttainment: {
    CO1: { percentage: 85, kpi: 50, achieved: true },
    CO2: { percentage: 70, kpi: 50, achieved: true },
    CO3: { percentage: 55, kpi: 50, achieved: true },
    CO4: { percentage: 90, kpi: 50, achieved: true },
  },
  studentAttainment: [
    { id: '2103001', name: 'Rahim Uddin', co1: 88, co2: 75, co3: 65, co4: 92, po1: 82, po2: 78, po3: 68 },
    { id: '2103002', name: 'Karim Hasan', co1: 65, co2: 55, co3: 50, co4: 70, po1: 60, po2: 60, po3: 52 },
    { id: '2103003', name: 'Sadia Rahman', co1: 95, co2: 85, co3: 75, co4: 98, po1: 90, po2: 85, po3: 80 },
    { id: '2103004', name: 'Tamim Iqbal', co1: 55, co2: 45, co3: 40, co4: 60, po1: 50, po2: 50, po3: 42 },
    { id: '2103005', name: 'Nadia Sultana', co1: 90, co2: 80, co3: 70, co4: 95, po1: 85, po2: 80, po3: 75 },
  ]
};

const mockSessionalObeData = {
  poAttainment: {
    PO1: { percentage: 76, kpi: 50, achieved: true },
    PO2: { percentage: 72, kpi: 50, achieved: true },
  },
  coAttainment: {
    CO1: { percentage: 80, kpi: 50, achieved: true },
    CO2: { percentage: 65, kpi: 50, achieved: true },
    CO3: { percentage: 48, kpi: 50, achieved: false },
  },
  studentAttainment: [
    { id: '2103001', name: 'Rahim Uddin', co1: 85, co2: 72, co3: 60, po1: 78, po2: 70 },
    { id: '2103002', name: 'Karim Hasan', co1: 60, co2: 52, co3: 45, po1: 55, po2: 50 },
    { id: '2103003', name: 'Sadia Rahman', co1: 92, co2: 82, co3: 70, po1: 88, po2: 82 },
    { id: '2103004', name: 'Tamim Iqbal', co1: 48, co2: 40, co3: 35, po1: 42, po2: 38 },
    { id: '2103005', name: 'Nadia Sultana', co1: 82, co2: 75, co3: 62, po1: 78, po2: 72 },
  ]
};

const EvaluationReport = ({ courseType = 'Theory' }) => {
  const [activeTab, setActiveTab] = useState('marksheet');
  const isTheory = courseType === 'Theory';
  const marksData = isTheory ? mockTheoryMarksData : mockSessionalMarksData;
  const obeData = isTheory ? mockTheoryObeData : mockSessionalObeData;
  const courseCode = isTheory ? 'CSE 3101' : 'CSE 3102';
  const courseName = isTheory ? 'Database Systems' : 'Database Systems Lab';

  const computeTheoryTotal = (s) => s.att + s.ct + s.assign + s.final;
  const computeSessionalTotal = (s) => s.att + s.quiz + s.performance + s.viva + s.labFinal;
  const computeTotal = (s) => isTheory ? computeTheoryTotal(s) : computeSessionalTotal(s);

  const handleExcelExport = () => {
    let headers, rows;
    if (activeTab === 'marksheet') {
      if (isTheory) {
        headers = ['Roll', 'Name', 'Attendance (10)', 'CT Best 3 (20)', 'Assignment (10)', 'Final Exam (60)', 'Total (100)', 'GPA', 'Grade'];
        rows = marksData.map(s => {
          const total = computeTotal(s);
          return [s.id, s.name, s.att, s.ct, s.assign, s.final, total, getGPA(total).toFixed(2), getGrade(total)];
        });
      } else {
        headers = ['Roll', 'Name', 'Attendance (10)', 'Quiz (20)', 'Performance (25)', 'Viva (15)', 'Lab Final (30)', 'Total (100)', 'GPA', 'Grade'];
        rows = marksData.map(s => {
          const total = computeTotal(s);
          return [s.id, s.name, s.att, s.quiz, s.performance, s.viva, s.labFinal, total, getGPA(total).toFixed(2), getGrade(total)];
        });
      }
    } else {
      const poKeys = Object.keys(obeData.poAttainment);
      const coKeys = Object.keys(obeData.coAttainment);
      headers = ['Roll', 'Name', ...poKeys.map(k => `${k} (%)`), ...coKeys.map(k => `${k} (%)`)];
      rows = obeData.studentAttainment.map(s => {
        const poVals = poKeys.map(k => s[k.toLowerCase()] ?? '');
        const coVals = coKeys.map(k => s[k.toLowerCase()] ?? '');
        return [s.id, s.name, ...poVals, ...coVals];
      });
    }
    exportToExcel(headers, rows, `${courseCode}_${activeTab}`);
  };

  const handlePdfExport = () => {
    let headers, rows;
    if (activeTab === 'marksheet') {
      if (isTheory) {
        headers = ['Roll', 'Name', 'Att(10)', 'CT(20)', 'Asgn(10)', 'Final(60)', 'Total', 'GPA', 'Grade'];
        rows = marksData.map(s => {
          const total = computeTotal(s);
          return [s.id, s.name, s.att, s.ct, s.assign, s.final, total, getGPA(total).toFixed(2), getGrade(total)];
        });
      } else {
        headers = ['Roll', 'Name', 'Att(10)', 'Quiz(20)', 'Perf(25)', 'Viva(15)', 'Lab(30)', 'Total', 'GPA', 'Grade'];
        rows = marksData.map(s => {
          const total = computeTotal(s);
          return [s.id, s.name, s.att, s.quiz, s.performance, s.viva, s.labFinal, total, getGPA(total).toFixed(2), getGrade(total)];
        });
      }
    } else {
      const poKeys = Object.keys(obeData.poAttainment);
      const coKeys = Object.keys(obeData.coAttainment);
      headers = ['Roll', 'Name', ...poKeys, ...coKeys];
      rows = obeData.studentAttainment.map(s => {
        const poVals = poKeys.map(k => `${s[k.toLowerCase()] ?? 0}%`);
        const coVals = coKeys.map(k => `${s[k.toLowerCase()] ?? 0}%`);
        return [s.id, s.name, ...poVals, ...coVals];
      });
    }
    exportToPDF(`Evaluation Report — ${courseCode}`, `${courseName} (Section A, 2021 Series)`, headers, rows, `${courseCode}_${activeTab}`);
  };

  const renderTheoryMarksheet = () => (
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
            <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider bg-gray-100 dark:bg-gray-800">GPA</th>
            <th className="px-6 py-3 text-center text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider bg-gray-100 dark:bg-gray-800">Grade</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
          {mockTheoryMarksData.map((s) => {
            const total = computeTheoryTotal(s);
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
                <td className="px-4 py-4 text-center text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-blue-50/30 dark:bg-blue-900/10">{getGPA(total).toFixed(2)}</td>
                <td className="px-6 py-4 text-center text-sm font-bold text-gray-900 dark:text-white bg-blue-50/30 dark:bg-blue-900/10">{getGrade(total)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderSessionalMarksheet = () => (
    <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student Info</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Attendance (10)</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quiz (20)</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Performance (25)</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Viva (15)</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lab Final (30)</th>
            <th className="px-6 py-3 text-center text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider bg-gray-100 dark:bg-gray-800">Total (100)</th>
            <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider bg-gray-100 dark:bg-gray-800">GPA</th>
            <th className="px-6 py-3 text-center text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider bg-gray-100 dark:bg-gray-800">Grade</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
          {mockSessionalMarksData.map((s) => {
            const total = computeSessionalTotal(s);
            return (
              <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{s.id}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{s.name}</div>
                </td>
                <td className="px-4 py-4 text-center text-sm text-gray-700 dark:text-gray-300">{s.att}</td>
                <td className="px-4 py-4 text-center text-sm text-gray-700 dark:text-gray-300">{s.quiz}</td>
                <td className="px-4 py-4 text-center text-sm text-gray-700 dark:text-gray-300">{s.performance}</td>
                <td className="px-4 py-4 text-center text-sm text-gray-700 dark:text-gray-300">{s.viva}</td>
                <td className="px-4 py-4 text-center text-sm text-gray-700 dark:text-gray-300">{s.labFinal}</td>
                <td className="px-6 py-4 text-center text-sm font-bold text-ruet-blue dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/10">{total}</td>
                <td className="px-4 py-4 text-center text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-blue-50/30 dark:bg-blue-900/10">{getGPA(total).toFixed(2)}</td>
                <td className="px-6 py-4 text-center text-sm font-bold text-gray-900 dark:text-white bg-blue-50/30 dark:bg-blue-900/10">{getGrade(total)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderAttainmentTile = (label, data, colorScheme) => (
    <div className={`p-4 rounded-lg border ${data.achieved ? `bg-${colorScheme}-50 border-${colorScheme}-200 dark:bg-${colorScheme}-900/20 dark:border-${colorScheme}-800` : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
      <h4 className="font-bold text-gray-900 dark:text-white flex justify-between items-center">
        <span>{label}</span>
        {data.achieved ? <span className="text-xs text-green-600 dark:text-green-400 font-bold bg-green-100 dark:bg-green-900 rounded px-2 py-0.5">Met</span> : <span className="text-xs text-red-600 dark:text-red-400 font-bold bg-red-100 dark:bg-red-900 rounded px-2 py-0.5">Failed</span>}
      </h4>
      <div className="mt-2 flex items-baseline space-x-2">
        <span className={`text-2xl font-extrabold ${data.achieved ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{data.percentage}%</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">Class Pass Rate</span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Threshold KPI: ≥{data.kpi}%</p>
    </div>
  );

  const renderObeAttainment = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">PO Attainment Status</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(obeData.poAttainment).map(([po, data]) => (
          <div key={po} className={`p-4 rounded-lg border ${data.achieved ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
            <h4 className="font-bold text-gray-900 dark:text-white flex justify-between items-center">
              <span>{po} Attainment</span>
              {data.achieved ? <span className="text-xs text-green-600 dark:text-green-400 font-bold bg-green-100 dark:bg-green-900 rounded px-2 py-0.5">Met</span> : <span className="text-xs text-red-600 dark:text-red-400 font-bold bg-red-100 dark:bg-red-900 rounded px-2 py-0.5">Failed</span>}
            </h4>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className={`text-2xl font-extrabold ${data.achieved ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400'}`}>{data.percentage}%</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Class Pass Rate</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Threshold KPI: ≥{data.kpi}%</p>
          </div>
        ))}
      </div>

      <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6">CO Attainment Status</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(obeData.coAttainment).map(([co, data]) => (
          <div key={co} className={`p-4 rounded-lg border ${data.achieved ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
            <h4 className="font-bold text-gray-900 dark:text-white flex justify-between items-center">
              <span>{co} Attainment</span>
              {data.achieved ? <span className="text-xs text-green-600 dark:text-green-400 font-bold bg-green-100 dark:bg-green-900 rounded px-2 py-0.5">Met</span> : <span className="text-xs text-red-600 dark:text-red-400 font-bold bg-red-100 dark:bg-red-900 rounded px-2 py-0.5">Failed</span>}
            </h4>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className={`text-2xl font-extrabold ${data.achieved ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{data.percentage}%</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Class Pass Rate</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Threshold KPI: ≥{data.kpi}%</p>
          </div>
        ))}
      </div>

      <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6">Individual Student Outcomes</h3>
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student Info</th>
              {Object.keys(obeData.poAttainment).map(po => (
                <th key={po} className="px-4 py-3 text-center text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider border-l border-gray-200 dark:border-gray-700">{po} (%)</th>
              ))}
              {Object.keys(obeData.coAttainment).map(co => (
                <th key={co} className="px-4 py-3 text-center text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wider border-l border-gray-200 dark:border-gray-700">{co} (%)</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
            {obeData.studentAttainment.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{s.id}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{s.name}</div>
                </td>
                {Object.keys(obeData.poAttainment).map(po => {
                  const val = s[po.toLowerCase()];
                  return (
                    <td key={po} className={`px-4 py-4 text-center text-sm font-medium border-l border-gray-100 dark:border-gray-800 ${val >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                      {val}%
                    </td>
                  );
                })}
                {Object.keys(obeData.coAttainment).map(co => {
                  const val = s[co.toLowerCase()];
                  return (
                    <td key={co} className={`px-4 py-4 text-center text-sm font-medium border-l border-gray-100 dark:border-gray-800 ${val >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                      {val}%
                    </td>
                  );
                })}
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
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Class: {courseCode} — {courseName} (Section A, 2021 Series)
            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${isTheory ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'}`}>
              {courseType}
            </span>
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button onClick={handleExcelExport} className="flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Download size={14} className="mr-1.5" /> Excel
          </button>
          <button onClick={handlePdfExport} className="flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Download size={14} className="mr-1.5" /> PDF
          </button>
        </div>
      </div>

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

      <div className="mt-4">
        {activeTab === 'marksheet'
          ? (isTheory ? renderTheoryMarksheet() : renderSessionalMarksheet())
          : renderObeAttainment()
        }
      </div>
    </div>
  );
};

export default EvaluationReport;
