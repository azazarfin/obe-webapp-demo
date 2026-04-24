import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, X, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { useGetClassSummaryQuery, useUpdateClassInstanceMutation } from '../../store/slices/classInstanceSlice';
import { useDeleteAssessmentMutation } from '../../store/slices/assessmentSlice';

const PO_OPTIONS = Array.from({ length: 12 }, (_, index) => `PO${index + 1}`);

const getNextCONumber = (coList) => {
  const numbers = coList
    .map((co) => parseInt(co.replace(/^CO/i, ''), 10))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);

  for (let i = 1; i <= numbers.length; i++) {
    if (numbers[i - 1] !== i) {
      return i;
    }
  }
  return numbers.length > 0 ? numbers[numbers.length - 1] + 1 : 1;
};

const ManageCOs = ({ classInstance }) => {
  const { data: summary, isLoading: loading, error: fetchError } = useGetClassSummaryQuery(classInstance?._id, {
    skip: !classInstance?._id
  });
  const [updateClassInstance] = useUpdateClassInstanceMutation();
  const [deleteAssessment] = useDeleteAssessmentMutation();

  const [editingCO, setEditingCO] = useState(null); // CO code being edited
  const [editPOs, setEditPOs] = useState([]);
  const [editDescription, setEditDescription] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(null); // CO code to delete
  const [deletingAssessmentCount, setDeletingAssessmentCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (fetchError) {
      setError(fetchError?.data?.error || fetchError?.message || 'Failed to fetch data');
    } else {
      setError('');
    }
  }, [fetchError]);

  const coMappings = useMemo(() => {
    const mappings = summary?.classInstance?.coPoMapping || [];
    return [...mappings].sort((a, b) => {
      const numA = parseInt(a.co.replace(/^CO/i, ''), 10) || 0;
      const numB = parseInt(b.co.replace(/^CO/i, ''), 10) || 0;
      return numA - numB;
    });
  }, [summary]);
  const assessments = useMemo(() => summary?.assessments || [], [summary]);

  const getAssessmentCountForCO = (co) => assessments.filter((a) => a.mappedCO === co).length;

  const handleAddCO = async () => {
    const coList = coMappings.map((m) => m.co);
    const nextNum = getNextCONumber(coList);
    const newCO = `CO${nextNum}`;

    try {
      setSaving(true);
      setError('');
      const nextMapping = [...coMappings, { co: newCO, po: ['PO1'], description: '' }].sort((a, b) => {
        const numA = parseInt(a.co.replace(/^CO/i, ''), 10) || 0;
        const numB = parseInt(b.co.replace(/^CO/i, ''), 10) || 0;
        return numA - numB;
      });
      await updateClassInstance({ id: classInstance._id, coPoMapping: nextMapping }).unwrap();
      setSuccess(`${newCO} added successfully.`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.data?.error || err.message || 'Failed to add CO');
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (mapping) => {
    setEditingCO(mapping.co);
    setEditPOs([...mapping.po]);
    setEditDescription(mapping.description || '');
  };

  const handleCancelEdit = () => {
    setEditingCO(null);
    setEditPOs([]);
    setEditDescription('');
  };

  const handleTogglePO = (po) => {
    setEditPOs((prev) => {
      if (prev.includes(po)) {
        if (prev.length <= 1) return prev; // Must have at least one PO
        return prev.filter((p) => p !== po);
      }
      return [...prev, po].sort((a, b) => {
        const numA = parseInt(a.replace('PO', ''), 10);
        const numB = parseInt(b.replace('PO', ''), 10);
        return numA - numB;
      });
    });
  };

  const handleSaveEdit = async () => {
    if (editPOs.length === 0) return;

    try {
      setSaving(true);
      setError('');
      const nextMapping = coMappings.map((m) =>
        m.co === editingCO ? { ...m, po: editPOs, description: editDescription } : m
      );
      await updateClassInstance({ id: classInstance._id, coPoMapping: nextMapping }).unwrap();
      setEditingCO(null);
      setEditPOs([]);
      setEditDescription('');
      setSuccess(`${editingCO} updated successfully.`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.data?.error || err.message || 'Failed to update CO');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestDelete = (co) => {
    const count = getAssessmentCountForCO(co);
    setDeletingAssessmentCount(count);
    setShowDeleteDialog(co);
  };

  const handleConfirmDelete = async () => {
    const co = showDeleteDialog;
    if (!co) return;

    try {
      setSaving(true);
      setError('');

      // If assessments exist under this CO, cascade-delete them
      const affectedAssessments = assessments.filter((a) => a.mappedCO === co);
      let failedDeletions = 0;

      if (affectedAssessments.length > 0) {
        const results = await Promise.allSettled(
          affectedAssessments.map((a) => deleteAssessment(a._id).unwrap())
        );
        
        failedDeletions = results.filter((r) => r.status === 'rejected').length;
      }

      if (failedDeletions > 0) {
        throw new Error(`Failed to delete ${failedDeletions} assessment(s). Please try again.`);
      }

      // Remove CO from coPoMapping
      const nextMapping = coMappings.filter((m) => m.co !== co);
      await updateClassInstance({ id: classInstance._id, coPoMapping: nextMapping }).unwrap();

      setShowDeleteDialog(null);
      setSuccess(`${co} and ${affectedAssessments.length} assessment(s) deleted.`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.data?.error || err.message || 'Failed to delete CO');
    } finally {
      setSaving(false);
    }
  };

  if (!classInstance) return null;

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-ruet-blue" size={28} /></div>;
  }

  const course = summary?.classInstance?.course || classInstance?.course;

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded text-sm">{error}</div>}
      {success && <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded text-sm">{success}</div>}

      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Course Outcomes</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {course?.courseCode} - {course?.courseName} (Section {classInstance.section}, {classInstance.series} Series)
            </p>
          </div>
          <button
            onClick={handleAddCO}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-ruet-blue text-white rounded-md text-sm font-medium hover:bg-ruet-dark transition-colors disabled:opacity-60"
          >
            <Plus size={16} className="mr-2" />
            Add CO{getNextCONumber(coMappings.map((m) => m.co))}
          </button>
        </div>

        {coMappings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#2d2d2d] px-6 py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">No Course Outcomes defined yet. Click &ldquo;Add CO1&rdquo; to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-20">CO</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Mapped POs</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-28">Assessments</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
                {coMappings.map((mapping) => {
                  const isEditing = editingCO === mapping.co;
                  const assessmentCount = getAssessmentCountForCO(mapping.co);

                  return (
                    <tr key={mapping.co} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-bold rounded min-w-[44px] text-center">
                          {mapping.co}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder={`Describe ${mapping.co}...`}
                            rows={2}
                            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-[#2d2d2d] text-gray-900 dark:text-gray-200 outline-none resize-none focus:ring-2 focus:ring-ruet-blue/30 focus:border-ruet-blue"
                          />
                        ) : (
                          <p className="text-sm text-gray-700 dark:text-gray-300 max-w-md">
                            {mapping.description || <span className="italic text-gray-400 dark:text-gray-500">No description</span>}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex flex-wrap gap-1.5">
                            {PO_OPTIONS.map((po) => (
                              <button
                                key={po}
                                onClick={() => handleTogglePO(po)}
                                className={`px-2 py-1 text-xs font-medium rounded-md border transition-all ${
                                  editPOs.includes(po)
                                    ? 'bg-ruet-blue text-white border-ruet-blue dark:bg-blue-500 dark:border-blue-500'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-ruet-blue/50'
                                }`}
                              >
                                {po}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {(mapping.po || []).map((po) => (
                              <span key={po} className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded">
                                {po}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-bold ${assessmentCount > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                          {assessmentCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={handleSaveEdit}
                              disabled={saving || editPOs.length === 0}
                              className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors disabled:opacity-40"
                              title="Save"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleStartEdit(mapping)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleRequestDelete(mapping.co)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-lg shadow-xl w-full max-w-sm p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete {showDeleteDialog}?</h3>
            </div>
            {deletingAssessmentCount > 0 ? (
              <div className="mb-4 space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This CO has <span className="font-bold text-red-600 dark:text-red-400">{deletingAssessmentCount}</span> assessment{deletingAssessmentCount !== 1 ? 's' : ''} mapped to it.
                </p>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-xs text-red-700 dark:text-red-400 font-medium">
                  <AlertTriangle size={14} className="inline mr-1.5 -mt-0.5" />
                  All assessments and their marks under {showDeleteDialog} will be permanently deleted.
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                This CO has no assessments. It will be removed from the CO-PO mapping.
              </p>
            )}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteDialog(null)}
                className="px-4 py-2 border rounded text-gray-600 dark:text-gray-300 dark:border-gray-700 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium text-sm disabled:opacity-60 flex items-center"
              >
                {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
                Delete {showDeleteDialog}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCOs;
