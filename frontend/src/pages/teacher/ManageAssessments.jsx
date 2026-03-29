import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit3,
  Loader2,
  Save,
  Target,
  Trash2,
  X
} from 'lucide-react';
import api from '../../utils/api';

const PO_OPTIONS = Array.from({ length: 12 }, (_, index) => `PO${index + 1}`);

const TYPE_LABELS = {
  CT: 'Class Test',
  Assignment: 'Assignment',
  Presentation: 'Presentation',
  Quiz: 'Quiz',
  Report: 'Performance/Report',
  Viva: 'Viva',
  LabFinal: 'Lab Final',
  Final: 'Semester Final',
  Custom: 'Custom'
};

const TYPE_COLORS = {
  CT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  Assignment: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  Presentation: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  Quiz: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  Report: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  Viva: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  LabFinal: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  Final: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  Custom: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
};

const ManageAssessments = ({ classInstance }) => {
  const [summary, setSummary] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [marksData, setMarksData] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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
      const active = (Array.isArray(enrollmentData) ? enrollmentData : []).filter((e) => e.status !== 'hidden');
      setEnrollments(active);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [classInstance]);

  const assessments = useMemo(() =>
    (summary?.assessments || []).slice().sort((a, b) => {
      if (a.type !== b.type) return (a.type || '').localeCompare(b.type || '');
      return (a.title || '').localeCompare(b.title || '');
    }),
  [summary]);

  const coOptions = useMemo(() => {
    const mappingCOs = (summary?.classInstance?.coPoMapping || []).map((entry) => entry.co);
    return mappingCOs.length > 0 ? mappingCOs : ['CO1'];
  }, [summary]);

  const roster = useMemo(() =>
    enrollments
      .map((e) => ({
        studentId: e.student?._id,
        rollNumber: e.student?.rollNumber || '',
        name: e.student?.name || '',
        marks: e.marks || []
      }))
      .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true, sensitivity: 'base' })),
  [enrollments]);

  const handleExpand = (assessmentId) => {
    if (expandedId === assessmentId) {
      setExpandedId(null);
      setMarksData({});
      return;
    }

    setExpandedId(assessmentId);
    const initialMarks = {};
    roster.forEach((student) => {
      const mark = student.marks.find((m) => (m.assessment?._id || m.assessment) === assessmentId);
      initialMarks[student.studentId] = mark ? String(mark.rawScore) : '';
    });
    setMarksData(initialMarks);
  };

  const handleEditOpen = (assessment) => {
    setEditingId(assessment._id);
    setEditForm({
      title: assessment.title || '',
      mappedCO: assessment.mappedCO || coOptions[0],
      mappedPOs: assessment.mappedPOs?.[0] || 'PO1',
      totalMarks: String(assessment.totalMarks || ''),
      assessmentDate: assessment.assessmentDate ? assessment.assessmentDate.split('T')[0] : ''
    });
  };

  const handleEditSave = async (assessmentId) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        title: editForm.title,
        mappedCO: editForm.mappedCO,
        mappedPOs: [editForm.mappedPOs],
        totalMarks: parseFloat(editForm.totalMarks),
        assessmentDate: editForm.assessmentDate || undefined
      };

      await api.put(`/assessments/${assessmentId}`, payload);
      setEditingId(null);
      await fetchData();
      setSuccess('Assessment updated successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCellChange = (studentId, value, totalMarks) => {
    const upperVal = value.toUpperCase();
    if (upperVal !== '' && upperVal !== 'A' && Number.isNaN(Number(upperVal))) return;
    if (upperVal !== 'A' && upperVal !== '' && parseFloat(upperVal) > totalMarks) return;
    setMarksData((prev) => ({ ...prev, [studentId]: upperVal }));
  };

  const handleMarksSave = async (assessmentId) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await api.put(`/assessments/${assessmentId}/marks`, {
        classInstanceId: classInstance._id,
        marks: roster.map((student) => ({
          studentId: student.studentId,
          rawScore: marksData[student.studentId] === 'A' || !marksData[student.studentId] ? 0 : Number(marksData[student.studentId])
        }))
      });

      await fetchData();
      setSuccess('Marks updated successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (assessmentId) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await api.del(`/assessments/${assessmentId}`);
      setDeleteConfirm(null);
      if (expandedId === assessmentId) setExpandedId(null);
      await fetchData();
      setSuccess('Assessment deleted successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!classInstance) return null;

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-ruet-blue" size={28} /></div>;
  }

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded text-sm">{error}</div>}
      {success && <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded text-sm">{success}</div>}

      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Assessments</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{classInstance.course?.courseCode} - {classInstance.course?.courseName} (Section {classInstance.section}, {classInstance.series} Series)</p>
        </div>

        {assessments.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">No assessments have been created yet.</p>
        ) : (
          <div className="space-y-3">
            {assessments.map((assessment) => {
              const isExpanded = expandedId === assessment._id;
              const isEditing = editingId === assessment._id;
              const typeColor = TYPE_COLORS[assessment.type] || TYPE_COLORS.Custom;
              const typeLabel = assessment.typeLabel || TYPE_LABELS[assessment.type] || assessment.type;

              return (
                <div key={assessment._id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#2d2d2d]">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${typeColor}`}>{typeLabel}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{assessment.title}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          <span className="flex items-center"><Target size={10} className="mr-0.5" />{assessment.mappedCO} → {(assessment.mappedPOs || []).join(', ')}</span>
                          <span>·</span>
                          <span>{assessment.totalMarks} marks</span>
                          {assessment.assessmentDate && (
                            <>
                              <span>·</span>
                              <span className="flex items-center"><Calendar size={10} className="mr-0.5" />{new Date(assessment.assessmentDate).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 ml-3">
                      <button onClick={() => handleEditOpen(assessment)} className="p-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors" title="Edit metadata">
                        <Edit3 size={15} />
                      </button>
                      <button onClick={() => setDeleteConfirm(assessment._id)} className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 transition-colors" title="Delete assessment">
                        <Trash2 size={15} />
                      </button>
                      <button onClick={() => handleExpand(assessment._id)} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors" title="Edit marks">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">Edit Assessment</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">Title</label>
                          <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1e1e1e] text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">CO</label>
                          <select value={editForm.mappedCO} onChange={(e) => setEditForm({ ...editForm, mappedCO: e.target.value })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1e1e1e] text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue">
                            {coOptions.map((co) => <option key={co} value={co} className="dark:bg-gray-800">{co}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">PO</label>
                          <select value={editForm.mappedPOs} onChange={(e) => setEditForm({ ...editForm, mappedPOs: e.target.value })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1e1e1e] text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue">
                            {PO_OPTIONS.map((po) => <option key={po} value={po} className="dark:bg-gray-800">{po}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">Total Marks</label>
                          <input type="number" min="1" value={editForm.totalMarks} onChange={(e) => setEditForm({ ...editForm, totalMarks: e.target.value })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1e1e1e] text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">Date</label>
                          <input type="date" value={editForm.assessmentDate} onChange={(e) => setEditForm({ ...editForm, assessmentDate: e.target.value })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1e1e1e] text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-3">
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-600 dark:text-gray-300">Cancel</button>
                        <button onClick={() => handleEditSave(assessment._id)} disabled={saving} className="px-3 py-1.5 bg-ruet-blue text-white rounded text-sm font-medium hover:bg-ruet-dark disabled:opacity-60">
                          {saving ? <Loader2 size={14} className="animate-spin" /> : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  )}

                  {isExpanded && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Edit Marks ({roster.length} students)</h4>
                        <button onClick={() => handleMarksSave(assessment._id)} disabled={saving} className="flex items-center px-3 py-1.5 bg-ruet-blue text-white rounded text-sm font-medium hover:bg-ruet-dark disabled:opacity-60">
                          {saving ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />} Save Marks
                        </button>
                      </div>

                      <div className="flex items-center p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-amber-700 dark:text-amber-400 text-xs font-medium mb-3">
                        <AlertCircle size={12} className="mr-1.5 flex-shrink-0" /> Type <strong className="font-mono mx-1">A</strong> for absent. Empty cells = absent (0 marks).
                      </div>

                      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg max-h-[400px] overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-[#2d2d2d] sticky top-0 z-10">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-12">#</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Roll</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-28">Marks (/{assessment.totalMarks})</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-20">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
                            {roster.map((student, index) => {
                              const value = marksData[student.studentId] || '';
                              const isAbsent = value === 'A' || value === '';
                              return (
                                <tr key={student.studentId} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${isAbsent ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                                  <td className="px-3 py-2 text-xs text-gray-400 font-mono">{index + 1}</td>
                                  <td className="px-3 py-2 text-sm font-bold text-gray-900 dark:text-white font-mono">{student.rollNumber}</td>
                                  <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">{student.name}</td>
                                  <td className="px-3 py-2 text-center">
                                    <input type="text" placeholder="-" value={value} onChange={(e) => handleCellChange(student.studentId, e.target.value, assessment.totalMarks)} className={`w-16 text-center p-1 border rounded font-mono text-sm outline-none focus:ring-2 focus:ring-ruet-blue ${isAbsent ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold' : 'border-gray-300 dark:border-gray-600 bg-transparent dark:text-white'}`} />
                                  </td>
                                  <td className="px-3 py-2 text-center text-xs">
                                    {value === 'A' ? (
                                      <span className="px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded font-semibold">Absent</span>
                                    ) : value ? (
                                      <span className="px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded font-semibold">Entered</span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded font-semibold">Absent</span>
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
            })}
          </div>
        )}
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-lg shadow-xl w-full max-w-sm p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400">Delete Assessment</h3>
              <button onClick={() => setDeleteConfirm(null)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Are you sure you want to delete this assessment? This will also remove all associated marks from student enrollments.
            </p>
            <p className="text-xs text-red-500 dark:text-red-400 font-semibold mb-4">This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-600 dark:text-gray-300">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 disabled:opacity-60">
                {saving ? <Loader2 size={14} className="animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAssessments;
