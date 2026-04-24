import React, { useState, useMemo, useEffect } from 'react';
import { FileText, Download, Loader2, Save, CheckCircle, AlertCircle, Star } from 'lucide-react';
import { useGetInstructorReportQuery, useSaveInstructorReportMutation } from '../../store/slices/instructorReportSlice';
import { useGetClassEvaluationQuery } from '../../store/slices/classInstanceSlice';
import { useAuth } from '../../contexts/AuthContext';
import {
  ATTRIBUTE_LABELS,
  ATTRIBUTE_GROUPS,
  CO_BUCKETS,
  calculateCoDistribution,
  exportTeacherReportPDF,
} from '../../utils/teacherReportExportUtils';

const getSectionLabel = (instance) => (instance?.section === 'N/A' ? 'No Section' : `Section ${instance?.section}`);

const InstructorExperienceReport = ({ classInstance, onBack, readOnly = false }) => {
  const { currentUser } = useAuth();
  const classInstanceId = classInstance?._id;

  // ---- Fetch existing report ----
  const { data: existingReport, isLoading: loadingReport } = useGetInstructorReportQuery(classInstanceId, {
    skip: !classInstanceId,
  });

  // ---- Fetch OBE evaluation data ----
  const { data: evaluation, isLoading: loadingEval } = useGetClassEvaluationQuery(classInstanceId, {
    skip: !classInstanceId,
  });

  const [saveReport, { isLoading: saving }] = useSaveInstructorReportMutation();

  // ---- Local form state ----
  const [ratings, setRatings] = useState({});
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [suggestions, setSuggestions] = useState({
    syllabus: '',
    teaching: '',
    resources: '',
    assessment: '',
  });
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null

  // ---- Pre-fill from existing report ----
  useEffect(() => {
    if (existingReport) {
      const ratingsMap = {};
      (existingReport.ratings || []).forEach((r) => {
        ratingsMap[r.attribute] = r.score;
      });
      setRatings(ratingsMap);
      setSuggestions({
        syllabus: existingReport.suggestions?.syllabus || '',
        teaching: existingReport.suggestions?.teaching || '',
        resources: existingReport.suggestions?.resources || '',
        assessment: existingReport.suggestions?.assessment || '',
      });
      if (existingReport.courseOutcomes?.length > 0) {
        setCourseOutcomes(existingReport.courseOutcomes);
      }
    }
  }, [existingReport]);

  // ---- Derive COs from coPoMapping (single source of truth) ----
  useEffect(() => {
    // Primary source: coPoMapping from ClassInstance (set in ManageCOs)
    if (classInstance?.coPoMapping?.length > 0) {
      const derived = classInstance.coPoMapping.map((m) => ({
        code: m.co,
        description: m.description || '',
      }));
      setCourseOutcomes(derived);
      return;
    }
    // Fallback: derive from evaluation data if no coPoMapping
    if (evaluation?.obeData?.coAttainment) {
      const coKeys = Object.keys(evaluation.obeData.coAttainment).sort();
      if (coKeys.length > 0) {
        setCourseOutcomes(coKeys.map((co) => ({ code: co, description: '' })));
      }
    }
  }, [classInstance, evaluation]);

  // ---- OBE Data ----
  const obeData = useMemo(() => {
    if (!evaluation?.obeData) return { poAttainment: {}, coAttainment: {}, studentAttainment: [] };
    return evaluation.obeData;
  }, [evaluation]);

  const coKeys = useMemo(() => Object.keys(obeData.coAttainment || {}).sort(), [obeData]);

  const coDistribution = useMemo(
    () => calculateCoDistribution(obeData.studentAttainment, coKeys),
    [obeData.studentAttainment, coKeys]
  );

  // ---- Aggregated summary ----
  const aggregatedSummary = useMemo(() => {
    return ATTRIBUTE_GROUPS.map((group) => {
      const scores = group.keys
        .map((k) => ratings[k])
        .filter((v) => v != null && typeof v === 'number');
      const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length) : null;
      return { ...group, average: avg };
    });
  }, [ratings]);

  // ---- Handlers ----
  const handleRatingChange = (attribute, score) => {
    setRatings((prev) => ({ ...prev, [attribute]: score }));
    setSaveStatus(null);
  };

  const handleCoDescChange = (index, description) => {
    setCourseOutcomes((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], description };
      return updated;
    });
    setSaveStatus(null);
  };

  const handleSuggestionChange = (key, value) => {
    setSuggestions((prev) => ({ ...prev, [key]: value }));
    setSaveStatus(null);
  };

  const handleSave = async () => {
    try {
      const ratingsArray = Object.entries(ratings)
        .filter(([, score]) => score != null)
        .map(([attribute, score]) => ({ attribute, score }));

      await saveReport({
        classInstance: classInstanceId,
        ratings: ratingsArray,
        courseOutcomes,
        suggestions,
      }).unwrap();
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus('error');
    }
  };

  const handleExportPDF = () => {
    const teacher = existingReport?.teacher || currentUser;
    exportTeacherReportPDF({
      classInstance,
      teacher,
      ratings: Object.entries(ratings)
        .filter(([, s]) => s != null)
        .map(([attribute, score]) => ({ attribute, score })),
      courseOutcomes,
      suggestions,
      obeData,
    });
  };

  // ---- Loading state ----
  const isLoading = loadingReport || loadingEval;
  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-ruet-blue" size={28} />
      </div>
    );
  }

  // ---- Derive the assigned teacher (not the logged-in user) for display ----
  const assignedTeachers = classInstance?.teachers?.length > 0 ? classInstance.teachers : (classInstance?.teacher ? [classInstance.teacher] : []);
  const primaryTeacher = existingReport?.teacher || assignedTeachers[0] || null;
  const instructorDisplay = readOnly ? primaryTeacher : currentUser;
  const course = classInstance?.course;
  const hasSubmittedReport = Boolean(existingReport);

  // ---- Admin read-only: if teacher hasn't submitted yet, show a clear message ----
  if (readOnly && !hasSubmittedReport) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">OBE Course Evaluation Report</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {course?.courseCode} — {course?.courseName} ({getSectionLabel(classInstance)}, {classInstance?.series || 'N/A'} Series)
              </p>
            </div>
            {onBack && (
              <button onClick={onBack} className="text-sm text-gray-600 dark:text-gray-400 hover:text-ruet-blue dark:hover:text-white font-medium">
                &larr; Back
              </button>
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg border border-gray-100 dark:border-gray-800">
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#2d2d2d] px-6 py-16 text-center m-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <FileText size={28} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Report Not Submitted</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
              The assigned instructor ({primaryTeacher?.name || 'N/A'}) has not yet submitted the OBE Course Evaluation Report for this class.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ======= Header ======= */}
      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">OBE Course Evaluation Report</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {course?.courseCode} — {course?.courseName} ({getSectionLabel(classInstance)}, {classInstance?.series || 'N/A'} Series)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center px-4 py-2 bg-ruet-blue text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Download size={16} className="mr-2" />
              Export PDF
            </button>
            {onBack && (
              <button onClick={onBack} className="text-sm text-gray-600 dark:text-gray-400 hover:text-ruet-blue dark:hover:text-white font-medium">
                &larr; Back
              </button>
            )}
          </div>
        </div>
        {readOnly && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
            You are viewing this report in read-only mode. Only the assigned instructor can edit ratings and suggestions.
          </p>
        )}
      </div>

      {/* ======= Section A: Course Summary (read-only) ======= */}
      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText size={18} className="text-ruet-blue dark:text-blue-400" />
          Section A: Course Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div><span className="font-semibold text-gray-700 dark:text-gray-300">Program:</span> <span className="text-gray-600 dark:text-gray-400">B.Sc. in {course?.department?.name || 'Engineering'}</span></div>
          <div><span className="font-semibold text-gray-700 dark:text-gray-300">Course Title:</span> <span className="text-gray-600 dark:text-gray-400">{course?.courseName || 'N/A'}</span></div>
          <div><span className="font-semibold text-gray-700 dark:text-gray-300">Course Code:</span> <span className="text-gray-600 dark:text-gray-400">{course?.courseCode || 'N/A'}</span></div>
          <div><span className="font-semibold text-gray-700 dark:text-gray-300">Instructor:</span> <span className="text-gray-600 dark:text-gray-400">{instructorDisplay?.name || 'N/A'}{instructorDisplay?.designation ? `, ${instructorDisplay.designation}` : ''}</span></div>
          <div className="md:col-span-2">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Examination:</span>{' '}
            <span className="text-gray-600 dark:text-gray-400">
              {classInstance?.series ? `Series ${classInstance.series}` : ''} — {new Date().getFullYear()}
            </span>
          </div>
        </div>
      </div>

      {/* ======= Section B: Course Outcomes ======= */}
      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Section B: Course Outcomes (COs)</h3>
        {!readOnly && <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Describe each Course Outcome. These will appear in the exported PDF report.</p>}
        <div className="space-y-3">
          {courseOutcomes.map((co, idx) => (
            <div key={co.code} className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-bold rounded min-w-[44px] text-center mt-1">
                {co.code}
              </span>
              {readOnly ? (
                <p className="flex-1 text-sm text-gray-700 dark:text-gray-300 pt-1">{co.description || <span className="italic text-gray-400 dark:text-gray-500">No description provided.</span>}</p>
              ) : (
                <textarea
                  value={co.description}
                  onChange={(e) => handleCoDescChange(idx, e.target.value)}
                  placeholder={`Describe ${co.code}...`}
                  rows={2}
                  className="flex-1 p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-[#2d2d2d] text-gray-900 dark:text-gray-200 outline-none resize-none focus:ring-2 focus:ring-ruet-blue/30 focus:border-ruet-blue"
                />
              )}
            </div>
          ))}
          {courseOutcomes.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">No COs found. Ensure CO-PO mapping is configured for this course.</p>
          )}
        </div>
      </div>

      {/* ======= Section E: Instructor Self-Assessment (A-K) ======= */}
      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Section E: Instructor Feedback (Attributes A–K)</h3>
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-16">Attr</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-44">Rating (1–5)</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
              {Object.entries(ATTRIBUTE_LABELS).map(([key, desc]) => (
                <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-sm font-bold text-ruet-blue dark:text-blue-400">{key}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{desc}</td>
                  <td className="px-4 py-3">
                    {key === 'K' ? (
                      <span className="text-sm text-gray-500 dark:text-gray-400 text-center block">
                        {(suggestions.syllabus || suggestions.teaching || suggestions.resources || suggestions.assessment) ? (
                          <span className="text-green-600 dark:text-green-400 font-semibold">Yes</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </span>
                    ) : (
                      <div className="flex justify-center gap-1">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <button
                            key={score}
                            onClick={() => !readOnly && handleRatingChange(key, score)}
                            disabled={readOnly}
                            className={`w-8 h-8 rounded-full text-xs font-bold transition-all border-2 flex items-center justify-center ${
                              ratings[key] === score
                                ? 'bg-ruet-blue border-ruet-blue text-white dark:bg-blue-500 dark:border-blue-500 scale-110 shadow-md'
                                : readOnly
                                  ? 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-default'
                                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-ruet-blue/50 hover:text-ruet-blue dark:hover:border-blue-400/50 dark:hover:text-blue-400'
                            }`}
                            title={readOnly ? `Rated ${score}` : `Rate ${score}`}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======= Aggregated Summary ======= */}
      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Instructor Feedback Summary (Aggregated)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {aggregatedSummary.map((group) => (
            <div
              key={group.label}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#2d2d2d] flex flex-col items-center text-center"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium mb-1">{group.label}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">({group.keys.join(', ')})</p>
              <div className="flex items-center gap-1">
                <Star size={18} className={group.average != null ? 'text-amber-500' : 'text-gray-300 dark:text-gray-600'} />
                <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  {group.average != null ? group.average.toFixed(1) : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ======= Improvement Plan ======= */}
      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Section E: Improvement Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'syllabus', label: 'Syllabus & Course Content', placeholder: 'Reflect on course content structure, relevance, and alignment with learning outcomes...' },
            { key: 'teaching', label: 'Teaching Learning', placeholder: 'Reflect on engagement strategies, active learning methods, and areas for pedagogical improvement...' },
            { key: 'resources', label: 'Resources', placeholder: 'Comment on the adequacy of teaching-learning facilities and resources...' },
            { key: 'assessment', label: 'Assessment', placeholder: 'Reflect on evaluation methods, fairness, and alignment with OBE standards...' },
          ].map((item) => (
            <div key={item.key}>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{item.label}</label>
              {readOnly ? (
                <p className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-[#2d2d2d] border border-gray-200 dark:border-gray-700 rounded-lg min-h-[60px]">
                  {suggestions[item.key] || <span className="italic text-gray-400 dark:text-gray-500">No comments provided.</span>}
                </p>
              ) : (
                <textarea
                  value={suggestions[item.key]}
                  onChange={(e) => handleSuggestionChange(item.key, e.target.value)}
                  placeholder={item.placeholder}
                  rows={4}
                  className="w-full p-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-[#2d2d2d] text-gray-900 dark:text-gray-200 outline-none resize-none focus:ring-2 focus:ring-ruet-blue/30 focus:border-ruet-blue"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ======= CO Attainment Distribution (Web UI) ======= */}
      {coKeys.length > 0 && obeData.studentAttainment?.length > 0 && (
        <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">CO Attainment Distribution</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Number of students in each grade band per Course Outcome, derived from OBE attainment data.
          </p>
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Grade Band</th>
                  {coKeys.map((co) => (
                    <th key={co} className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{co}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
                {CO_BUCKETS.map((bucket, bIdx) => (
                  <tr key={bucket.label} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">{bucket.label}</td>
                    {coKeys.map((co) => {
                      const count = coDistribution[co]?.[bIdx] ?? 0;
                      const total = obeData.studentAttainment.length;
                      const pct = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
                      return (
                        <td key={co} className="px-4 py-3 text-center">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">{count}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">({pct}%)</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======= Class CO/PO Attainment Summary ======= */}
      {(coKeys.length > 0 || Object.keys(obeData.poAttainment || {}).length > 0) && (
        <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Class CO/PO Attainment Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {coKeys.map((co) => {
              const d = obeData.coAttainment[co];
              return (
                <div key={co} className={`p-4 rounded-lg border ${d.achieved ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                  <h4 className="font-bold text-gray-900 dark:text-white flex justify-between items-center text-sm">
                    <span>{co}</span>
                    {d.achieved
                      ? <span className="text-[10px] text-green-600 dark:text-green-400 font-bold bg-green-100 dark:bg-green-900/40 rounded px-1.5 py-0.5 uppercase">Met</span>
                      : <span className="text-[10px] text-red-600 dark:text-red-400 font-bold bg-red-100 dark:bg-red-900/40 rounded px-1.5 py-0.5 uppercase">Failed</span>
                    }
                  </h4>
                  <div className="mt-2 flex items-baseline space-x-2">
                    <span className={`text-2xl font-extrabold ${d.achieved ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{d.percentage}%</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold">Pass Rate</span>
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Threshold: {d.kpi}%</p>
                </div>
              );
            })}
            {Object.entries(obeData.poAttainment || {}).sort(([a], [b]) => a.localeCompare(b)).map(([po, d]) => (
              <div key={po} className={`p-4 rounded-lg border ${d.achieved ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                <h4 className="font-bold text-gray-900 dark:text-white flex justify-between items-center text-sm">
                  <span>{po}</span>
                  {d.achieved
                    ? <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-100 dark:bg-blue-900/40 rounded px-1.5 py-0.5 uppercase">Met</span>
                    : <span className="text-[10px] text-red-600 dark:text-red-400 font-bold bg-red-100 dark:bg-red-900/40 rounded px-1.5 py-0.5 uppercase">Failed</span>
                  }
                </h4>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className={`text-2xl font-extrabold ${d.achieved ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400'}`}>{d.percentage}%</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold">Pass Rate</span>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Threshold: {d.kpi}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======= Save Bar ======= */}
      <div className="sticky bottom-0 z-10 bg-white dark:bg-[#1e1e1e] shadow-[0_-2px_10px_rgba(0,0,0,0.08)] rounded-lg p-4 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {saveStatus === 'success' && (
            <span className="flex items-center text-sm text-green-600 dark:text-green-400 font-medium animate-fade-in">
              <CheckCircle size={16} className="mr-1.5" /> Report saved successfully
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center text-sm text-red-600 dark:text-red-400 font-medium">
              <AlertCircle size={16} className="mr-1.5" /> Failed to save. Please try again.
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
          >
            <Download size={16} className="mr-2" />
            Export PDF
          </button>
          {!readOnly && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center px-5 py-2 bg-ruet-blue text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
              {saving ? 'Saving...' : 'Save Report'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorExperienceReport;
