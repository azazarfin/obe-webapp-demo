import React, { useState } from 'react';
import { Plus, X, Trash2, CheckCircle, Edit, AlertCircle } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import { defaultSeries } from './SeriesManagement';

const mockCourses = [
  { id: 1, code: 'CSE 3101', name: 'Database Systems', type: 'Theory' },
  { id: 2, code: 'CSE 3102', name: 'Database Systems Lab', type: 'Sessional' },
  { id: 3, code: 'CSE 2101', name: 'Data Structures', type: 'Theory' },
];

const mockTeachers = [
  { id: 1, name: 'Dr. John Doe' },
  { id: 2, name: 'Jane Smith' },
  { id: 3, name: 'Dr. Alan Turing' },
  { id: 4, name: 'Prof. Ada Lovelace' },
];

const mockRunningCourses = [
  { id: 1, code: 'CSE 3101', name: 'Database Systems', series: '2021', section: 'A', teachers: ['Dr. John Doe'], status: 'running' },
  { id: 2, code: 'CSE 3102', name: 'Database Systems Lab', series: '2021', section: 'A', teachers: ['Jane Smith', 'Dr. Alan Turing'], status: 'running' },
  { id: 3, code: 'CSE 2101', name: 'Data Structures', series: '2022', section: 'N/A', teachers: ['Prof. Ada Lovelace'], status: 'finished' },
];

const sectionOptions = ['N/A', 'A', 'B', 'C', 'D', 'E'];

