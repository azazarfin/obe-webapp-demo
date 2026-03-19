import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Filter, FileSpreadsheet, Loader2 } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import api from '../../utils/api';

const sections = ['N/A', 'A', 'B', 'C', 'D', 'E'];
const emptyForm = { name: '', rollNumber: '', email: '', department: '', series: '', section: 'A' };

const StudentInfo = () => {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [showSingleModal, setShowSingleModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkData, setBulkData] = useState({ department: '', series: '', section: 'A', count: 0 });
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkStep, setBulkStep] = useState('setup');
  const [bulkResult, setBulkResult] = useState(null);

  const [filterDept, setFilterDept] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [confirm, setConfirm] = useState({ open: false, type: '', id: null });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [depts, users] = await Promise.all([
        api.get('/departments'),
        api.get('/users?role=STUDENT')
      ]);
      setDepartments(depts);
      setStudents(users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = students.filter(s =>
    (!filterDept || s.department?._id === filterDept) &&
    (!filterSection || s.section === filterSection)
  );

  const handleRollChange = (rollNumber) => {
    const email = /^\d{7}$/.test(rollNumber) ? `${rollNumber}@student.ruet.ac.bd` : '';
    setFormData({ ...formData, rollNumber, email });
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ ...emptyForm, department: filterDept || departments[0]?._id || '' });
    setShowSingleModal(true);
  };

  const openEditModal = (student) => {
    setEditingId(student._id);
    setFormData({ name: student.name, rollNumber: student.rollNumber, email: student.email, department: student.department?._id || '', series: String(student.series || ''), section: student.section || 'A' });
    setShowSingleModal(true);
  };

  const handleSaveSingle = (e) => {
    e.preventDefault();
    setConfirm({ open: true, type: editingId ? 'edit' : 'add', id: editingId });
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    try {
      const payload = { ...formData, role: 'STUDENT', series: parseInt(formData.series) || undefined };
      if (editingId) {
        await api.put(`/users/${editingId}`, payload);
      } else {
        await api.post('/users', payload);
      }
      await fetchData();
      setShowSingleModal(false);
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

  const handleBulkGenerate = (e) => {
    e.preventDefault();
    const rows = [];
    const deptObj = departments.find(d => d._id === bulkData.department);
    const count = parseInt(bulkData.count) || 0;
    for (let i = 1; i <= count; i++) {
      const rollNum = String(i).padStart(3, '0');
      const seriesShort = String(bulkData.series || '').slice(2);
      const roll = `${seriesShort}${'00'}${rollNum}`;
      rows.push({ roll, name: '', email: `${roll}@student.ruet.ac.bd` });
    }
    setBulkRows(rows);
    setBulkStep('sheet');
  };

  const handleBulkConfirm = async () => {
    setSaving(true);
    try {
      const payload = { students: bulkRows.map(row => ({
        name: row.name || `Student ${row.roll}`,
        email: row.email,
        rollNumber: row.roll,
        department: bulkData.department,
        series: parseInt(bulkData.series) || undefined,
        section: bulkData.section,
      }))};
      const result = await api.post('/users/bulk', payload);
      setBulkResult(result);
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
      setConfirm({ open: false, type: '', id: null });
      setBulkStep('done');
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-ruet-blue" size={32} /></div>;

  return (
    <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Student Info</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            <div className="flex items-center bg-gray-100 dark:bg-[#2d2d2d] rounded px-2 py-1">
              <Filter size={14} className="mr-2 text-gray-500"/>
              <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="bg-transparent border-none outline-none dark:text-white">
                <option value="">All Depts</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.shortName}</option>)}
              </select>
            </div>
            <div className="flex items-center bg-gray-100 dark:bg-[#2d2d2d] rounded px-2 py-1">
              <select value={filterSection} onChange={e => setFilterSection(e.target.value)} className="bg-transparent border-none outline-none dark:text-white">
                <option value="">All Sections</option>
                {sections.map(s => <option key={s} value={s}>Sec: {s}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => { setBulkData({ department: filterDept || departments[0]?._id || '', series: '', section: 'A', count: 60 }); setBulkStep('setup'); setBulkResult(null); setShowBulkModal(true); }} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium text-sm">
            <FileSpreadsheet size={16} className="mr-2" /> Bulk Add
          </button>
          <button onClick={openAddModal} className="flex items-center px-4 py-2 bg-ruet-blue text-white rounded-md hover:bg-ruet-dark transition-colors font-medium text-sm">
            <Plus size={16} className="mr-2" /> Add Student
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded mb-4 text-sm">{error}</div>}

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
            {filtered.length > 0 ? filtered.map((student) => (
              <tr key={student._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white font-mono">{student.rollNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                  <span className="block font-medium">{student.name}</span>
                  <span className="text-xs text-ruet-blue dark:text-blue-400">{student.email}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">{student.department?.shortName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {student.series} <span className="mx-2 text-gray-300">|</span> <span className="font-bold text-gray-700 dark:text-gray-300">{student.section}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openEditModal(student)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3"><Edit size={18} /></button>
                  <button onClick={() => setConfirm({ open: true, type: 'delete', id: student._id })} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
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
              <div><label className="block text-sm font-medium mb-1">Student Name</label><input required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" onChange={e => setFormData({...formData, name: e.target.value})} value={formData.name} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Department</label><select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}><option value="">Select...</option>{departments.map(d => <option key={d._id} value={d._id}>{d.shortName}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1">Series (Year)</label><input type="number" required placeholder="e.g. 2021" className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.series} onChange={e => setFormData({...formData, series: e.target.value})}/></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Section</label><select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})}>{sections.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1">Roll / ID</label><input type="text" pattern="^\d{7}$" required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue font-mono" onChange={e => handleRollChange(e.target.value)} value={formData.rollNumber} placeholder="7-digit ID"/></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Email (auto)</label><input type="email" readOnly className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none bg-gray-50 dark:bg-[#252525] font-mono text-gray-500" value={formData.email} /></div>
              {!editingId && <p className="text-xs text-gray-500">Default password: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">123456</code></p>}
              <div className="flex justify-end pt-2">
                <button type="button" onClick={() => setShowSingleModal(false)} className="px-4 py-2 border mr-2 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-ruet-blue text-white rounded hover:bg-ruet-dark font-medium disabled:opacity-60">{saving ? 'Saving...' : (editingId ? 'Save Changes' : 'Save Student')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`bg-white dark:bg-[#1e1e1e] rounded-lg shadow-xl ${bulkStep === 'sheet' ? 'w-full max-w-3xl' : 'w-full max-w-lg'} p-6 border border-gray-200 dark:border-gray-800 text-left overflow-y-auto max-h-[90vh]`}>
            <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{bulkStep === 'done' ? 'Bulk Add — Done' : bulkStep === 'sheet' ? 'Bulk Add — Spreadsheet' : 'Bulk Add — Setup'}</h3>
              <button onClick={() => { setShowBulkModal(false); setBulkStep('setup'); setBulkRows([]); }} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>

            {bulkStep === 'done' ? (
              <div className="text-center py-6">
                <p className="text-green-600 dark:text-green-400 font-bold text-lg mb-2">✓ {bulkResult?.created} students added successfully.</p>
                {bulkResult?.errors > 0 && <p className="text-amber-600 text-sm">{bulkResult.errors} entries had errors (likely duplicate emails).</p>}
                <button onClick={() => { setShowBulkModal(false); setBulkStep('setup'); setBulkRows([]); }} className="mt-4 px-6 py-2 bg-ruet-blue text-white rounded hover:bg-ruet-dark font-medium">Close</button>
              </div>
            ) : bulkStep === 'setup' ? (
              <form onSubmit={handleBulkGenerate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Department</label><select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={bulkData.department} onChange={e => setBulkData({...bulkData, department: e.target.value})}><option value="">Select...</option>{departments.map(d => <option key={d._id} value={d._id}>{d.shortName}</option>)}</select></div>
                  <div><label className="block text-sm font-medium mb-1">Series (Year)</label><input type="number" required placeholder="e.g. 2021" className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={bulkData.series} onChange={e => setBulkData({...bulkData, series: e.target.value})}/></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Section</label><select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={bulkData.section} onChange={e => setBulkData({...bulkData, section: e.target.value})}>{sections.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div><label className="block text-sm font-medium mb-1">Total Students</label><input type="number" min="1" max="200" required placeholder="e.g. 60" className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={bulkData.count || ''} onChange={e => setBulkData({...bulkData, count: e.target.value})}/></div>
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
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-10">#</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Roll (auto)</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email (auto)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-100 dark:divide-gray-800">
                      {bulkRows.map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-1.5 text-xs text-gray-400 font-mono">{idx + 1}</td>
                          <td className="px-3 py-1.5 text-sm font-mono font-bold text-gray-900 dark:text-white">{row.roll}</td>
                          <td className="px-3 py-1.5"><input type="text" placeholder="Name..." value={row.name} onChange={e => { const u = [...bulkRows]; u[idx] = {...u[idx], name: e.target.value}; setBulkRows(u); }} className="w-full p-1 text-sm border border-gray-200 dark:border-gray-700 rounded bg-transparent dark:text-white outline-none focus:border-ruet-blue"/></td>
                          <td className="px-3 py-1.5 text-sm font-mono text-ruet-blue dark:text-blue-400">{row.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <button onClick={() => { setBulkStep('setup'); setBulkRows([]); }} className="px-4 py-2 border rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">← Back</button>
                  <button onClick={() => setConfirm({ open: true, type: 'bulk', id: null })} disabled={saving} className="px-5 py-2 bg-ruet-blue text-white rounded hover:bg-ruet-dark font-medium disabled:opacity-60">{saving ? 'Saving...' : `Save All ${bulkRows.length} Students`}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={confirm.open && confirm.type === 'delete'} title="Delete Student" message="Are you sure you want to delete this student? This action cannot be undone." confirmLabel="Delete" onConfirm={handleDeleteConfirm} onCancel={() => setConfirm({ open: false, type: '', id: null })} />
      <ConfirmDialog isOpen={confirm.open && (confirm.type === 'edit' || confirm.type === 'add')} title={confirm.type === 'edit' ? 'Confirm Edit' : 'Confirm Add'} message={confirm.type === 'edit' ? 'Save changes to this student?' : 'Add this student?'} confirmLabel="Save" variant="info" onConfirm={handleConfirmSave} onCancel={() => setConfirm({ open: false, type: '', id: null })} />
      <ConfirmDialog isOpen={confirm.open && confirm.type === 'bulk'} title="Confirm Bulk Add" message={`Add ${bulkRows.length} students? Default password is 123456.`} confirmLabel="Save All" variant="info" onConfirm={handleBulkConfirm} onCancel={() => setConfirm({ open: false, type: '', id: null })} />
    </div>
  );
};

export default StudentInfo;
