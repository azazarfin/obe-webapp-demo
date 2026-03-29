import React, { useEffect, useMemo, useState } from 'react';
import { Save, AlertCircle, X, Loader2 } from 'lucide-react';
import { useGetClassSummaryQuery, useUpdateClassInstanceMutation } from '../../store/slices/classInstanceSlice';
import { useCreateAssessmentMutation, useSaveMarksMutation } from '../../store/slices/assessmentSlice';

const STANDARD_TYPES = ['Quiz', 'Performance/Report', 'Viva', 'Lab Final'];
const PO_OPTIONS = Array.from({ length: 12 }, (_, index) => `PO${index + 1}`);

const mapAssessmentType = (type) => {
  if (type === 'Quiz') return 'Quiz';
  if (type === 'Performance/Report') return 'Report';
  if (type === 'Viva') return 'Viva';
  if (type === 'Lab Final') return 'LabFinal';
  return 'Custom';
};

const getNextCONumber = (coList) => {
  const numbers = coList
    .map((co) => parseInt(co.replace(/^CO/i, ''), 10))
    .filter((n) => !Number.isNaN(n));
  return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
};

const INITIAL_FORM_DATA = {
  assessmentType: '',
  customType: '',
  co: 'CO1',
  po: 'PO1',
  title: '',
  date: '',
  totalMarks: ''
};

const persistCO = async (classInstance, summary, co, defaultPO, updateClassInstance) => {
  const nextMapping = summary?.classInstance?.coPoMapping
    ? [...summary.classInstance.coPoMapping]
    : [];
  const existing = nextMapping.find((entry) => entry.co === co);
  if (!existing) {
    nextMapping.push({ co, po: [defaultPO] });
    await updateClassInstance({ id: classInstance._id, coPoMapping: nextMapping }).unwrap();
  }
};

const ensureMapping = async (classInstance, summary, co, po, updateClassInstance) => {
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

  await updateClassInstance({ id: classInstance._id, coPoMapping: nextMapping }).unwrap();
};

