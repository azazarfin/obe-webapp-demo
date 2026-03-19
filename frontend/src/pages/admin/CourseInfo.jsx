import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Filter, Loader2 } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import api from '../../utils/api';
import { SEMESTERS } from '../../utils/semesterUtils';

const emptyForm = { courseCode: '', courseName: '', credit: '', type: 'Theory', department: '', semester: SEMESTERS[0], syllabus: '' };

const CourseInfo = () => {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [filterDept, setFilterDept] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [confirm, setConfirm] = useState({ open: false, type: '', id: null });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [depts, cs] = await Promise.all([
        api.get('/departments'),
        api.get('/courses')
      ]);
      setDepartments(depts);
      setCourses(cs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = courses.filter(c =>
    (!filterDept || c.department?._id === filterDept) &&
    (!filterSemester || c.semester === filterSemester)
  );

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ ...emptyForm, department: filterDept || departments[0]?._id || '' });
    setShowModal(true);
  };

  const openEditModal = (course) => {
    setEditingId(course._id);
    setFormData({ courseCode: course.courseCode, courseName: course.courseName, credit: course.credit, type: course.type, department: course.department?._id || '', semester: course.semester || SEMESTERS[0], syllabus: course.syllabus || '' });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setConfirm({ open: true, type: editingId ? 'edit' : 'add', id: editingId });
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    try {
      const payload = { ...formData, credit: parseFloat(formData.credit) };
      if (editingId) {
        await api.put(`/courses/${editingId}`, payload);
      } else {
        await api.post('/courses', payload);
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
      await api.del(`/courses/${confirm.id}`);
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Course Info</h2>
          <div className="flex space-x-2 text-sm">
            <div className="flex items-center bg-gray-100 dark:bg-[#2d2d2d] rounded px-2 py-1">
              <Filter size={14} className="mr-2 text-gray-500"/>
              <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="bg-transparent border-none outline-none dark:text-white">
                <option value="">All Depts</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.shortName}</option>)}
              </select>
            </div>
            <div className="flex items-center bg-gray-100 dark:bg-[#2d2d2d] rounded px-2 py-1">
              <select value={filterSemester} onChange={e => setFilterSemester(e.target.value)} className="bg-transparent border-none outline-none dark:text-white">
                <option value="">All Semesters</option>
                {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
        <button onClick={openAddModal} className="flex items-center px-4 py-2 bg-ruet-blue text-white rounded-md hover:bg-ruet-dark transition-colors font-medium">
          <Plus size={18} className="mr-2" /> Add Course
        </button>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded mb-4 text-sm">{error}</div>}

      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Credit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Dept / Semester</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
            {filtered.length > 0 ? filtered.map((course) => (
              <tr key={course._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-ruet-blue dark:text-blue-400">{course.courseCode}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{course.courseName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{course.credit}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 py-1 rounded text-xs font-semibold ${course.type === 'Theory' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'}`}>{course.type}</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{course.department?.shortName} {course.semester && `(${course.semester})`}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openEditModal(course)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3"><Edit size={18} /></button>
                  <button onClick={() => setConfirm({ open: true, type: 'delete', id: course._id })} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                </td>
              </tr>
            )) : <tr><td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">No courses found matching criteria.</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-800 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editingId ? 'Edit Course' : 'Add Course'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Course Code</label><input required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" onChange={e => setFormData({...formData, courseCode: e.target.value})} value={formData.courseCode} placeholder="ECE 3101"/></div>
              <div><label className="block text-sm font-medium mb-1">Course Name</label><input required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" onChange={e => setFormData({...formData, courseName: e.target.value})} value={formData.courseName} /></div>
              <div><label className="block text-sm font-medium mb-1">Syllabus / Contents</label><textarea rows={3} className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue text-sm" onChange={e => setFormData({...formData, syllabus: e.target.value})} value={formData.syllabus} placeholder="Brief course content description..."/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Credit</label><input type="number" step="0.5" required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.credit} onChange={e => setFormData({...formData, credit: e.target.value})}/></div>
                <div><label className="block text-sm font-medium mb-1">Type</label><select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}><option value="Theory">Theory</option><option value="Sessional">Sessional</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Department</label><select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}><option value="">Select...</option>{departments.map(d => <option key={d._id} value={d._id}>{d.shortName}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1">Semester</label><select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})}>{SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border mr-2 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-ruet-blue text-white rounded hover:bg-ruet-dark font-medium disabled:opacity-60">{saving ? 'Saving...' : (editingId ? 'Save Changes' : 'Save Course')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={confirm.open && confirm.type === 'delete'} title="Delete Course" message="Are you sure you want to delete this course? This action cannot be undone." confirmLabel="Delete" onConfirm={handleDeleteConfirm} onCancel={() => setConfirm({ open: false, type: '', id: null })} />
      <ConfirmDialog isOpen={confirm.open && (confirm.type === 'edit' || confirm.type === 'add')} title={confirm.type === 'edit' ? 'Confirm Edit' : 'Confirm Add'} message={confirm.type === 'edit' ? 'Save changes to this course?' : 'Add this course?'} confirmLabel="Save" variant="info" onConfirm={handleConfirmSave} onCancel={() => setConfirm({ open: false, type: '', id: null })} />
    </div>
  );
};

export default CourseInfo;
