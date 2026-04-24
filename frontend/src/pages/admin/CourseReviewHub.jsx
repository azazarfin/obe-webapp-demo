import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, ChevronDown, ChevronRight, Download, FileText, Loader2, MessageSquare, Star, Users, TrendingUp, TrendingDown, Minus, Eye } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { useGetDepartmentFeedbackSummaryQuery } from '../../store/slices/feedbackAnalyticsSlice';
import InstructorExperienceReport from '../teacher/InstructorExperienceReport';
import { ATTRIBUTE_GROUPS } from '../../utils/teacherReportExportUtils';

const STUDENT_QUESTIONS_SHORT = [
  'Effort Level',
  'CLO Alignment',
  'Structure',
  'Professional Skills',
  'Fair Assessment',
  'CLO Evaluation Tools'
];

const COMPARISON_MAP = [
  { label: 'Syllabus & Content', instrKeys: ['A', 'B'], studentIdx: [1, 2, 3] },
  { label: 'Teaching & Learning', instrKeys: ['C', 'D', 'E', 'F'], studentIdx: [0] },
  { label: 'Resources', instrKeys: ['G'], studentIdx: [] },
  { label: 'Assessment', instrKeys: ['H', 'I', 'J'], studentIdx: [4, 5] },
];

const avgFromKeys = (ratingsMap, keys) => {
  const vals = keys.map(k => ratingsMap[k]).filter(v => typeof v === 'number');
  return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
};

const avgFromIdx = (averages, indices) => {
  if (!averages || indices.length === 0) return null;
  const vals = indices.map(i => averages[i]).filter(v => typeof v === 'number' && v > 0);
  return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
};

const GapBadge = ({ gap }) => {
  if (gap === null) return <span className="text-gray-400 text-xs">—</span>;
  const color = gap > 0.3 ? 'text-green-600 dark:text-green-400' : gap < -0.3 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400';
  const Icon = gap > 0.3 ? TrendingUp : gap < -0.3 ? TrendingDown : Minus;
  return <span className={`flex items-center gap-1 text-sm font-bold ${color}`}><Icon size={14} />{gap > 0 ? '+' : ''}{gap.toFixed(1)}</span>;
};

