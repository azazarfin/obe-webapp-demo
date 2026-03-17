import React, { useState } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import { SEMESTERS } from '../../utils/semesterUtils';

const mockCourses = [
  { id: 1, code: 'CSE 3101', name: 'Database Systems', credit: '3.0', type: 'Theory', semester: '3rd Year Odd', content: 'ER Models, Normalization, SQL, Transactions' },
  { id: 2, code: 'CSE 3102', name: 'Database Systems Lab', credit: '1.5', type: 'Sessional', semester: '3rd Year Odd', content: 'MySQL Exercises, Project' },
];

const DeptAddCourse = () => {
  const [courses, setCourses] = useState(mockCourses);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ code: '', name: '', credit: '', type: 'Theory', semester: SEMESTERS[0], content: '' });
  const [confirm, setConfirm] = useState({ open: false, type: '', id: null });

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ code: '', name: '', credit: '', type: 'Theory', semester: SEMESTERS[0], content: '' });
    setShowModal(true);
  };

  const openEditModal = (course) => {
    setEditingId(course.id);
    setFormData({ code: course.code, name: course.name, credit: course.credit, type: course.type, semester: course.semester, content: course.content });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setConfirm({ open: true, type: editingId ? 'edit' : 'add', id: editingId });
  };

  const handleConfirmSave = () => {
    if (confirm.type === 'edit') {
      setCourses(courses.map(c => c.id === confirm.id ? { ...c, ...formData } : c));
    } else {
      setCourses([...courses, { id: Date.now(), ...formData }]);
    }
    setShowModal(false);
    setConfirm({ open: false, type: '', id: null });
  };

  const handleDeleteClick = (id) => {
    setConfirm({ open: true, type: 'delete', id });
  };

  const handleDeleteConfirm = () => {
    setCourses(courses.filter(c => c.id !== confirm.id));
    setConfirm({ open: false, type: '', id: null });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add / Manage Courses — CSE</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Add new courses or edit existing ones for this department.</p>
        </div>
        <button onClick={openAddModal} className="flex items-center px-4 py-2 bg-ruet-blue text-white rounded-md hover:bg-ruet-dark transition-colors font-medium">
          <Plus size={18} className="mr-2" /> Add Course
        </button>
      </div>

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
            {courses.map(course => (
              <tr key={course.id}>
                <td className="px-5 py-3 whitespace-nowrap text-sm font-bold text-ruet-blue dark:text-blue-400">{course.code}</td>
                <td className="px-5 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{course.name}</td>
                <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{course.credit}</td>
                <td className="px-5 py-3 whitespace-nowrap text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${course.type === 'Theory' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'}`}>{course.type}</span>
                </td>
                <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{course.semester}</td>
                <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{course.content}</td>
                <td className="px-5 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button onClick={() => openEditModal(course)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400"><Edit size={18} /></button>
                  <button onClick={() => handleDeleteClick(course.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
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
              <div><label className="block text-sm font-medium mb-1">Course Code</label><input required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="CSE 4101" /></div>
              <div><label className="block text-sm font-medium mb-1">Course Name</label><input required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Artificial Intelligence" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-sm font-medium mb-1">Credit</label><input type="number" step="0.5" required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.credit} onChange={e => setFormData({...formData, credit: e.target.value})} /></div>
                <div><label className="block text-sm font-medium mb-1">Type</label>
                  <select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="Theory">Theory</option><option value="Sessional">Sessional</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium mb-1">Semester</label>
                  <select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none" value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})}>
                    {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Course Content</label><textarea className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" rows="3" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="Brief syllabus topics..."></textarea></div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="px-4 py-2 bg-ruet-blue text-white rounded hover:bg-ruet-dark font-medium w-full">{editingId ? 'Save Changes' : 'Save Course'}</button>
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
