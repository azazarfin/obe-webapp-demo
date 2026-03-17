import React, { useState } from 'react';
import { Plus, Edit, Trash2, X, Filter, FileSpreadsheet } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import { defaultSeries } from './SeriesManagement';

const mockStudents = [
  { id: 1, roll: '2310060', name: 'Abdur Rahman', email: '2310060@student.ruet.ac.bd', dept: 'ECE', series: '2023', section: 'A' },
  { id: 2, roll: '2103001', name: 'Rahim Uddin', email: '2103001@student.ruet.ac.bd', dept: 'CSE', series: '2021', section: 'B' },
];

const StudentInfo = () => {
  const [students, setStudents] = useState(mockStudents);
  
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', roll: '', email: '', dept: 'CSE', series: '', section: 'A' });
  
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkData, setBulkData] = useState({ dept: 'CSE', series: '', section: 'A', count: 0 });
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkStep, setBulkStep] = useState('setup');

  const [filterDept, setFilterDept] = useState('All');
  const [filterSeries, setFilterSeries] = useState('All');
  const [filterSection, setFilterSection] = useState('All');
  const [confirm, setConfirm] = useState({ open: false, type: '', id: null });

  const depts = ['All', 'CSE', 'ECE', 'ME', 'EEE', 'CE'];
  const sections = ['All', 'N/A', 'A', 'B', 'C', 'D', 'E'];
  
  const deptCodes = { CSE: '03', ECE: '06', ME: '05', EEE: '02', CE: '01' };
  const seriesList = ['All', ...defaultSeries];

  const filteredStudents = students.filter(s => 
    (filterDept === 'All' || s.dept === filterDept) &&
    (filterSeries === 'All' || s.series === filterSeries) &&
    (filterSection === 'All' || s.section === filterSection)
  );

  const handleRollChange = (roll) => {
    const email = /^\d{7}$/.test(roll) ? `${roll}@student.ruet.ac.bd` : '';
    setFormData({ ...formData, roll, email });
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', roll: '', email: '', dept: filterDept !== 'All' ? filterDept : 'CSE', series: '', section: filterSection !== 'All' ? filterSection : 'A' });
    setShowSingleModal(true);
  };

  const openEditModal = (student) => {
    setEditingId(student.id);
    setFormData({ name: student.name, roll: student.roll, email: student.email, dept: student.dept, series: student.series, section: student.section });
    setShowSingleModal(true);
  };

  const handleSaveSingle = (e) => {
    e.preventDefault();
    setConfirm({ open: true, type: editingId ? 'edit' : 'add', id: editingId });
  };

  const handleConfirmSave = () => {
    if (confirm.type === 'edit') {
      setStudents(students.map(s => s.id === confirm.id ? { ...s, ...formData } : s));
    } else {
      setStudents([...students, { id: Date.now(), ...formData }]);
    }
    setShowSingleModal(false);
    setConfirm({ open: false, type: '', id: null });
  };

  const handleDeleteClick = (id) => {
    setConfirm({ open: true, type: 'delete', id });
  };

  const handleDeleteConfirm = () => {
    setStudents(students.filter(s => s.id !== confirm.id));
    setConfirm({ open: false, type: '', id: null });
  };

  const handleBulkGenerate = (e) => {
    e.preventDefault();
    const seriesShort = bulkData.series.substring(2);
    const code = deptCodes[bulkData.dept] || '00';
    const count = parseInt(bulkData.count) || 0;
    const rows = [];
    for (let i = 1; i <= count; i++) {
      const rollNum = String(i).padStart(3, '0');
      const roll = `${seriesShort}${code}${rollNum}`;
      rows.push({ roll, name: '', email: `${roll}@student.ruet.ac.bd` });
    }
    setBulkRows(rows);
    setBulkStep('sheet');
  };

  const handleBulkRowChange = (idx, field, value) => {
    const updated = [...bulkRows];
    updated[idx] = { ...updated[idx], [field]: value };
    setBulkRows(updated);
  };

  const handleBulkSubmitAll = () => {
    setConfirm({ open: true, type: 'bulk', id: null });
  };

  const handleBulkConfirm = () => {
    const newStudents = bulkRows.map((row, i) => ({
      id: Date.now() + i,
      roll: row.roll,
      name: row.name || `Student ${row.roll}`,
      email: row.email,
      dept: bulkData.dept,
      series: bulkData.series,
      section: bulkData.section,
    }));
    setStudents([...students, ...newStudents]);
    setShowBulkModal(false);
    setBulkStep('setup');
    setBulkRows([]);
    setConfirm({ open: false, type: '', id: null });
  };

  return (
    <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
        <div>
           <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Student Info</h2>
           <div className="flex flex-wrap gap-2 text-sm">
             <div className="flex items-center bg-gray-100 dark:bg-[#2d2d2d] rounded px-2 py-1">
                <Filter size={14} className="mr-2 text-gray-500"/>
                <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="bg-transparent border-none outline-none dark:text-white">
                   {depts.map(d => <option key={d} value={d} className="dark:bg-gray-800">{d === 'All' ? 'All Depts' : d}</option>)}
                </select>
             </div>
             <div className="flex items-center bg-gray-100 dark:bg-[#2d2d2d] rounded px-2 py-1">
                <select value={filterSeries} onChange={e => setFilterSeries(e.target.value)} className="bg-transparent border-none outline-none dark:text-white">
                   {seriesList.map(s => <option key={s} value={s} className="dark:bg-gray-800">{s === 'All' ? 'All Series' : s}</option>)}
                </select>
             </div>
             <div className="flex items-center bg-gray-100 dark:bg-[#2d2d2d] rounded px-2 py-1">
                <select value={filterSection} onChange={e => setFilterSection(e.target.value)} className="bg-transparent border-none outline-none dark:text-white">
                   {sections.map(s => <option key={s} value={s} className="dark:bg-gray-800">{s === 'All' ? 'All Sections' : `Sec: ${s}`}</option>)}
                </select>
             </div>
           </div>
        </div>
        <div className="flex space-x-2">
           <button onClick={() => { setBulkData({ dept: filterDept !== 'All' ? filterDept : 'CSE', series: '', section: 'A', count: 60 }); setShowBulkModal(true); }} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium text-sm">
             <FileSpreadsheet size={16} className="mr-2" /> Bulk Add
           </button>
           <button onClick={openAddModal} className="flex items-center px-4 py-2 bg-ruet-blue text-white rounded-md hover:bg-ruet-dark transition-colors font-medium text-sm">
             <Plus size={16} className="mr-2" /> Add Student
           </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">ID / Roll</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name & Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Dept</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Series / Sec</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
            {filteredStudents.length > 0 ? filteredStudents.map((student) => (
              <tr key={student.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{student.roll}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                  <span className="block font-medium">{student.name}</span>
                  <span className="text-xs text-ruet-blue dark:text-blue-400">{student.email}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">{student.dept}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {student.series} <span className="mx-2 text-gray-300">|</span> <span className="font-bold text-gray-700 dark:text-gray-300">{student.section}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openEditModal(student)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3"><Edit size={18} /></button>
                  <button onClick={() => handleDeleteClick(student.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                </td>
              </tr>
            )) : <tr><td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">No students found matching criteria.</td></tr>}
          </tbody>
        </table>
      </div>

      {showSingleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-800 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editingId ? 'Edit Student' : 'Add Student'}</h3>
              <button onClick={() => setShowSingleModal(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveSingle} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Student Name</label><input required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" onChange={e => setFormData({...formData, name: e.target.value})} value={formData.name} placeholder="e.g. Abdur Rahman" /></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Department</label><select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.dept} onChange={e => setFormData({...formData, dept: e.target.value})}>{depts.filter(d => d !== 'All').map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1">Series</label><select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.series} onChange={e => setFormData({...formData, series: e.target.value})}><option value="">-- Select --</option>{defaultSeries.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Section</label><select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})}>{sections.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1">Roll / ID</label><input type="text" pattern="^\d{7}$" title="Exactly 7 digits (SeriesDeptCodeXXX)" required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue font-mono" onChange={e => handleRollChange(e.target.value)} value={formData.roll} placeholder="e.g. 2310060" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Student Email</label><input type="email" readOnly className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none bg-gray-50 dark:bg-[#252525] font-mono text-gray-500" value={formData.email} placeholder="Auto-generated from Roll ID" /></div>
              
              <div className="flex justify-end pt-2">
                <button type="submit" className="px-4 py-2 bg-ruet-blue text-white rounded hover:bg-ruet-dark font-medium w-full">{editingId ? 'Save Changes' : 'Save Student'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`bg-white dark:bg-[#1e1e1e] rounded-lg shadow-xl ${bulkStep === 'sheet' ? 'w-full max-w-3xl' : 'w-full max-w-lg'} p-6 border border-gray-200 dark:border-gray-800 text-left overflow-y-auto max-h-[90vh]`}>
            <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{bulkStep === 'setup' ? 'Bulk Add — Setup' : 'Bulk Add — Spreadsheet'}</h3>
                <p className="text-sm text-gray-500">{bulkStep === 'setup' ? 'Configure batch parameters' : `${bulkRows.length} rows generated for ${bulkData.dept} — Series ${bulkData.series}, Sec ${bulkData.section}`}</p>
              </div>
              <button onClick={() => { setShowBulkModal(false); setBulkStep('setup'); setBulkRows([]); }} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>

            {bulkStep === 'setup' ? (
              <form onSubmit={handleBulkGenerate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Department</label><select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={bulkData.dept} onChange={e => setBulkData({...bulkData, dept: e.target.value})}>{depts.filter(d => d !== 'All').map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                  <div><label className="block text-sm font-medium mb-1">Series</label><select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={bulkData.series} onChange={e => setBulkData({...bulkData, series: e.target.value})}><option value="">-- Select --</option>{defaultSeries.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Section</label><select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={bulkData.section} onChange={e => setBulkData({...bulkData, section: e.target.value})}>{sections.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div><label className="block text-sm font-medium mb-1">Total Students</label><input type="number" min="1" max="200" required placeholder="e.g. 60" className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={bulkData.count || ''} onChange={e => setBulkData({...bulkData, count: e.target.value})}/></div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded text-sm">
                   <p className="font-bold mb-1">Auto-Generation Rules:</p>
                   <ul className="list-disc pl-5 space-y-0.5">
                      <li>Roll ID: <strong className="font-mono">SeriesDeptCodeXXX</strong> (e.g. 2310060)</li>
                      <li>Email: <strong className="font-mono">ID@student.ruet.ac.bd</strong></li>
                   </ul>
                </div>

                <button type="submit" className="w-full flex items-center justify-center px-4 py-2.5 bg-green-600 text-white rounded hover:bg-green-700 font-medium">
                  <FileSpreadsheet size={18} className="mr-2"/> Generate Spreadsheet
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg max-h-[50vh] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-[#2d2d2d] sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-10">#</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Roll ID (auto)</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Student Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email (auto)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-100 dark:divide-gray-800">
                      {bulkRows.map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-1.5 text-xs text-gray-400 font-mono">{idx + 1}</td>
                          <td className="px-3 py-1.5 text-sm font-mono font-bold text-gray-900 dark:text-white">{row.roll}</td>
                          <td className="px-3 py-1.5">
                            <input
                              type="text"
                              placeholder="Enter name..."
                              value={row.name}
                              onChange={e => handleBulkRowChange(idx, 'name', e.target.value)}
                              className="w-full p-1 text-sm border border-gray-200 dark:border-gray-700 rounded bg-transparent dark:text-white outline-none focus:border-ruet-blue"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-sm font-mono text-ruet-blue dark:text-blue-400">{row.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button type="button" onClick={() => { setBulkStep('setup'); setBulkRows([]); }} className="px-4 py-2 border rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                    &larr; Back to Setup
                  </button>
                  <button type="button" onClick={handleBulkSubmitAll} className="px-5 py-2 bg-ruet-blue text-white rounded hover:bg-ruet-dark font-medium">
                    Save All {bulkRows.length} Students
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirm.open && confirm.type === 'delete'}
        title="Delete Student"
        message="Are you sure you want to delete this student? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirm({ open: false, type: '', id: null })}
      />
      <ConfirmDialog
        isOpen={confirm.open && (confirm.type === 'edit' || confirm.type === 'add')}
        title={confirm.type === 'edit' ? 'Confirm Edit' : 'Confirm Add'}
        message={confirm.type === 'edit' ? 'Are you sure you want to save changes to this student?' : 'Are you sure you want to add this student?'}
        confirmLabel="Save"
        variant="info"
        onConfirm={handleConfirmSave}
        onCancel={() => setConfirm({ open: false, type: '', id: null })}
      />
      <ConfirmDialog
        isOpen={confirm.open && confirm.type === 'bulk'}
        title="Confirm Bulk Add"
        message={`Are you sure you want to add ${bulkRows.length} students?`}
        confirmLabel="Save All"
        variant="info"
        onConfirm={handleBulkConfirm}
        onCancel={() => setConfirm({ open: false, type: '', id: null })}
      />
    </div>
  );
};

export default StudentInfo;
