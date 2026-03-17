import React, { useState } from 'react';
import { Plus, Edit, Trash2, X, Filter } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import { SEMESTERS } from '../../utils/semesterUtils';

const mockCourses = [
  { id: 1, code: 'CSE 3101', name: 'Database Systems', credit: '3.0', type: 'Theory', dept: 'CSE', semester: '3rd Year Odd' },
  { id: 2, code: 'CSE 3102', name: 'Database Systems Lab', credit: '1.5', type: 'Sessional', dept: 'CSE', semester: '3rd Year Odd' },
  { id: 3, code: 'ECE 3101', name: 'Signals and Systems', credit: '3.0', type: 'Theory', dept: 'ECE', semester: '3rd Year Odd' },
];

const CourseInfo = () => {
  const [courses, setCourses] = useState(mockCourses);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ code: '', name: '', credit: '', type: 'Theory', dept: 'CSE', semester: SEMESTERS[0] });
  
  const [filterDept, setFilterDept] = useState('All');
  const [filterSemester, setFilterSemester] = useState('All');
  const [confirm, setConfirm] = useState({ open: false, type: '', id: null });

  const depts = ['All', 'CSE', 'ECE', 'ME', 'EEE', 'CE'];

  const filteredCourses = courses.filter(c => 
    (filterDept === 'All' || c.dept === filterDept) &&
    (filterSemester === 'All' || c.semester === filterSemester)
  );

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ code: '', name: '', credit: '', type: 'Theory', dept: filterDept !== 'All' ? filterDept : 'CSE', semester: filterSemester !== 'All' ? filterSemester : SEMESTERS[0] });
    setShowModal(true);
  };

  const openEditModal = (course) => {
    setEditingId(course.id);
    setFormData({ code: course.code, name: course.name, credit: course.credit, type: course.type, dept: course.dept, semester: course.semester });
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
    <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Course Info</h2>
           <div className="flex space-x-2 text-sm">
             <div className="flex items-center bg-gray-100 dark:bg-[#2d2d2d] rounded px-2 py-1">
                <Filter size={14} className="mr-2 text-gray-500"/>
                <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="bg-transparent border-none outline-none dark:text-white">
                   {depts.map(d => <option key={d} value={d} className="dark:bg-gray-800">{d === 'All' ? 'All Depts' : d}</option>)}
                </select>
             </div>
             <div className="flex items-center bg-gray-100 dark:bg-[#2d2d2d] rounded px-2 py-1">
                <select value={filterSemester} onChange={e => setFilterSemester(e.target.value)} className="bg-transparent border-none outline-none dark:text-white">
                   <option value="All" className="dark:bg-gray-800">All Semesters</option>
                   {SEMESTERS.map(s => <option key={s} value={s} className="dark:bg-gray-800">{s}</option>)}
                </select>
             </div>
           </div>
        </div>
        <button onClick={openAddModal} className="flex items-center px-4 py-2 bg-ruet-blue text-white rounded-md hover:bg-ruet-dark transition-colors font-medium">
          <Plus size={18} className="mr-2" /> Add Course
        </button>
      </div>

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
            {filteredCourses.length > 0 ? filteredCourses.map((course) => (
              <tr key={course.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-ruet-blue dark:text-blue-400">{course.code}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{course.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{course.credit}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 py-1 rounded text-xs font-semibold ${course.type === 'Theory' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'}`}>{course.type}</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{course.dept} ({course.semester})</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openEditModal(course)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3"><Edit size={18} /></button>
                  <button onClick={() => handleDeleteClick(course.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
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
              <div><label className="block text-sm font-medium mb-1">Course Code</label><input required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" onChange={e => setFormData({...formData, code: e.target.value})} value={formData.code} placeholder="e.g. CSE 101"/></div>
              <div><label className="block text-sm font-medium mb-1">Course Name</label><input required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" onChange={e => setFormData({...formData, name: e.target.value})} value={formData.name} placeholder="e.g. Intro to CS"/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Credit</label><input type="number" step="0.5" required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.credit} onChange={e => setFormData({...formData, credit: e.target.value})}/></div>
                <div><label className="block text-sm font-medium mb-1">Type</label><select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}><option value="Theory">Theory</option><option value="Sessional">Sessional</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Department</label><select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.dept} onChange={e => setFormData({...formData, dept: e.target.value})}>{depts.filter(d => d !== 'All').map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1">Semester</label><select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})}>{SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border mr-2 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-ruet-blue text-white rounded hover:bg-ruet-dark font-medium">{editingId ? 'Save Changes' : 'Save Course'}</button>
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
        message={confirm.type === 'edit' ? 'Are you sure you want to save changes to this course?' : 'Are you sure you want to add this course?'}
        confirmLabel="Save"
        variant="info"
        onConfirm={handleConfirmSave}
        onCancel={() => setConfirm({ open: false, type: '', id: null })}
      />
    </div>
  );
};

export default CourseInfo;
