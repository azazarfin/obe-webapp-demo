import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileText, Target, Loader2 } from 'lucide-react';
import { getGrade, getGPA } from '../../utils/gradeUtils';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import api from '../../utils/api';

const EvaluationReport = ({ courseType = 'Theory', classInstance }) => {
  const [activeTab, setActiveTab] = useState('marksheet');
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvaluation = async () => {
      if (!classInstance?._id) return;

      try {
        setLoading(true);
        setError('');
        const data = await api.get(`/class-instances/${classInstance._id}/evaluation`);
        setEvaluation(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluation();
  }, [classInstance]);

  const isTheory = courseType === 'Theory';
  
  const marksData = useMemo(() => 
    (evaluation?.marksheet?.rows || []).slice().sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true, sensitivity: 'base' })),
    [evaluation]
  );

  const obeData = useMemo(() => {
    if (!evaluation?.obeData) return { poAttainment: {}, coAttainment: {}, studentAttainment: [] };
    const sortedStudents = (evaluation.obeData.studentAttainment || []).slice().sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true, sensitivity: 'base' }));
    return { ...evaluation.obeData, studentAttainment: sortedStudents };
  }, [evaluation]);

  if (!classInstance) return null;

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-ruet-blue" size={28} /></div>;
  }

  const courseCode = classInstance.course?.courseCode || 'N/A';
  const courseName = classInstance.course?.courseName || 'N/A';
  const section = classInstance.section || 'N/A';
  const series = classInstance.series || 'N/A';

  const handleExcelExport = () => {
    let headers;
    let rows;

    if (activeTab === 'marksheet') {
      if (isTheory) {
        headers = ['Roll', 'Name', 'Attendance (10)', 'CT Best 3 (20)', 'Assignment (10)', 'Final Exam (60)', 'Total (100)', 'GPA', 'Grade'];
        rows = marksData.map((s) => [s.id, s.name, s.att, s.ct, s.assign, s.final, s.total, s.gpa.toFixed(2), getGrade(s.total)]);
      } else {
        headers = ['Roll', 'Name', 'Attendance (10)', 'Quiz', 'Performance', 'Viva', 'Lab Final', 'Total', 'GPA', 'Grade'];
        rows = marksData.map((s) => [s.id, s.name, s.att, s.quiz, s.performance, s.viva, s.labFinal, s.total, s.gpa.toFixed(2), getGrade(s.total)]);
      }
    } else {
      const poKeys = Object.keys(obeData.poAttainment || {});
      const coKeys = Object.keys(obeData.coAttainment || {});
      headers = ['Roll', 'Name', ...poKeys.map((po) => `${po} (%)`), ...coKeys.map((co) => `${co} (%)`)];
      rows = (obeData.studentAttainment || []).map((s) => [
        s.id,
        s.name,
        ...poKeys.map((po) => s[po.toLowerCase()] ?? ''),
        ...coKeys.map((co) => s[co.toLowerCase()] ?? '')
      ]);

      // Add Summary Section
      rows.push([], ['COURSE ATTAINMENT SUMMARY'], ['Type', 'Attainment (%)', 'Threshold (%)', 'Status']);
      poKeys.forEach((po) => {
        const d = obeData.poAttainment[po];
        rows.push([po, `${d.percentage}%`, `${d.kpi}%`, d.achieved ? 'MET' : 'FAILED']);
      });
      coKeys.forEach((co) => {
        const d = obeData.coAttainment[co];
        rows.push([co, `${d.percentage}%`, `${d.kpi}%`, d.achieved ? 'MET' : 'FAILED']);
      });
    }

    exportToExcel(headers, rows, `${courseCode}_${activeTab}`);
  };

  const handlePdfExport = () => {
    let headers;
    let rows;

    if (activeTab === 'marksheet') {
      if (isTheory) {
        headers = ['Roll', 'Name', 'Att', 'CT', 'Assign', 'Final', 'Total', 'GPA', 'Grade'];
        rows = marksData.map((s) => [s.id, s.name, s.att, s.ct, s.assign, s.final, s.total, s.gpa.toFixed(2), getGrade(s.total)]);
      } else {
        headers = ['Roll', 'Name', 'Att', 'Quiz', 'Perf', 'Viva', 'Lab', 'Total', 'GPA', 'Grade'];
        rows = marksData.map((s) => [s.id, s.name, s.att, s.quiz, s.performance, s.viva, s.labFinal, s.total, s.gpa.toFixed(2), getGrade(s.total)]);
      }
    } else {
      const poKeys = Object.keys(obeData.poAttainment || {});
      const coKeys = Object.keys(obeData.coAttainment || {});
      headers = ['Roll', 'Name', ...poKeys, ...coKeys];
      rows = (obeData.studentAttainment || []).map((s) => [
        s.id,
        s.name,
        ...poKeys.map((po) => `${s[po.toLowerCase()] ?? 0}%`),
        ...coKeys.map((co) => `${s[co.toLowerCase()] ?? 0}%`)
      ]);

      // Add Summary Section
      rows.push([], ['ATTAINMENT SUMMARY'], ['Type', 'Attainment', 'Threshold', 'Status']);
      poKeys.forEach((po) => {
        const d = obeData.poAttainment[po];
        rows.push([po, `${d.percentage}%`, `${d.kpi}%`, d.achieved ? 'MET' : 'FAILED']);
      });
      coKeys.forEach((co) => {
        const d = obeData.coAttainment[co];
        rows.push([co, `${d.percentage}%`, `${d.kpi}%`, d.achieved ? 'MET' : 'FAILED']);
      });
    }

    exportToPDF(`Evaluation Report - ${courseCode}`, `${courseName} (Section ${section}, ${series} Series)`, headers, rows, `${courseCode}_${activeTab}`);
  };

  const renderMarksheet = () => (
    <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
          {isTheory ? (
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student Info</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Attendance (10)</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">CT Best 3 (20)</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Assignment (10)</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Final Exam (60)</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider bg-gray-100 dark:bg-gray-800">Total (100)</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider bg-gray-100 dark:bg-gray-800">Grade</th>
            </tr>
          ) : (
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student Info</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Attendance (10)</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quiz</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Performance</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Viva</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lab Final</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider bg-gray-100 dark:bg-gray-800">Total</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider bg-gray-100 dark:bg-gray-800">Grade</th>
            </tr>
          )}
        </thead>
        <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
          {marksData.map((s) => (
            <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-6 py-4 whitespace-nowrap font-mono">
                <div className="text-sm font-bold text-gray-900 dark:text-white">{s.id}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-sans">{s.name}</div>
              </td>
              <td className="px-4 py-4 text-center text-sm text-gray-700 dark:text-gray-300">{s.att}</td>
              {isTheory ? (
                <>
                  <td className="px-4 py-4 text-center text-sm text-gray-700 dark:text-gray-300">{s.ct}</td>
                  <td className="px-4 py-4 text-center text-sm text-gray-700 dark:text-gray-300">{s.assign}</td>
                  <td className="px-4 py-4 text-center text-sm text-gray-700 dark:text-gray-300">{s.final}</td>
                </>
              ) : (
                <>
                  <td className="px-4 py-4 text-center text-sm text-gray-700 dark:text-gray-300">{s.quiz}</td>
                  <td className="px-4 py-4 text-center text-sm text-gray-700 dark:text-gray-300">{s.performance}</td>
                  <td className="px-4 py-4 text-center text-sm text-gray-700 dark:text-gray-300">{s.viva}</td>
                  <td className="px-4 py-4 text-center text-sm text-gray-700 dark:text-gray-300">{s.labFinal}</td>
                </>
              )}
              <td className="px-6 py-4 text-center text-sm font-bold text-ruet-blue dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/10">{s.total}</td>
              <td className="px-6 py-4 text-center text-sm font-bold text-gray-900 dark:text-white bg-blue-50/30 dark:bg-blue-900/10">{getGrade(s.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderObeAttainment = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* PO Attainment Tiles (Upper Row) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(obeData.poAttainment || {}).map(([po, data]) => (
            <div key={po} className={`p-4 rounded-lg border ${data.achieved ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
              <h4 className="font-bold text-gray-900 dark:text-white flex justify-between items-center text-sm md:text-base">
                <span>{po} Attainment</span>
                {data.achieved ? <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-100 dark:bg-blue-900/40 rounded px-1.5 py-0.5 uppercase">Met</span> : <span className="text-[10px] text-red-600 dark:text-red-400 font-bold bg-red-100 dark:bg-red-900/40 rounded px-1.5 py-0.5 uppercase">Failed</span>}
              </h4>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className={`text-2xl font-extrabold ${data.achieved ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400'}`}>{data.percentage}%</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold">Pass Rate</span>
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Threshold: {data.kpi}%</p>
            </div>
          ))}
        </div>

        {/* CO Attainment Tiles (Lower Row) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(obeData.coAttainment || {}).map(([co, data]) => (
            <div key={co} className={`p-4 rounded-lg border ${data.achieved ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
              <h4 className="font-bold text-gray-900 dark:text-white flex justify-between items-center text-sm md:text-base">
                <span>{co} Attainment</span>
                {data.achieved ? <span className="text-[10px] text-green-600 dark:text-green-400 font-bold bg-green-100 dark:bg-green-900/40 rounded px-1.5 py-0.5 uppercase">Met</span> : <span className="text-[10px] text-red-600 dark:text-red-400 font-bold bg-red-100 dark:bg-red-900/40 rounded px-1.5 py-0.5 uppercase">Failed</span>}
              </h4>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className={`text-2xl font-extrabold ${data.achieved ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{data.percentage}%</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold">Pass Rate</span>
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Threshold: {data.kpi}%</p>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student Info</th>
              {Object.keys(obeData.coAttainment || {}).map((co) => (
                <th key={co} className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-l border-gray-200 dark:border-gray-700">{co} (%)</th>
              ))}
              {Object.keys(obeData.poAttainment || {}).map((po) => (
                <th key={po} className="px-4 py-3 text-center text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider border-l border-gray-200 dark:border-gray-700">{po} (%)</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
            {(obeData.studentAttainment || []).map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 whitespace-nowrap font-mono">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">{s.id}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-sans">{s.name}</div>
                </td>
                {Object.keys(obeData.coAttainment || {}).map((co) => {
                  const val = s[co.toLowerCase()] ?? 0;
                  return <td key={co} className={`px-4 py-4 text-center text-sm font-medium border-l border-gray-100 dark:border-gray-800 ${val >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{val}%</td>;
                })}
                {Object.keys(obeData.poAttainment || {}).map((po) => {
                  const val = s[po.toLowerCase()] ?? 0;
                  return <td key={po} className={`px-4 py-4 text-center text-sm font-bold border-l border-gray-100 dark:border-gray-800 ${val >= 50 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500 dark:text-red-400'}`}>{val}%</td>;
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
      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded text-sm mb-4">{error}</div>}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Evaluation Report</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Class: {courseCode} - {courseName} (Section {section}, {series} Series)</p>
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

      <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700 mb-6 font-medium">
        <button
          onClick={() => setActiveTab('marksheet')}
          className={`px-4 py-2 text-sm border-b-2 transition-colors flex items-center ${activeTab === 'marksheet' ? 'border-ruet-blue text-ruet-blue dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}`}
        >
          <FileText size={16} className="mr-2" />
          General Marksheet
        </button>
        <button
          onClick={() => setActiveTab('obe')}
          className={`px-4 py-2 text-sm border-b-2 transition-colors flex items-center ${activeTab === 'obe' ? 'border-ruet-blue text-ruet-blue dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}`}
        >
          <Target size={16} className="mr-2" />
          OBE Attainment Profile
        </button>
      </div>

      <div className="mt-4">
        {activeTab === 'marksheet' ? renderMarksheet() : renderObeAttainment()}
      </div>
    </div>
  );
};

export default EvaluationReport;

