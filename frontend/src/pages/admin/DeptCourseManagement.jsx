import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2, CheckCircle, Edit, AlertCircle, BarChart3, Loader2 } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import api from '../../utils/api';

const sectionOptions = ['N/A', 'A', 'B', 'C', 'D', 'E'];

const DeptCourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSeries, setSelectedSeries] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [assignedTeachers, setAssignedTeachers] = useState([]);
  const [currentTeacher, setCurrentTeacher] = useState('');
  const [coPoMapping, setCoPoMapping] = useState([{ co: 'CO1', po: [] }]);

  const [filterSection, setFilterSection] = useState('');
  const [confirm, setConfirm] = useState({ open: false, type: '', id: null });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cs, ts, inst] = await Promise.all([
        api.get('/courses'),
        api.get('/users?role=TEACHER'),
        api.get('/class-instances')
      ]);
      setCourses(cs);
      setTeachers(ts);
      setInstances(inst);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setSelectedCourse('');
    setSelectedSeries('');
    setSelectedSection('');
    setAssignedTeachers([]);
    setCurrentTeacher('');
    setCoPoMapping([{ co: 'CO1', po: [] }]);
  };

  const handleAddTeacher = () => {
    if (currentTeacher && !assignedTeachers.includes(currentTeacher)) {
      setAssignedTeachers([...assignedTeachers, currentTeacher]);
      setCurrentTeacher('');
    }
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (assignedTeachers.length === 0) return;
    setSaving(true);
    try {
      await api.post('/class-instances', {
        course: selectedCourse,
        teacher: assignedTeachers[0],
        series: parseInt(selectedSeries),
        section: selectedSection,
        status: 'Running',
        coPoMapping
      });
      await fetchData();
      setShowAssignModal(false);
      resetForm();
      setSuccessMsg('Course assigned successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkFinishedConfirm = async () => {
    try {
      await api.put(`/class-instances/${confirm.id}`, { status: 'Finished' });
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirm({ open: false, type: '', id: null });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.del(`/class-instances/${confirm.id}`);
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirm({ open: false, type: '', id: null });
    }
  };

  const filtered = filterSection ? instances.filter(i => i.section === filterSection) : instances;
  const isCascadeReady = selectedCourse && selectedSeries && selectedSection;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-ruet-blue" size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Course Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Assign teachers, manage running courses, and mark courses as finished.</p>
        </div>
        <button onClick={() => { resetForm(); setShowAssignModal(true); }} className="flex items-center px-4 py-2 bg-ruet-blue text-white rounded-md hover:bg-ruet-dark transition-colors font-medium">
          <Plus size={18} className="mr-2" /> Assign New Course
        </button>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded text-sm">{error}</div>}
      {successMsg && (
        <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm font-medium">
          <CheckCircle size={18} className="mr-2" /> {successMsg}
        </div>
      )}

      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg border border-gray-100 dark:border-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Running & Finished Courses</h3>
          <select value={filterSection} onChange={e => setFilterSection(e.target.value)} className="text-sm p-1.5 border border-gray-300 dark:border-gray-600 rounded bg-transparent dark:text-white outline-none">
            <option value="">All Sections</option>
            {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Course</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Series</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Section</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Teacher</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.length > 0 ? filtered.map(inst => (
                <tr key={inst._id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-bold text-ruet-blue dark:text-blue-400">{inst.course?.courseCode}</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">{inst.course?.courseName}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{inst.series}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">{inst.section}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full">{inst.teacher?.name}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className={`text-xs px-2 py-1 rounded font-semibold ${inst.status === 'Running' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                      {inst.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm space-x-2">
                    {inst.status === 'Running' && (
                      <button onClick={() => setConfirm({ open: true, type: 'finish', id: inst._id })} className="text-orange-500 hover:text-orange-700" title="Mark Finished"><CheckCircle size={18} /></button>
                    )}
                    <button onClick={() => setConfirm({ open: true, type: 'delete', id: inst._id })} className="text-red-500 hover:text-red-700" title="Delete"><Trash2 size={18} /></button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="px-4 py-8 text-center text-sm text-gray-500">No course instances found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-lg shadow-xl w-full max-w-lg p-6 border border-gray-200 dark:border-gray-800 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-5 border-b border-gray-200 dark:border-gray-800 pb-3">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Assign Teacher to Course</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmitAssignment} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Step 1: Select Course</label>
                <select required value={selectedCourse} onChange={e => { setSelectedCourse(e.target.value); setSelectedSeries(''); setSelectedSection(''); setAssignedTeachers([]); }}
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue">
                  <option value="">-- Choose Course --</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.courseCode} — {c.courseName}</option>)}
                </select>
              </div>

              <div className={!selectedCourse ? 'opacity-40 pointer-events-none' : ''}>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Step 2: Series & Section</label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" required placeholder="Series Year (e.g. 2021)" value={selectedSeries} onChange={e => setSelectedSeries(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue"/>
                  <select required value={selectedSection} onChange={e => setSelectedSection(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue">
                    <option value="">-- Section --</option>
                    {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className={!isCascadeReady ? 'opacity-40 pointer-events-none' : ''}>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Step 3: Assign Teacher</label>
                <div className="flex space-x-2">
                  <select value={currentTeacher} onChange={e => setCurrentTeacher(e.target.value)}
                    className="flex-1 p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue">
                    <option value="">-- Select Teacher --</option>
                    {teachers.filter(t => !assignedTeachers.includes(t._id)).map(t => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={handleAddTeacher} disabled={!currentTeacher}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-40 font-bold">
                    <Plus size={20} />
                  </button>
                </div>
                {assignedTeachers.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {assignedTeachers.map((tid, idx) => {
                      const t = teachers.find(t => t._id === tid);
                      return (
                        <div key={idx} className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md px-3 py-2">
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-300">{t?.name}</span>
                          <button type="button" onClick={() => setAssignedTeachers(assignedTeachers.filter(id => id !== tid))} className="text-red-500 hover:text-red-700"><X size={16} /></button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {isCascadeReady && assignedTeachers.length === 0 && (
                  <p className="mt-2 text-xs text-orange-500 flex items-center"><AlertCircle size={14} className="mr-1" /> At least one teacher must be assigned.</p>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-800">
                <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 border mr-2 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={!isCascadeReady || assignedTeachers.length === 0 || saving}
                  className="px-5 py-2 bg-ruet-blue text-white rounded-md hover:bg-ruet-dark font-medium disabled:opacity-40 transition-colors">
                  {saving ? 'Saving...' : 'Create & Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={confirm.open && confirm.type === 'delete'} title="Delete Course Instance" message="Are you sure you want to delete this course instance? This action cannot be undone." confirmLabel="Delete" onConfirm={handleDeleteConfirm} onCancel={() => setConfirm({ open: false, type: '', id: null })} />
      <ConfirmDialog isOpen={confirm.open && confirm.type === 'finish'} title="Mark as Finished" message="Are you sure you want to mark this course as finished?" confirmLabel="Mark Finished" variant="info" onConfirm={handleMarkFinishedConfirm} onCancel={() => setConfirm({ open: false, type: '', id: null })} />
    </div>
  );
};

export default DeptCourseManagement;
