import React, { useEffect, useState } from 'react';
import { Edit, Filter, Loader2, Plus, Trash2, X } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import api from '../../utils/api';

const DESIGNATIONS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Adjunct'];
const TEACHER_TYPES = ['Host', 'Guest'];
const emptyForm = {
  name: '',
  designation: '',
  email: '',
  department: '',
  teacherType: 'Host',
  onLeave: false,
  leaveReason: ''
};

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
      const [departmentData, userData] = await Promise.all([
        api.get('/departments'),
        api.get('/users?role=TEACHER')
      ]);
      setDepartments(Array.isArray(departmentData) ? departmentData : []);
      setTeachers(Array.isArray(userData) ? userData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTeachers = filterDept ? teachers.filter((teacher) => teacher.department?._id === filterDept) : teachers;

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      ...emptyForm,
      department: filterDept || departments[0]?._id || ''
    });
    setShowModal(true);
  };

  const openEditModal = (teacher) => {
    setEditingId(teacher._id);
    setFormData({
      name: teacher.name || '',
      designation: teacher.designation || '',
      email: teacher.email || '',
      department: teacher.department?._id || '',
      teacherType: teacher.teacherType || 'Host',
      onLeave: Boolean(teacher.onLeave),
      leaveReason: teacher.leaveReason || ''
    });
    setShowModal(true);
  };

  const handleSave = (event) => {
    event.preventDefault();
    setConfirm({ open: true, type: editingId ? 'edit' : 'add', id: editingId });
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        role: 'TEACHER',
        department: formData.department,
        leaveReason: formData.onLeave ? formData.leaveReason.trim() : ''
      };

      if (editingId) {
        await api.put(`/users/${editingId}`, payload);
      } else {
        await api.post('/users', payload);
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

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-ruet-blue" size={32} /></div>;
  }

  return (
    <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Teacher Info</h2>
          <div className="flex items-center bg-gray-100 dark:bg-[#2d2d2d] rounded px-2 py-1 max-w-max text-sm">
            <Filter size={14} className="mr-2 text-gray-500" />
            <select value={filterDept} onChange={(event) => setFilterDept(event.target.value)} className="bg-transparent border-none outline-none dark:text-white">
              <option value="">All Departments</option>
              {departments.map((department) => (
                <option key={department._id} value={department._id}>{department.shortName}</option>
              ))}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type / Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Designation & Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Department</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTeachers.length > 0 ? filteredTeachers.map((teacher) => (
              <tr key={teacher._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{teacher.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">{teacher.teacherType || 'Host'}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ml-2 ${teacher.onLeave ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
                    {teacher.onLeave ? 'On Leave' : 'Available'}
                  </span>
                  {teacher.onLeave && teacher.leaveReason && <span className="block text-xs text-amber-600 dark:text-amber-300 mt-1">{teacher.leaveReason}</span>}
                </td>
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
            )) : (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">No teachers found.</td></tr>
            )}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Teacher Type</label>
                  <select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.teacherType} onChange={(event) => setFormData((prev) => ({ ...prev, teacherType: event.target.value }))}>
                    {TEACHER_TYPES.map((teacherType) => (
                      <option key={teacherType} value={teacherType}>{teacherType}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={formData.onLeave} onChange={(event) => setFormData((prev) => ({ ...prev, onLeave: event.target.checked, leaveReason: event.target.checked ? prev.leaveReason : '' }))} />
                    Mark as on leave
                  </label>
                </div>
              </div>

              <div><label className="block text-sm font-medium mb-1">Full Name</label><input required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))} value={formData.name} /></div>
              <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))} value={formData.email} placeholder="name@dept.ruet.ac.bd" /></div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Designation</label><select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.designation} onChange={(event) => setFormData((prev) => ({ ...prev, designation: event.target.value }))}><option value="">Select...</option>{DESIGNATIONS.map((designation) => <option key={designation} value={designation}>{designation}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1">Department</label><select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.department} onChange={(event) => setFormData((prev) => ({ ...prev, department: event.target.value }))}><option value="">Select...</option>{departments.map((department) => <option key={department._id} value={department._id}>{department.shortName}</option>)}</select></div>
              </div>

              {formData.onLeave && (
                <div>
                  <label className="block text-sm font-medium mb-1">Leave Reason</label>
                  <input className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.leaveReason} onChange={(event) => setFormData((prev) => ({ ...prev, leaveReason: event.target.value }))} placeholder="e.g. PhD leave" />
                </div>
              )}

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