const AddSessionalAssessment = ({ classInstance }) => {
  const { data: summary, isLoading: loading, error: fetchError } = useGetClassSummaryQuery(classInstance?._id, {
    skip: !classInstance?._id
  });

  const [updateClassInstance] = useUpdateClassInstanceMutation();
  const [createAssessment] = useCreateAssessmentMutation();
  const [saveMarksMutation] = useSaveMarksMutation();
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [marksData, setMarksData] = useState({});
  const [showGrid, setShowGrid] = useState(false);
  const [showAddCO, setShowAddCO] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (fetchError) {
      setError(fetchError?.data?.error || fetchError?.message || 'Failed to fetch summary');
    } else {
      setError('');
    }
  }, [fetchError]);

  useEffect(() => {
    const mappingCOs = (summary?.classInstance?.coPoMapping || []).map((entry) => entry.co);
    const nextCO = mappingCOs[0] || 'CO1';

    setFormData((prev) => {
      if (prev.co && (mappingCOs.length === 0 || mappingCOs.includes(prev.co))) {
        return prev;
      }

      return { ...prev, co: nextCO };
    });
  }, [summary]);

  const students = useMemo(() => (summary?.roster || [])
    .filter((student) => student.status !== 'hidden')
    .sort((a, b) => (a.rollNumber || '').localeCompare(b.rollNumber || '', undefined, { numeric: true, sensitivity: 'base' })), [summary]);
  const coOptions = useMemo(() => {
    const mappingCOs = (summary?.classInstance?.coPoMapping || []).map((entry) => entry.co);
    return mappingCOs.length > 0 ? mappingCOs : ['CO1'];
  }, [summary]);

  const isCustomType = formData.assessmentType === '__custom__';
  const resolvedType = isCustomType ? formData.customType : formData.assessmentType;

  const handleAddCO = async () => {
    const nextNum = getNextCONumber(coOptions);
    const newCO = `CO${nextNum}`;

    try {
      setError('');
      await persistCO(classInstance, summary, newCO, 'PO1', updateClassInstance);
      setFormData((prev) => ({ ...prev, co: newCO }));
      setShowAddCO(false);
    } catch (err) {
      setError(err?.data?.error || err.message || 'Failed to add CO');
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!resolvedType || students.length === 0) return;
    setShowGrid(true);
    setSuccess('');
  };

  const handleCellChange = (studentId, value) => {
    const upperVal = value.toUpperCase();
    if (upperVal !== '' && upperVal !== 'A' && Number.isNaN(Number(upperVal))) return;

    const total = parseFloat(formData.totalMarks) || 0;
    if (upperVal !== 'A' && upperVal !== '' && parseFloat(upperVal) > total) return;

    setMarksData((prev) => ({
      ...prev,
      [studentId]: upperVal
    }));
  };

  const handleSave = async () => {
    if (!classInstance?._id) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await ensureMapping(classInstance, summary, formData.co, formData.po, updateClassInstance);

      const assessment = await createAssessment({
        classInstance: classInstance._id,
        type: isCustomType ? 'Custom' : mapAssessmentType(formData.assessmentType),
        typeLabel: isCustomType ? formData.customType : formData.assessmentType,
        mappedCO: formData.co,
        mappedPOs: [formData.po],
        title: formData.title,
        assessmentDate: formData.date,
        totalMarks: parseFloat(formData.totalMarks)
      }).unwrap();

      await saveMarksMutation({
        assessmentId: assessment._id,
        classInstanceId: classInstance._id,
        marks: students.map((student) => ({
          studentId: student.studentId,
          rawScore: marksData[student.studentId] === 'A' || !marksData[student.studentId] ? 0 : Number(marksData[student.studentId])
        }))
      }).unwrap();

      setSuccess('Sessional assessment saved successfully.');
      setShowGrid(false);
      setMarksData({});
      setFormData({
        ...INITIAL_FORM_DATA,
        co: coOptions[0] || 'CO1'
      });
    } catch (err) {
      setError(err?.data?.error || err.message || 'Error saving assessment');
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

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded text-sm">{error}</div>}
      {success && <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded text-sm">{success}</div>}

      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Sessional Assessment</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{classInstance.course?.courseCode} - {classInstance.course?.courseName} (Section {classInstance.section}, {classInstance.series} Series)</p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Assessment Type</label>
              <select required value={formData.assessmentType} onChange={(e) => setFormData({ ...formData, assessmentType: e.target.value, customType: '' })} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue">
                <option value="" className="dark:bg-gray-800">-- Select Type --</option>
                {STANDARD_TYPES.map((type) => <option key={type} value={type} className="dark:bg-gray-800">{type}</option>)}
                <option value="__custom__" className="dark:bg-gray-800">Other (Custom...)</option>
              </select>
            </div>

            {isCustomType && (
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Custom Type Name</label>
                <input type="text" required placeholder="e.g. Group Presentation" value={formData.customType} onChange={(e) => setFormData({ ...formData, customType: e.target.value })} className="w-full p-2.5 border border-orange-300 dark:border-orange-600 rounded-md bg-orange-50 dark:bg-orange-900/10 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">CO (Course Outcome)</label>
              <select required value={formData.co} onChange={(e) => {
                if (e.target.value === '__add_co__') {
                  setShowAddCO(true);
                  return;
                }
                setFormData({ ...formData, co: e.target.value });
              }} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue">
                {coOptions.map((co) => <option key={co} value={co} className="dark:bg-gray-800">{co}</option>)}
                <option value="__add_co__" className="dark:bg-gray-800 text-green-600">+ Add New CO</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">PO (Program Outcome)</label>
              <select required value={formData.po} onChange={(e) => setFormData({ ...formData, po: e.target.value })} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue">
                {PO_OPTIONS.map((po) => <option key={po} value={po} className="dark:bg-gray-800">{po}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Title</label>
              <input type="text" required placeholder="e.g. Lab Quiz 1" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Date</label>
              <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Total Marks</label>
              <input type="number" min="1" required placeholder="e.g. 20" value={formData.totalMarks} onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue" />
            </div>
          </div>

          {!showGrid && (
            <button type="submit" disabled={students.length === 0} className="px-5 py-2.5 bg-ruet-blue text-white rounded-md hover:bg-ruet-dark font-medium transition-colors disabled:opacity-60">
              Proceed to Marks Entry
            </button>
          )}
        </form>
      </div>

      {showAddCO && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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

      {showGrid && (
        <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Marks Entry - {resolvedType}: {formData.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{formData.co} -&gt; {formData.po} | Total: {formData.totalMarks} marks | Date: {formData.date}</p>
              {classInstance.teachers?.length > 1 && (
                <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5 font-medium">Created by you (recorded automatically)</p>
              )}
            </div>
            <button onClick={handleSave} disabled={saving} className="flex items-center px-4 py-2 bg-ruet-blue text-white rounded-md text-sm font-medium hover:bg-ruet-dark transition-colors disabled:opacity-60">
              {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />} Save Assessment
            </button>
          </div>

          <div className="flex items-center p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-xs font-medium mb-4">
            <AlertCircle size={14} className="mr-2 flex-shrink-0" /> Type <strong className="font-mono mx-1">A</strong> to mark absent. Empty cells will also be treated as absent (0 marks).
          </div>

          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-16">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Roll</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-32">Marks (/{formData.totalMarks})</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-24">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
                {students.map((student, index) => {
                  const value = marksData[student.studentId] || '';
                  const isAbsent = value === 'A' || value === '';
                  return (
                    <tr key={student.studentId} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${isAbsent ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white font-mono">{student.rollNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{student.name}</td>
                      <td className="px-4 py-3 text-center">
                        <input type="text" placeholder="-" value={value} onChange={(e) => handleCellChange(student.studentId, e.target.value)} className={`w-20 text-center p-1.5 border rounded font-mono text-sm outline-none focus:ring-2 focus:ring-ruet-blue ${isAbsent ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold' : 'border-gray-300 dark:border-gray-600 bg-transparent dark:text-white'}`} />
                      </td>
                      <td className="px-4 py-3 text-center text-xs">
                        {value === 'A' ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded font-semibold">Absent</span>
                        ) : value ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded font-semibold">Entered</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded font-semibold">Absent</span>
                        )}
                      </td>
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

export default AddSessionalAssessment;