const DeptCourseManagement = () => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [runningCourses, setRunningCourses] = useState(mockRunningCourses);
  const [successMsg, setSuccessMsg] = useState('');

  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSeries, setSelectedSeries] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [assignedTeachers, setAssignedTeachers] = useState([]);
  const [currentTeacher, setCurrentTeacher] = useState('');

  const [filterSection, setFilterSection] = useState('All');
  const [confirm, setConfirm] = useState({ open: false, type: '', id: null });

  const resetForm = () => {
    setSelectedCourse('');
    setSelectedSeries('');
    setSelectedSection('');
    setAssignedTeachers([]);
    setCurrentTeacher('');
  };

  const handleAddTeacher = () => {
    if (currentTeacher && !assignedTeachers.includes(currentTeacher)) {
      setAssignedTeachers([...assignedTeachers, currentTeacher]);
      setCurrentTeacher('');
    }
  };

  const handleRemoveTeacher = (name) => {
    setAssignedTeachers(assignedTeachers.filter(t => t !== name));
  };

  const handleSubmitAssignment = (e) => {
    e.preventDefault();
    if (assignedTeachers.length === 0) return;

    const courseName = mockCourses.find(c => c.code === selectedCourse)?.name || '';
    setRunningCourses([...runningCourses, {
      id: Date.now(),
      code: selectedCourse,
      name: courseName,
      series: selectedSeries,
      section: selectedSection,
      teachers: [...assignedTeachers],
      status: 'running'
    }]);
    setShowAssignModal(false);
    resetForm();
    setSuccessMsg('Course assigned successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleMarkFinishedClick = (id) => {
    setConfirm({ open: true, type: 'finish', id });
  };

  const handleMarkFinishedConfirm = () => {
    setRunningCourses(runningCourses.map(c => c.id === confirm.id ? { ...c, status: 'finished' } : c));
    setConfirm({ open: false, type: '', id: null });
  };

  const handleDeleteClick = (id) => {
    setConfirm({ open: true, type: 'delete', id });
  };

  const handleDeleteConfirm = () => {
    setRunningCourses(runningCourses.filter(c => c.id !== confirm.id));
    setConfirm({ open: false, type: '', id: null });
  };

  const filteredRunning = runningCourses.filter(c =>
    filterSection === 'All' || c.section === filterSection
  );

  const isCascadeReady = selectedCourse && selectedSeries && selectedSection;

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

      {successMsg && (
        <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm font-medium">
          <CheckCircle size={18} className="mr-2" /> {successMsg}
        </div>
      )}

      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg border border-gray-100 dark:border-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Running & Finished Courses</h3>
          <select value={filterSection} onChange={e => setFilterSection(e.target.value)} className="text-sm p-1.5 border border-gray-300 dark:border-gray-600 rounded bg-transparent dark:text-white outline-none">
            <option value="All" className="dark:bg-gray-800">All Sections</option>
            {sectionOptions.map(s => <option key={s} value={s} className="dark:bg-gray-800">{s}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Course</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Series</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Section</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Assigned Teachers</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRunning.length > 0 ? filteredRunning.map(course => (
                <tr key={course.id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-bold text-ruet-blue dark:text-blue-400">{course.code}</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">{course.name}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{course.series}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">{course.section}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex flex-wrap gap-1">
                      {course.teachers.map((t, i) => (
                        <span key={i} className="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className={`text-xs px-2 py-1 rounded font-semibold ${course.status === 'running' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                      {course.status === 'running' ? 'Running' : 'Finished'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm space-x-2">
                    {course.status === 'running' && (
                      <button onClick={() => handleMarkFinishedClick(course.id)} className="text-orange-500 hover:text-orange-700" title="Mark Finished">
                        <CheckCircle size={18} />
                      </button>
                    )}
                    <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400" title="Edit"><Edit size={18} /></button>
                    <button onClick={() => handleDeleteClick(course.id)} className="text-red-500 hover:text-red-700" title="Delete"><Trash2 size={18} /></button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="px-4 py-8 text-center text-sm text-gray-500">No courses found.</td></tr>
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
                <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">
                  Step 1: Select Course Code
                </label>
                <select required value={selectedCourse} onChange={e => { setSelectedCourse(e.target.value); setSelectedSeries(''); setSelectedSection(''); setAssignedTeachers([]); }}
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue">
                  <option value="" className="dark:bg-gray-800">-- Choose Course --</option>
                  {mockCourses.map(c => <option key={c.id} value={c.code} className="dark:bg-gray-800">{c.code} — {c.name}</option>)}
                </select>
              </div>

              <div className={!selectedCourse ? 'opacity-40 pointer-events-none' : ''}>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">
                  Step 2: Select Series
                </label>
                <select required value={selectedSeries} onChange={e => { setSelectedSeries(e.target.value); setSelectedSection(''); setAssignedTeachers([]); }}
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue">
                  <option value="" className="dark:bg-gray-800">-- Choose Series --</option>
                  {defaultSeries.map(s => <option key={s} value={s} className="dark:bg-gray-800">{s}</option>)}
                </select>
              </div>

              <div className={!selectedSeries ? 'opacity-40 pointer-events-none' : ''}>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">
                  Step 3: Select Section
                </label>
                <select required value={selectedSection} onChange={e => { setSelectedSection(e.target.value); setAssignedTeachers([]); }}
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue">
                  <option value="" className="dark:bg-gray-800">-- Choose Section --</option>
                  {sectionOptions.map(s => <option key={s} value={s} className="dark:bg-gray-800">{s}</option>)}
                </select>
              </div>

              <div className={!isCascadeReady ? 'opacity-40 pointer-events-none' : ''}>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">
                  Step 4: Assign Teacher(s)
                </label>
                <div className="flex space-x-2">
                  <select value={currentTeacher} onChange={e => setCurrentTeacher(e.target.value)}
                    className="flex-1 p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue">
                    <option value="" className="dark:bg-gray-800">-- Select Teacher --</option>
                    {mockTeachers.filter(t => !assignedTeachers.includes(t.name)).map(t => (
                      <option key={t.id} value={t.name} className="dark:bg-gray-800">{t.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={handleAddTeacher} disabled={!currentTeacher}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-lg">
                    <Plus size={20} />
                  </button>
                </div>

                {assignedTeachers.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {assignedTeachers.map((teacher, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md px-3 py-2">
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-300">{teacher}</span>
                        <button type="button" onClick={() => handleRemoveTeacher(teacher)} className="text-red-500 hover:text-red-700">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {isCascadeReady && assignedTeachers.length === 0 && (
                  <p className="mt-2 text-xs text-orange-500 flex items-center"><AlertCircle size={14} className="mr-1" /> At least one teacher must be assigned.</p>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-800">
                <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 border mr-2 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={!isCascadeReady || assignedTeachers.length === 0}
                  className="px-5 py-2 bg-ruet-blue text-white rounded-md hover:bg-ruet-dark font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Create & Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirm.open && confirm.type === 'delete'}
        title="Delete Course Instance"
        message="Are you sure you want to delete this course instance? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirm({ open: false, type: '', id: null })}
      />
      <ConfirmDialog
        isOpen={confirm.open && confirm.type === 'finish'}
        title="Mark as Finished"
        message="Are you sure you want to mark this course as finished? This will finalize grades and reports."
        confirmLabel="Mark Finished"
        variant="info"
        onConfirm={handleMarkFinishedConfirm}
        onCancel={() => setConfirm({ open: false, type: '', id: null })}
      />
    </div>
  );
};

export default DeptCourseManagement;
