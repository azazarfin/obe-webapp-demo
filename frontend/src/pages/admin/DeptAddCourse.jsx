import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, X, Loader2 } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import { SEMESTERS } from '../../utils/semesterUtils';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

const emptyForm = {
  courseCode: '',
  courseName: '',
  credit: '',
  type: 'Theory',
  semester: SEMESTERS[0],
  syllabus: ''
};

const DeptAddCourse = () => {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [confirm, setConfirm] = useState({ open: false, type: '', id: null });

  const departmentId = currentUser?.department?._id;

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError('');
      const endpoint = departmentId ? `/courses?department=${departmentId}` : '/courses';
      const data = await api.get(endpoint);
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchCourses();
    }
  }, [currentUser]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (course) => {
    setEditingId(course._id);
    setFormData({
      courseCode: course.courseCode,
      courseName: course.courseName,
      credit: course.credit,
      type: course.type,
      semester: course.semester || SEMESTERS[0],
      syllabus: course.syllabus || ''
    });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setConfirm({ open: true, type: editingId ? 'edit' : 'add', id: editingId });
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        credit: parseFloat(formData.credit),
        department: departmentId
      };

      if (editingId) {
        await api.put(`/courses/${editingId}`, payload);
      } else {
        await api.post('/courses', payload);
      }

      await fetchCourses();
      setShowModal(false);
      setConfirm({ open: false, type: '', id: null });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.del(`/courses/${confirm.id}`);
      await fetchCourses();
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirm({ open: false, type: '', id: null });
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-ruet-blue" size={32} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Add / Manage Courses - {currentUser?.department?.shortName || currentUser?.department?.name || 'Department'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Add new courses or edit existing ones for this department.</p>
        </div>
        <button onClick={openAddModal} className="flex items-center px-4 py-2 bg-ruet-blue text-white rounded-md hover:bg-ruet-dark transition-colors font-medium">
          <Plus size={18} className="mr-2" /> Add Course
        </button>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded text-sm">{error}</div>}

      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg border border-gray-100 dark:border-gray-800 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Code</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Credit</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Semester</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Content</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
            {courses.length > 0 ? courses.map((course) => (
              <tr key={course._id}>
                <td className="px-5 py-3 whitespace-nowrap text-sm font-bold text-ruet-blue dark:text-blue-400">{course.courseCode}</td>
                <td className="px-5 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{course.courseName}</td>
                <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{course.credit}</td>
                <td className="px-5 py-3 whitespace-nowrap text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${course.type === 'Theory' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'}`}>{course.type}</span>
                </td>
                <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{course.semester || 'N/A'}</td>
                <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400 truncate max-w-[240px]">{course.syllabus || 'No syllabus added'}</td>
                <td className="px-5 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button onClick={() => openEditModal(course)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400"><Edit size={18} /></button>
                  <button onClick={() => setConfirm({ open: true, type: 'delete', id: course._id })} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="7" className="px-5 py-8 text-center text-sm text-gray-500">No department courses found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-800 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editingId ? 'Edit Course' : 'Add Course'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Course Code</label><input required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.courseCode} onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })} placeholder="CSE 4101" /></div>
              <div><label className="block text-sm font-medium mb-1">Course Name</label><input required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.courseName} onChange={(e) => setFormData({ ...formData, courseName: e.target.value })} placeholder="Artificial Intelligence" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-sm font-medium mb-1">Credit</label><input type="number" step="0.5" required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.credit} onChange={(e) => setFormData({ ...formData, credit: e.target.value })} /></div>
                <div><label className="block text-sm font-medium mb-1">Type</label><select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}><option value="Theory">Theory</option><option value="Sessional">Sessional</option></select></div>
                <div><label className="block text-sm font-medium mb-1">Semester</label><select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none" value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: e.target.value })}>{SEMESTERS.map((semester) => <option key={semester} value={semester}>{semester}</option>)}</select></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Course Content</label><textarea className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" rows="3" value={formData.syllabus} onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })} placeholder="Brief syllabus topics..." /></div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-ruet-blue text-white rounded hover:bg-ruet-dark font-medium w-full disabled:opacity-60">{saving ? 'Saving...' : editingId ? 'Save Changes' : 'Save Course'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirm.open && confirm.type === 'delete'}
        title="Delete Course"
        message="Are you sure you want to delete this course? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirm({ open: false, type: '', id: null })}
      />
      <ConfirmDialog
        isOpen={confirm.open && (confirm.type === 'edit' || confirm.type === 'add')}
        title={confirm.type === 'edit' ? 'Confirm Edit' : 'Confirm Add'}
        message={confirm.type === 'edit' ? 'Are you sure you want to save changes?' : 'Are you sure you want to add this course?'}
        confirmLabel="Save"
        variant="info"
        onConfirm={handleConfirmSave}
        onCancel={() => setConfirm({ open: false, type: '', id: null })}
      />
    </div>
  );
};

export default DeptAddCourse;
