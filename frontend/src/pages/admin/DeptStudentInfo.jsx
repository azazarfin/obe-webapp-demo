import React, { useState } from 'react';
import { Edit, Filter, X } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import { defaultSeries } from './SeriesManagement';

const mockStudents = [
  { id: 1, roll: '2103001', name: 'Rahim Uddin', email: '2103001@student.ruet.ac.bd', series: '2021', section: 'A' },
  { id: 2, roll: '2103002', name: 'Karim Hasan', email: '2103002@student.ruet.ac.bd', series: '2021', section: 'A' },
  { id: 3, roll: '2203001', name: 'Nadia Sultana', email: '2203001@student.ruet.ac.bd', series: '2022', section: 'B' },
  { id: 4, roll: '2203002', name: 'Tamim Iqbal', email: '2203002@student.ruet.ac.bd', series: '2022', section: 'N/A' },
];

const seriesOptions = ['All', ...defaultSeries];
const sectionOptions = ['All', 'N/A', 'A', 'B', 'C', 'D', 'E'];

const DeptStudentInfo = () => {
  const [students, setStudents] = useState(mockStudents);
  const [filterSeries, setFilterSeries] = useState('All');
  const [filterSection, setFilterSection] = useState('All');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [confirm, setConfirm] = useState({ open: false });

  const filteredStudents = students.filter(s =>
    (filterSeries === 'All' || s.series === filterSeries) &&
    (filterSection === 'All' || s.section === filterSection)
  );

  const handleEdit = (student) => {
    setEditingStudent({ ...student });
    setShowEditModal(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setConfirm({ open: true });
  };

  const handleConfirmSave = () => {
    setStudents(students.map(s => s.id === editingStudent.id ? editingStudent : s));
    setShowEditModal(false);
    setEditingStudent(null);
    setConfirm({ open: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Student Info — CSE Department</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">View and edit student records. Use filters to narrow by series and section.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <div className="flex items-center bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-gray-700 rounded px-3 py-1.5">
          <Filter size={14} className="mr-2 text-gray-500" />
          <select value={filterSeries} onChange={e => setFilterSeries(e.target.value)} className="bg-transparent border-none outline-none dark:text-white">
            {seriesOptions.map(s => <option key={s} value={s} className="dark:bg-gray-800">{s === 'All' ? 'All Series' : `Series ${s}`}</option>)}
          </select>
        </div>
        <div className="flex items-center bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-gray-700 rounded px-3 py-1.5">
          <select value={filterSection} onChange={e => setFilterSection(e.target.value)} className="bg-transparent border-none outline-none dark:text-white">
            {sectionOptions.map(s => <option key={s} value={s} className="dark:bg-gray-800">{s === 'All' ? 'All Sections' : `Sec: ${s}`}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg border border-gray-100 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Roll</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Series</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Section</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Edit</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStudents.length > 0 ? filteredStudents.map(student => (
                <tr key={student.id}>
                  <td className="px-5 py-3 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{student.roll}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{student.name}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-sm text-ruet-blue dark:text-blue-400">{student.email}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{student.series}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">{student.section}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-right">
                    <button onClick={() => handleEdit(student)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400"><Edit size={18} /></button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="px-5 py-8 text-center text-sm text-gray-500">No students found matching criteria.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showEditModal && editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Student</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Name</label><input required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={editingStudent.name} onChange={e => setEditingStudent({...editingStudent, name: e.target.value})}/></div>
              <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue font-mono" value={editingStudent.email} onChange={e => setEditingStudent({...editingStudent, email: e.target.value})}/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Series</label><select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={editingStudent.series} onChange={e => setEditingStudent({...editingStudent, series: e.target.value})}>{defaultSeries.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1">Section</label>
                  <select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={editingStudent.section} onChange={e => setEditingStudent({...editingStudent, section: e.target.value})}>
                    {sectionOptions.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="px-4 py-2 bg-ruet-blue text-white rounded hover:bg-ruet-dark font-medium w-full">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirm.open}
        title="Confirm Edit"
        message="Are you sure you want to save changes to this student?"
        confirmLabel="Save"
        variant="info"
        onConfirm={handleConfirmSave}
        onCancel={() => setConfirm({ open: false })}
      />
    </div>
  );
};

export default DeptStudentInfo;
