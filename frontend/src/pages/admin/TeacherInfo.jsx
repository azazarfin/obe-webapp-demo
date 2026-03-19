import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Filter, Loader2 } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import api from '../../utils/api';

const DESIGNATIONS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Adjunct'];
const emptyForm = { name: '', designation: '', email: '', department: '' };

const TeacherInfo = () => {
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [filterDept, setFilterDept] = useState('');
  const [confirm, setConfirm] = useState({ open: false, type: '', id: null });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [depts, users] = await Promise.all([
        api.get('/departments'),
        api.get('/users?role=TEACHER')
      ]);
      setDepartments(depts);
      setTeachers(users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = filterDept ? teachers.filter(t => t.department?._id === filterDept) : teachers;

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ ...emptyForm, department: filterDept || departments[0]?._id || '' });
    setShowModal(true);
  };

  const openEditModal = (teacher) => {
    setEditingId(teacher._id);
    setFormData({ name: teacher.name, designation: teacher.designation || '', email: teacher.email, department: teacher.department?._id || '' });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setConfirm({ open: true, type: editingId ? 'edit' : 'add', id: editingId });
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/users/${editingId}`, { ...formData, role: 'TEACHER' });
      } else {
        await api.post('/users', { ...formData, role: 'TEACHER' });
      }
      await fetchData();
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
      await api.del(`/users/${confirm.id}`);
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirm({ open: false, type: '', id: null });
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-ruet-blue" size={32} /></div>;

  return (
    <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Teacher Info</h2>
          <div className="flex items-center text-sm bg-gray-100 dark:bg-[#2d2d2d] rounded px-2 py-1 max-w-max">
            <Filter size={14} className="mr-2 text-gray-500"/>
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="bg-transparent border-none outline-none dark:text-white">
              <option value="">All Depts</option>
              {departments.map(d => <option key={d._id} value={d._id}>{d.shortName}</option>)}
            </select>
          </div>
        </div>
        <button onClick={openAddModal} className="flex items-center px-4 py-2 bg-ruet-blue text-white rounded-md hover:bg-ruet-dark transition-colors font-medium">
          <Plus size={18} className="mr-2" /> Add Teacher
        </button>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded mb-4 text-sm">{error}</div>}

      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Designation & Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Dept</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
            {filtered.length > 0 ? filtered.map((teacher) => (
              <tr key={teacher._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{teacher.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                  <span className="block">{teacher.designation}</span>
                  <span className="text-xs text-gray-500">{teacher.email}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{teacher.department?.shortName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openEditModal(teacher)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3"><Edit size={18} /></button>
                  <button onClick={() => setConfirm({ open: true, type: 'delete', id: teacher._id })} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                </td>
              </tr>
            )) : <tr><td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500">No teachers found.</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-800 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editingId ? 'Edit Teacher' : 'Add Teacher'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Full Name</label><input required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" onChange={e => setFormData({...formData, name: e.target.value})} value={formData.name} /></div>
              <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" onChange={e => setFormData({...formData, email: e.target.value})} value={formData.email} placeholder="name@dept.ruet.ac.bd" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Designation</label><select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})}><option value="">Select...</option>{DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1">Department</label><select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}><option value="">Select...</option>{departments.map(d => <option key={d._id} value={d._id}>{d.shortName}</option>)}</select></div>
              </div>
              {!editingId && <p className="text-xs text-gray-500 dark:text-gray-400">Default password will be set to <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">123456</code></p>}
              <div className="flex justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border mr-2 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-ruet-blue text-white rounded hover:bg-ruet-dark font-medium disabled:opacity-60">{saving ? 'Saving...' : (editingId ? 'Save Changes' : 'Save Teacher')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={confirm.open && confirm.type === 'delete'} title="Delete Teacher" message="Are you sure you want to delete this teacher? This action cannot be undone." confirmLabel="Delete" onConfirm={handleDeleteConfirm} onCancel={() => setConfirm({ open: false, type: '', id: null })} />
      <ConfirmDialog isOpen={confirm.open && (confirm.type === 'edit' || confirm.type === 'add')} title={confirm.type === 'edit' ? 'Confirm Edit' : 'Confirm Add'} message={confirm.type === 'edit' ? 'Save changes to this teacher?' : 'Add this teacher?'} confirmLabel="Save" variant="info" onConfirm={handleConfirmSave} onCancel={() => setConfirm({ open: false, type: '', id: null })} />
    </div>
  );
};

export default TeacherInfo;
