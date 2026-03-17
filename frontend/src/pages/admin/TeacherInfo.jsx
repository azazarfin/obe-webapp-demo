import React, { useState } from 'react';
import { Plus, Edit, Trash2, X, Filter } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';

const mockTeachers = [
  { id: 1, name: 'Dr. John Doe', designation: 'Professor', join_year: '2015', dept: 'ECE', type: 'Host', email: 'john@ece.ruet.ac.bd' },
  { id: 2, name: 'Jane Smith', designation: 'Assistant Professor', join_year: '2020', dept: 'CSE', type: 'Guest', email: 'jane.smith@gmail.com' },
];

const TeacherInfo = () => {
  const [teachers, setTeachers] = useState(mockTeachers);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', designation: '', join_year: '', dept: 'CSE', type: 'Host', email: '' });
  
  const [filterDept, setFilterDept] = useState('All');
  const [confirm, setConfirm] = useState({ open: false, type: '', id: null });
  const depts = ['All', 'CSE', 'ECE', 'ME', 'EEE', 'CE'];

  const filteredTeachers = teachers.filter(t => filterDept === 'All' || t.dept === filterDept);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', designation: '', join_year: '', dept: filterDept !== 'All' ? filterDept : 'CSE', type: 'Host', email: '' });
    setShowModal(true);
  };

  const openEditModal = (teacher) => {
    setEditingId(teacher.id);
    setFormData({ name: teacher.name, designation: teacher.designation, join_year: teacher.join_year, dept: teacher.dept, type: teacher.type, email: teacher.email });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setConfirm({ open: true, type: editingId ? 'edit' : 'add', id: editingId });
  };

  const handleConfirmSave = () => {
    if (confirm.type === 'edit') {
      setTeachers(teachers.map(t => t.id === confirm.id ? { ...t, ...formData } : t));
    } else {
      setTeachers([...teachers, { id: Date.now(), ...formData }]);
    }
    setShowModal(false);
    setConfirm({ open: false, type: '', id: null });
  };

  const handleDeleteClick = (id) => {
    setConfirm({ open: true, type: 'delete', id });
  };

  const handleDeleteConfirm = () => {
    setTeachers(teachers.filter(t => t.id !== confirm.id));
    setConfirm({ open: false, type: '', id: null });
  };

  return (
    <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Teacher Info</h2>
           <div className="flex items-center text-sm bg-gray-100 dark:bg-[#2d2d2d] rounded px-2 py-1 max-w-max">
              <Filter size={14} className="mr-2 text-gray-500"/>
              <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="bg-transparent border-none outline-none dark:text-white">
                 {depts.map(d => <option key={d} value={d} className="dark:bg-gray-800">{d === 'All' ? 'All Depts' : d}</option>)}
              </select>
           </div>
        </div>
        <button onClick={openAddModal} className="flex items-center px-4 py-2 bg-ruet-blue text-white rounded-md hover:bg-ruet-dark transition-colors font-medium">
          <Plus size={18} className="mr-2" /> Add Teacher
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Designation & Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Dept</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTeachers.length > 0 ? filteredTeachers.map((teacher) => (
              <tr key={teacher.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{teacher.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                  <span className="block">{teacher.designation}</span>
                  <span className="text-xs text-gray-500">{teacher.email}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{teacher.dept}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${teacher.type === 'Host' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'}`}>{teacher.type}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openEditModal(teacher)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3"><Edit size={18} /></button>
                  <button onClick={() => handleDeleteClick(teacher.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                </td>
              </tr>
            )) : <tr><td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">No teachers found matching criteria.</td></tr>}
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
              <div><label className="block text-sm font-medium mb-1">Name</label><input required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" onChange={e => setFormData({...formData, name: e.target.value})} value={formData.name} /></div>
              <div><label className="block text-sm font-medium mb-1">Teacher Email</label><input type="email" required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" onChange={e => setFormData({...formData, email: e.target.value})} value={formData.email} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Designation</label><input required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} placeholder="Professor" /></div>
                <div><label className="block text-sm font-medium mb-1">Joining Year</label><input type="number" required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.join_year} onChange={e => setFormData({...formData, join_year: e.target.value})} placeholder="2015" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Department</label><select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.dept} onChange={e => setFormData({...formData, dept: e.target.value})}>{depts.filter(d => d !== 'All').map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1">Teacher Type</label><select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}><option value="Host">Host Faculty</option><option value="Guest">Guest Teacher</option></select></div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border mr-2 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-ruet-blue text-white rounded hover:bg-ruet-dark font-medium">{editingId ? 'Save Changes' : 'Save Teacher'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirm.open && confirm.type === 'delete'}
        title="Delete Teacher"
        message="Are you sure you want to delete this teacher? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirm({ open: false, type: '', id: null })}
      />
      <ConfirmDialog
        isOpen={confirm.open && (confirm.type === 'edit' || confirm.type === 'add')}
        title={confirm.type === 'edit' ? 'Confirm Edit' : 'Confirm Add'}
        message={confirm.type === 'edit' ? 'Are you sure you want to save changes to this teacher?' : 'Are you sure you want to add this teacher?'}
        confirmLabel="Save"
        variant="info"
        onConfirm={handleConfirmSave}
        onCancel={() => setConfirm({ open: false, type: '', id: null })}
      />
    </div>
  );
};

export default TeacherInfo;
