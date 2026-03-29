import React, { useEffect, useMemo, useState } from 'react';
import { Save, Plus, X, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../utils/api';

const PO_OPTIONS = Array.from({ length: 12 }, (_, index) => `PO${index + 1}`);

const sortQuestions = (questions) => [...questions].sort((left, right) => {
  if ((left.finalPart || '') !== (right.finalPart || '')) {
    return (left.finalPart || '').localeCompare(right.finalPart || '');
  }
  return String(left.questionNo || left.title || '').localeCompare(String(right.questionNo || right.title || ''));
});

const getNextCONumber = (coList) => {
  const numbers = coList
    .map((co) => parseInt(co.replace(/^CO/i, ''), 10))
    .filter((n) => !Number.isNaN(n));
  return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
};

const persistCO = async (classInstance, summary, co, defaultPO) => {
  const nextMapping = summary?.classInstance?.coPoMapping
    ? [...summary.classInstance.coPoMapping]
    : [];
  const existing = nextMapping.find((entry) => entry.co === co);
  if (!existing) {
    nextMapping.push({ co, po: [defaultPO] });
    await api.put(`/class-instances/${classInstance._id}`, { coPoMapping: nextMapping });
  }
};

const ensureMapping = async (classInstance, summary, co, po) => {
  const existing = (summary?.classInstance?.coPoMapping || []).find((entry) => entry.co === co);
  const nextMapping = summary?.classInstance?.coPoMapping ? [...summary.classInstance.coPoMapping] : [];

  if (!existing) {
    nextMapping.push({ co, po: [po] });
  } else if (!existing.po.includes(po)) {
    const updated = nextMapping.map((entry) => (
      entry.co === co ? { ...entry, po: [...entry.po, po] } : entry
    ));
    nextMapping.splice(0, nextMapping.length, ...updated);
  } else {
    return;
  }

  await api.put(`/class-instances/${classInstance._id}`, { coPoMapping: nextMapping });
};

const SemesterFinalMarking = ({ classInstance }) => {
  const [summary, setSummary] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [showAddForm, setShowAddForm] = useState(null);
  const [showAddCO, setShowAddCO] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ no: '', co: 'CO1', po: 'PO1', totalMarks: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    if (!classInstance?._id) return;

    try {
      setLoading(true);
      setError('');
      const [summaryData, enrollmentData] = await Promise.all([
        api.get(`/class-instances/${classInstance._id}/summary`),
        api.get(`/enrollments?classInstance=${classInstance._id}`)
      ]);
      setSummary(summaryData);
      const activeEnrollments = (Array.isArray(enrollmentData) ? enrollmentData : []).filter((enrollment) => enrollment.status !== 'hidden');
      setEnrollments(activeEnrollments);

      const initialMarks = {};
      activeEnrollments.forEach((enrollment) => {
        const studentId = enrollment.student?._id;
        if (!studentId) return;
        initialMarks[studentId] = {};
        (enrollment.marks || []).forEach((mark) => {
          if (mark.assessment?.type === 'Final') {
            initialMarks[studentId][mark.assessment._id] = String(mark.rawScore);
          }
        });
      });
      setMarksData(initialMarks);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [classInstance]);

  const finalQuestions = useMemo(() => sortQuestions((summary?.assessments || []).filter((assessment) => assessment.type === 'Final')), [summary]);
  const partAQuestions = useMemo(() => finalQuestions.filter((question) => question.finalPart === 'A'), [finalQuestions]);
  const partBQuestions = useMemo(() => finalQuestions.filter((question) => question.finalPart === 'B'), [finalQuestions]);
  const roster = useMemo(() => enrollments
    .map((enrollment) => ({
      studentId: enrollment.student?._id,
      rollNumber: enrollment.student?.rollNumber || '',
      name: enrollment.student?.name || ''
    }))
    .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true, sensitivity: 'base' })), [enrollments]);
  const coOptions = useMemo(() => {
    const mappingCOs = (summary?.classInstance?.coPoMapping || []).map((entry) => entry.co);
    return mappingCOs.length > 0 ? mappingCOs : ['CO1'];
  }, [summary]);

  const handleAddCO = async () => {
    const nextNum = getNextCONumber(coOptions);
    const newCO = `CO${nextNum}`;

    try {
      setError('');
      await persistCO(classInstance, summary, newCO, 'PO1');
      const refreshed = await api.get(`/class-instances/${classInstance._id}/summary`);
      setSummary(refreshed);
      setNewQuestion((prev) => ({ ...prev, co: newCO }));
      setShowAddCO(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddQuestion = async (part) => {
    if (!newQuestion.no || !newQuestion.totalMarks) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await ensureMapping(classInstance, summary, newQuestion.co, newQuestion.po);
      await api.post('/assessments', {
        classInstance: classInstance._id,
        title: `Final ${part}-${newQuestion.no}`,
        type: 'Final',
        typeLabel: 'Semester Final',
        mappedCO: newQuestion.co,
        mappedPOs: [newQuestion.po],
        totalMarks: parseFloat(newQuestion.totalMarks),
        finalPart: part,
        questionNo: newQuestion.no
      });
      const refreshedSummary = await api.get(`/class-instances/${classInstance._id}/summary`);
      setSummary(refreshedSummary);
      setNewQuestion({ no: '', co: coOptions[0] || 'CO1', po: 'PO1', totalMarks: '' });
      setShowAddForm(null);
      setSuccess('Final question added successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveQuestion = async (id) => {
    try {
      setSaving(true);
      setError('');
      await api.del(`/assessments/${id}`);
      const refreshedSummary = await api.get(`/class-instances/${classInstance._id}/summary`);
      setSummary(refreshedSummary);
      setMarksData((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((studentId) => {
          if (next[studentId]?.[id] !== undefined) {
            next[studentId] = { ...next[studentId] };
            delete next[studentId][id];
          }
        });
        return next;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCellChange = (studentId, questionId, value, totalMarks) => {
    const upperVal = value.toUpperCase();
    if (upperVal !== '' && upperVal !== 'A' && Number.isNaN(Number(upperVal))) return;
    if (upperVal !== 'A' && upperVal !== '' && parseFloat(upperVal) > totalMarks) return;
    setMarksData((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [questionId]: upperVal }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await Promise.all(finalQuestions.map((question) => api.put(`/assessments/${question._id}/marks`, {
        classInstanceId: classInstance._id,
        marks: roster.map((student) => {
          const val = marksData[student.studentId]?.[question._id];
          return {
            studentId: student.studentId,
            rawScore: val === 'A' || !val ? 0 : Number(val)
          };
        })
      })));
      setSuccess('Semester final marks saved successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!classInstance) {
    return null;
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-ruet-blue" size={28} /></div>;
  }

  const renderQuestionSection = (part, questions) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Part {part}
          <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">({questions.length} question{questions.length !== 1 ? 's' : ''})</span>
        </h3>
        <button 
          onClick={() => { 
            setShowAddForm(part); 
            setNewQuestion({ no: '', co: coOptions[0] || 'CO1', po: 'PO1', totalMarks: '' }); 
          }} 
          className="flex items-center px-3 py-1.5 bg-ruet-blue text-white rounded-md text-sm font-medium hover:bg-ruet-dark transition-colors"
        >
          <Plus size={16} className="mr-1" /> Add Question
        </button>
      </div>

      {questions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {questions.map((question) => (
            <div key={question._id} className="flex items-center bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm">
              <div className="mr-3">
                <span className="font-bold text-blue-800 dark:text-blue-300">Q{question.questionNo}</span>
                <span className="text-blue-600 dark:text-blue-400 text-xs ml-2">{question.mappedCO} {'->'} {(question.mappedPOs || []).join(', ')} {'\u00b7'} {question.totalMarks}m</span>
              </div>
              <button onClick={() => handleRemoveQuestion(question._id)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded text-sm">{error}</div>}
      {success && <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded text-sm">{success}</div>}

      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Semester Final Marking</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{classInstance.course?.courseCode} - {classInstance.course?.courseName} (Section {classInstance.section}, {classInstance.series} Series)</p>
          </div>
          {finalQuestions.length > 0 && (
            <button onClick={handleSave} disabled={saving} className="flex items-center px-4 py-2 bg-ruet-blue text-white rounded-md text-sm font-medium hover:bg-ruet-dark transition-colors disabled:opacity-60">
              {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />} Save All Marks
            </button>
          )}
        </div>

        <div className="space-y-6">
          {renderQuestionSection('A', partAQuestions)}
          <hr className="border-gray-200 dark:border-gray-700" />
          {renderQuestionSection('B', partBQuestions)}
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-5 border-b border-gray-200 dark:border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add Question - Part {showAddForm}</h3>
              <button onClick={() => setShowAddForm(null)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Question No.</label>
                <input type="text" placeholder="e.g. 1(a)" value={newQuestion.no} onChange={(e) => setNewQuestion({ ...newQuestion, no: e.target.value })} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">CO</label>
                  <select value={newQuestion.co} onChange={(e) => {
                    if (e.target.value === '__add_co__') {
                      setShowAddCO(true);
                      return;
                    }
                    setNewQuestion({ ...newQuestion, co: e.target.value });
                  }} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue">
                    {coOptions.map((co) => <option key={co} value={co} className="dark:bg-gray-800">{co}</option>)}
                    <option value="__add_co__" className="dark:bg-gray-800 text-green-600">+ Add New CO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">PO</label>
                  <select value={newQuestion.po} onChange={(e) => setNewQuestion({ ...newQuestion, po: e.target.value })} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue">
                    {PO_OPTIONS.map((po) => <option key={po} value={po} className="dark:bg-gray-800">{po}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Total Marks</label>
                <input type="number" min="1" placeholder="e.g. 15" value={newQuestion.totalMarks} onChange={(e) => setNewQuestion({ ...newQuestion, totalMarks: e.target.value })} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue" />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                <button onClick={() => setShowAddForm(null)} className="px-4 py-2 border rounded text-gray-600 dark:text-gray-300 dark:border-gray-700">Cancel</button>
                <button onClick={() => handleAddQuestion(showAddForm)} disabled={!newQuestion.no || !newQuestion.totalMarks || saving} className="px-4 py-2 bg-ruet-blue text-white rounded hover:bg-ruet-dark font-medium disabled:opacity-40 disabled:cursor-not-allowed">Add</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddCO && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-lg shadow-xl w-full max-w-sm p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add New CO</h3>
              <button onClick={() => setShowAddCO(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              The next CO will be added as <span className="font-mono font-bold text-ruet-blue dark:text-blue-400">CO{getNextCONumber(coOptions)}</span> and persisted to this class instance.
            </p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowAddCO(false)} className="px-4 py-2 border rounded text-gray-600 dark:text-gray-300 dark:border-gray-700">Cancel</button>
              <button onClick={handleAddCO} className="px-4 py-2 bg-ruet-blue text-white rounded hover:bg-ruet-dark font-medium">Add CO{getNextCONumber(coOptions)}</button>
            </div>
          </div>
        </div>
      )}

      {finalQuestions.length > 0 && (
        <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-xs font-medium mb-4">
            <AlertCircle size={14} className="mr-2 flex-shrink-0" /> Type <strong className="font-mono mx-1">A</strong> to mark absent. Empty cells will also be treated as absent (0 marks).
          </div>

          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
                <tr>
                  <th rowSpan="3" className="sticky left-0 z-20 bg-gray-50 dark:bg-[#2d2d2d] px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase border-r border-b border-gray-200 dark:border-gray-700">ID</th>
                  {partAQuestions.length > 0 && (
                    <th colSpan={partAQuestions.length} className="px-2 py-1.5 text-center text-xs font-bold text-blue-700 dark:text-blue-300 uppercase border-r border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">Part A</th>
                  )}
                  {partBQuestions.length > 0 && (
                    <th colSpan={partBQuestions.length} className="px-2 py-1.5 text-center text-xs font-bold text-purple-700 dark:text-purple-300 uppercase border-r border-b border-gray-200 dark:border-gray-700 bg-purple-50 dark:bg-purple-900/20">Part B</th>
                  )}
                  <th rowSpan="3" className="px-4 py-2 text-center text-xs font-bold text-ruet-blue dark:text-blue-400 uppercase bg-blue-50 dark:bg-ruet-dark/20 border-b border-gray-200 dark:border-gray-700">Total</th>
                </tr>
                <tr>
                  {finalQuestions.map((question) => (
                    <th key={question._id} className="px-3 py-1.5 text-center text-xs font-bold text-gray-700 dark:text-gray-200 border-r border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 whitespace-nowrap">Q{question.questionNo} ({question.totalMarks})</th>
                  ))}
                </tr>
                <tr>
                  {finalQuestions.map((question) => (
                    <th key={question._id} className="px-3 py-1 text-center text-[10px] font-medium text-purple-600 dark:text-purple-400 border-r border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">{question.mappedCO} · {(question.mappedPOs || []).join(', ')}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
                {roster.map((student) => {
                  const total = finalQuestions.reduce((sum, question) => {
                    const value = marksData[student.studentId]?.[question._id];
                    if (value && value !== 'A' && !Number.isNaN(Number(value))) {
                      return sum + parseFloat(value);
                    }
                    return sum;
                  }, 0);

                  return (
                    <tr key={student.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 group">
                      <td className="sticky left-0 z-10 bg-white dark:bg-[#1e1e1e] group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50 px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col">
                          <span className="font-mono">{student.rollNumber}</span>
                          <span className="text-xs text-gray-400 font-normal">{student.name}</span>
                        </div>
                      </td>
                      {finalQuestions.map((question) => (
                        <td key={question._id} className="p-0 border-r border-gray-200 dark:border-gray-700 text-center">
                          <input type="text" placeholder="-" value={marksData[student.studentId]?.[question._id] || ''} onChange={(e) => handleCellChange(student.studentId, question._id, e.target.value, question.totalMarks)} className="w-full h-full min-h-[52px] text-center bg-transparent border-none focus:ring-2 focus:ring-inset focus:ring-ruet-blue dark:text-white outline-none caret-ruet-blue font-mono text-sm" />
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center text-sm font-bold text-ruet-blue dark:text-blue-400 bg-blue-50/30 dark:bg-ruet-dark/10">{total.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SemesterFinalMarking;
