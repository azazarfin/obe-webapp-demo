import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Loader2 } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import api from '../../utils/api';

const sectionLetters = ['A', 'B', 'C', 'D', 'E'];

const emptyForm = { name: '', shortName: '', establishedYear: '', introduction: '', hasSections: false, sectionCount: 0 };

const DepartmentInfo = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [confirm, setConfirm] = useState({ open: false, type: '', id: null });

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await api.get('/departments');
      setDepartments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (dept) => {
    setEditingId(dept._id);
    setFormData({ name: dept.name, shortName: dept.shortName, establishedYear: dept.establishedYear || '', introduction: dept.introduction || '', hasSections: dept.hasSections || false, sectionCount: dept.sectionCount || 0 });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setConfirm({ open: true, type: editingId ? 'edit' : 'add', id: editingId });
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    try {
      const payload = { ...formData, establishedYear: parseInt(formData.establishedYear) || undefined };
      if (editingId) {
        await api.put(`/departments/${editingId}`, payload);
      } else {
        await api.post('/departments', payload);
      }
      await fetchDepartments();
      setShowModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
      setConfirm({ open: false, type: '', id: null });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.del(`/departments/${confirm.id}`);
      await fetchDepartments();
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirm({ open: false, type: '', id: null });
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-ruet-blue" size={32} /></div>;

  return (
    <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Department Info</h2>
        <button onClick={openAddModal} className="flex items-center px-4 py-2 bg-ruet-blue text-white rounded-md hover:bg-ruet-dark transition-colors font-medium">
          <Plus size={18} className="mr-2" /> Add Department
        </button>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded mb-4 text-sm">{error}</div>}

      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Short Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Est. Year</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Sections</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Intro</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
            {departments.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">No departments found.</td></tr>
            ) : departments.map((dept) => (
              <tr key={dept._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{dept.shortName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{dept.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{dept.establishedYear}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                  {dept.hasSections
                    ? <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">{sectionLetters.slice(0, dept.sectionCount).join(', ')}</span>
                    : <span className="text-gray-400 text-xs">No sections</span>
                  }
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{dept.introduction}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openEditModal(dept)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3"><Edit size={18} /></button>
                  <button onClick={() => setConfirm({ open: true, type: 'delete', id: dept._id })} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-800 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editingId ? 'Edit Department' : 'Add Department'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Department Name</label><input required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Electrical and Computer Engineering"/></div>
              <div><label className="block text-sm font-medium mb-1">Short Name</label><input required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.shortName} onChange={e => setFormData({...formData, shortName: e.target.value})} placeholder="ECE"/></div>
              <div><label className="block text-sm font-medium mb-1">Established Year</label><input type="number" className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.establishedYear} onChange={e => setFormData({...formData, establishedYear: e.target.value})} placeholder="2010"/></div>
              <div><label className="block text-sm font-medium mb-1">Short Intro</label><textarea className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.introduction} onChange={e => setFormData({...formData, introduction: e.target.value})} placeholder="Brief description..."></textarea></div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Has Sections?</label>
                  <button type="button" onClick={() => setFormData({...formData, hasSections: !formData.hasSections, sectionCount: !formData.hasSections ? 2 : 0})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.hasSections ? 'bg-ruet-blue' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.hasSections ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                {formData.hasSections && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium mb-1">Number of Sections</label>
                    <select className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.sectionCount} onChange={e => setFormData({...formData, sectionCount: parseInt(e.target.value)})}>
                      {[2, 3, 4, 5].map(n => <option key={n} value={n}>{n} ({sectionLetters.slice(0, n).join(', ')})</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border mr-2 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-ruet-blue text-white rounded hover:bg-ruet-dark font-medium disabled:opacity-60">{saving ? 'Saving...' : (editingId ? 'Save Changes' : 'Save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={confirm.open && confirm.type === 'delete'} title="Delete Department" message="Are you sure you want to delete this department? This action cannot be undone." confirmLabel="Delete" onConfirm={handleDeleteConfirm} onCancel={() => setConfirm({ open: false, type: '', id: null })} />
      <ConfirmDialog isOpen={confirm.open && (confirm.type === 'edit' || confirm.type === 'add')} title={confirm.type === 'edit' ? 'Confirm Edit' : 'Confirm Add'} message={confirm.type === 'edit' ? 'Save changes to this department?' : 'Add this department?'} confirmLabel="Save" variant="info" onConfirm={handleConfirmSave} onCancel={() => setConfirm({ open: false, type: '', id: null })} />
    </div>
  );
};

export default DepartmentInfo;