const RatingBar = ({ value, max = 5, color = 'bg-ruet-blue' }) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`${color} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-bold text-gray-900 dark:text-white w-8 text-right">{value > 0 ? value.toFixed(1) : '—'}</span>
    </div>
  );
};

const SuggestionTab = ({ suggestions, label }) => (
  <div className="space-y-2">
    {suggestions.length === 0 ? (
      <p className="text-sm text-gray-400 italic py-4">No {label.toLowerCase()} suggestions submitted.</p>
    ) : suggestions.map((s, i) => (
      <div key={i} className="bg-gray-50 dark:bg-[#2d2d2d] border border-gray-200 dark:border-gray-700 p-3 rounded-lg">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-semibold">{s.course} — {s.teacher}</p>
        <p className="text-sm text-gray-700 dark:text-gray-300">{s.text}</p>
      </div>
    ))}
  </div>
);

const CourseReviewHub = () => {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [error, setError] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [suggestionTab, setSuggestionTab] = useState('syllabus');
  const [drillDownInstance, setDrillDownInstance] = useState(null);

  const { data: feedbackData, isLoading: loadingFeedback } = useGetDepartmentFeedbackSummaryQuery();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoadingReports(true);
        const deptId = currentUser?.department?._id;
        const endpoint = deptId ? `/instructor-reports?department=${deptId}` : '/instructor-reports';
        const data = await api.get(endpoint);
        setReports(Array.isArray(data) ? data : []);
      } catch (err) { setError(err.message); }
      finally { setLoadingReports(false); }
    };
    if (currentUser) fetchReports();
  }, [currentUser]);

  const loading = loadingReports || loadingFeedback;
  const studentSummaries = feedbackData?.summaries || [];
  const questions = feedbackData?.questions || [];

  // Build lookup: classInstanceId -> student feedback summary
  const studentMap = useMemo(() => {
    const m = {};
    studentSummaries.forEach(s => { m[s.classInstanceId] = s; });
    return m;
  }, [studentSummaries]);

  // Build lookup: classInstanceId -> instructor report
  const instrMap = useMemo(() => {
    const m = {};
    reports.forEach(r => {
      const ciId = r.classInstance?._id;
      if (ciId) m[ciId] = r;
    });
    return m;
  }, [reports]);

  // Unified course list
  const courseList = useMemo(() => {
    const seen = new Set();
    const list = [];
    const addItem = (ciId, sf, ir) => {
      if (seen.has(ciId)) return;
      seen.add(ciId);
      const ratingsMap = {};
      (ir?.ratings || []).forEach(r => { ratingsMap[r.attribute] = r.score; });
      const instrAvg = Object.values(ratingsMap).filter(v => typeof v === 'number');
      const instrOverall = instrAvg.length > 0 ? instrAvg.reduce((a, b) => a + b, 0) / instrAvg.length : null;
      list.push({
        classInstanceId: ciId,
        courseCode: sf?.courseCode || ir?.classInstance?.course?.courseCode || '',
        courseName: sf?.courseName || ir?.classInstance?.course?.courseName || '',
        section: sf?.section || ir?.classInstance?.section || 'N/A',
        series: sf?.series || ir?.classInstance?.series || '',
        status: sf?.status || ir?.classInstance?.status || '',
        teachers: sf?.teachers || (ir?.classInstance?.teachers?.length > 0 ? ir.classInstance.teachers : [ir?.classInstance?.teacher]).filter(Boolean).map(t => ({ name: t.name, designation: t.designation })),
        studentAvg: sf?.overallAverage || null,
        studentAverages: sf?.averages || [],
        studentParticipation: sf?.participation || 0,
        studentTotal: sf?.totalStudents || 0,
        studentSuggestions: sf?.suggestions || [],
        instrOverall,
        ratingsMap,
        instrReport: ir,
        hasInstrReport: Boolean(ir),
        hasStudentFeedback: (sf?.participation || 0) > 0,
        classInstance: ir?.classInstance || null,
      });
    };
    studentSummaries.forEach(sf => addItem(sf.classInstanceId, sf, instrMap[sf.classInstanceId]));
    reports.forEach(r => { const ciId = r.classInstance?._id; if (ciId) addItem(ciId, studentMap[ciId], r); });
    return list;
  }, [studentSummaries, reports, instrMap, studentMap]);

  // Department-wide stats
  const stats = useMemo(() => {
    const withStudent = courseList.filter(c => c.hasStudentFeedback);
    const withInstr = courseList.filter(c => c.hasInstrReport);
    const withBoth = courseList.filter(c => c.hasStudentFeedback && c.hasInstrReport);
    const avgStudent = withStudent.length > 0 ? withStudent.reduce((a, c) => a + (c.studentAvg || 0), 0) / withStudent.length : 0;
    const avgInstr = withInstr.length > 0 ? withInstr.reduce((a, c) => a + (c.instrOverall || 0), 0) / withInstr.length : 0;
    const totalParticipation = courseList.reduce((a, c) => a + c.studentParticipation, 0);
    const totalStudents = courseList.reduce((a, c) => a + c.studentTotal, 0);
    return { avgStudent, avgInstr, withStudent: withStudent.length, withInstr: withInstr.length, withBoth: withBoth.length, total: courseList.length, totalParticipation, totalStudents };
  }, [courseList]);

  // Side-by-side comparison
  const comparison = useMemo(() => {
    return COMPARISON_MAP.map(cat => {
      const instrScores = courseList.filter(c => c.hasInstrReport).map(c => avgFromKeys(c.ratingsMap, cat.instrKeys)).filter(v => v !== null);
      const studentScores = courseList.filter(c => c.hasStudentFeedback).map(c => avgFromIdx(c.studentAverages, cat.studentIdx)).filter(v => v !== null);
      const instrAvg = instrScores.length > 0 ? instrScores.reduce((a, b) => a + b, 0) / instrScores.length : null;
      const studentAvg = studentScores.length > 0 ? studentScores.reduce((a, b) => a + b, 0) / studentScores.length : null;
      const gap = instrAvg !== null && studentAvg !== null ? studentAvg - instrAvg : null;
      return { ...cat, instrAvg, studentAvg, gap };
    });
  }, [courseList]);

  // Instructor suggestions grouped
  const groupedSuggestions = useMemo(() => {
    const groups = { syllabus: [], teaching: [], resources: [], assessment: [] };
    reports.forEach(r => {
      const label = `${r.classInstance?.course?.courseCode || ''} - ${r.classInstance?.course?.courseName || ''}`;
      const teacher = r.teacher?.name || 'Unknown';
      ['syllabus', 'teaching', 'resources', 'assessment'].forEach(key => {
        if (r.suggestions?.[key]?.trim()) groups[key].push({ course: label, teacher, text: r.suggestions[key] });
      });
    });
    return groups;
  }, [reports]);

  // Drill-down: navigate to InstructorExperienceReport
  if (drillDownInstance) {
    return (
      <div className="space-y-4">
        <button onClick={() => setDrillDownInstance(null)} className="text-sm text-gray-600 dark:text-gray-400 hover:text-ruet-blue dark:hover:text-white font-medium">&larr; Back to Feedback Analytics</button>
        <InstructorExperienceReport classInstance={drillDownInstance} onBack={() => setDrillDownInstance(null)} readOnly />
      </div>
    );
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-ruet-blue" size={28} /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Feedback Analytics</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Unified view of student feedback and instructor self-assessment across all department courses.</p>
      </div>
      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded text-sm">{error}</div>}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center space-x-3 text-blue-600 dark:text-blue-400 mb-2"><MessageSquare size={20} /><span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Student Satisfaction</span></div>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats.avgStudent > 0 ? stats.avgStudent.toFixed(1) : '—'} <span className="text-sm font-normal text-gray-500">/ 5</span></p>
          <p className="text-xs text-gray-500 mt-1">{stats.totalParticipation} responses from {stats.totalStudents} students</p>
        </div>
        <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center space-x-3 text-amber-500 dark:text-amber-400 mb-2"><Star size={20} /><span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Instructor Self-Rating</span></div>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats.avgInstr > 0 ? stats.avgInstr.toFixed(1) : '—'} <span className="text-sm font-normal text-gray-500">/ 5</span></p>
          <p className="text-xs text-gray-500 mt-1">{stats.withInstr} reports submitted</p>
        </div>
        <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center space-x-3 text-green-600 dark:text-green-400 mb-2"><Users size={20} /><span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Feedback Coverage</span></div>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats.withBoth} <span className="text-sm font-normal text-gray-500">/ {stats.total}</span></p>
          <p className="text-xs text-gray-500 mt-1">courses with both student & instructor data</p>
        </div>
        <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center space-x-3 text-purple-600 dark:text-purple-400 mb-2"><BarChart3 size={20} /><span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Total Courses</span></div>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-1">{stats.withStudent} with student feedback</p>
        </div>
      </div>

      {/* Side-by-Side Comparison */}
      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Student vs. Instructor Perception</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Comparing instructor self-assessment with student feedback across thematic categories.</p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Category</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-44">Instructor (Avg)</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-44">Student (Avg)</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-24">Gap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {comparison.map(cat => (
                <tr key={cat.label} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{cat.label}</td>
                  <td className="px-4 py-3"><RatingBar value={cat.instrAvg || 0} color="bg-amber-500" /></td>
                  <td className="px-4 py-3"><RatingBar value={cat.studentAvg || 0} color="bg-blue-500" /></td>
                  <td className="px-4 py-3 text-center"><GapBadge gap={cat.gap} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-Course Feedback Table */}
      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg border border-gray-100 dark:border-gray-800">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Per-Course Feedback</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click a course to expand details. Click "View Report" to open the full instructor evaluation report.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-8"></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Course</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Instructor</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Student Avg</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Instructor Avg</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Participation</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {courseList.length === 0 ? (
                <tr><td colSpan="7" className="px-4 py-8 text-center text-sm text-gray-500">No course data available.</td></tr>
              ) : courseList.map(course => {
                const isExpanded = expandedRow === course.classInstanceId;
                return (
                  <React.Fragment key={course.classInstanceId}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer" onClick={() => setExpandedRow(isExpanded ? null : course.classInstanceId)}>
                      <td className="px-4 py-3">{isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-ruet-blue dark:text-blue-400">{course.courseCode}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{course.courseName} (Sec {course.section}, {course.series})</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{course.teachers.map(t => t.name).join(', ') || '—'}</td>
                      <td className="px-4 py-3 text-center"><span className={`text-sm font-bold ${course.studentAvg >= 3.5 ? 'text-green-600 dark:text-green-400' : course.studentAvg > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>{course.studentAvg ? course.studentAvg.toFixed(1) : '—'}</span></td>
                      <td className="px-4 py-3 text-center"><span className={`text-sm font-bold ${course.instrOverall >= 3.5 ? 'text-green-600 dark:text-green-400' : course.instrOverall ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>{course.instrOverall ? course.instrOverall.toFixed(1) : '—'}</span></td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">{course.studentParticipation}/{course.studentTotal}</td>
                      <td className="px-4 py-3 text-center">
                        {course.hasInstrReport ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-bold">✓ Submitted</span> : <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500 font-bold">⏳ Pending</span>}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan="7" className="px-6 py-5 bg-gray-50 dark:bg-[#2d2d2d]">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Student feedback breakdown */}
                            <div>
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><MessageSquare size={14} className="text-blue-500" /> Student Feedback ({course.studentParticipation} responses)</h4>
                              {course.hasStudentFeedback ? (
                                <div className="space-y-2">
                                  {questions.map((q, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                      <span className="text-xs text-gray-600 dark:text-gray-400 w-32 flex-shrink-0 truncate" title={q}>{STUDENT_QUESTIONS_SHORT[i] || q}</span>
                                      <RatingBar value={course.studentAverages[i] || 0} color="bg-blue-500" />
                                    </div>
                                  ))}
                                  {course.studentSuggestions.length > 0 && (
                                    <details className="mt-3">
                                      <summary className="text-xs text-ruet-blue dark:text-blue-400 cursor-pointer font-medium">Show {course.studentSuggestions.length} student suggestion(s)</summary>
                                      <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                                        {course.studentSuggestions.map((s, i) => <p key={i} className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-[#1e1e1e] p-2 rounded border border-gray-200 dark:border-gray-700">{s}</p>)}
                                      </div>
                                    </details>
                                  )}
                                </div>
                              ) : <p className="text-sm text-gray-400 italic">No student feedback yet.</p>}
                            </div>
                            {/* Instructor self-assessment breakdown */}
                            <div>
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Star size={14} className="text-amber-500" /> Instructor Self-Assessment</h4>
                              {course.hasInstrReport ? (
                                <div className="space-y-2">
                                  {ATTRIBUTE_GROUPS.map(group => (
                                    <div key={group.label} className="flex items-center gap-3">
                                      <span className="text-xs text-gray-600 dark:text-gray-400 w-32 flex-shrink-0 truncate">{group.label}</span>
                                      <RatingBar value={avgFromKeys(course.ratingsMap, group.keys.filter(k => k !== 'K')) || 0} color="bg-amber-500" />
                                    </div>
                                  ))}
                                  {course.classInstance && (
                                    <button onClick={(e) => { e.stopPropagation(); setDrillDownInstance(course.classInstance); }} className="mt-3 flex items-center gap-1.5 text-xs text-ruet-blue dark:text-blue-400 hover:underline font-semibold">
                                      <Eye size={14} /> View Full Evaluation Report
                                    </button>
                                  )}
                                </div>
                              ) : <p className="text-sm text-gray-400 italic">Instructor report not submitted yet.</p>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructor Suggestions Panel */}
      {reports.length > 0 && (
        <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Instructor Improvement Suggestions</h3>
          <div className="flex gap-2 mb-4 flex-wrap">
            {[
              { key: 'syllabus', label: 'Syllabus & Content' },
              { key: 'teaching', label: 'Teaching' },
              { key: 'resources', label: 'Resources' },
              { key: 'assessment', label: 'Assessment' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setSuggestionTab(tab.key)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${suggestionTab === tab.key ? 'bg-ruet-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                {tab.label} ({groupedSuggestions[tab.key].length})
              </button>
            ))}
          </div>
          <SuggestionTab suggestions={groupedSuggestions[suggestionTab]} label={suggestionTab} />
        </div>
      )}
    </div>
  );
};

export default CourseReviewHub;
