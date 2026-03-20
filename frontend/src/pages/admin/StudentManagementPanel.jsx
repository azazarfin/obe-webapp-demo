import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, Building2, Edit, FileSpreadsheet, Filter, Loader2, Plus, Trash2, X } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import {
  departmentUsesSections,
  formatSectionLabel,
  getDepartmentById,
  getDepartmentSections,
  normalizeSectionValue
} from '../../utils/departmentUtils';

const SORT_OPTIONS = [
  { value: 'rollNumber-asc', label: 'ID (Ascending)' },
  { value: 'rollNumber-desc', label: 'ID (Descending)' },
  { value: 'name-asc', label: 'Name (Ascending)' },
  { value: 'name-desc', label: 'Name (Descending)' }
];

const emptyForm = {
  name: '',
  rollNumber: '',
  email: '',
  department: '',
  series: '',
  section: 'N/A'
};

const buildStudentEmail = (rollNumber) => (/^\d{7}$/.test(rollNumber) ? `${rollNumber}@student.ruet.ac.bd` : '');

const StudentManagementPanel = ({ departmentOnly = false }) => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [seriesList, setSeriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [bulkData, setBulkData] = useState({ department: '', series: '', section: 'N/A', count: 60 });
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkStep, setBulkStep] = useState('setup');
  const [bulkResult, setBulkResult] = useState(null);
  const [filterDept, setFilterDept] = useState('');
  const [filterSeries, setFilterSeries] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [sortOption, setSortOption] = useState(SORT_OPTIONS[0].value);
  const [confirm, setConfirm] = useState({ open: false, type: '', id: null });

  const lockedDepartmentId = departmentOnly ? (currentUser?.department?._id || '') : '';
  const activeFilterDepartmentId = departmentOnly ? lockedDepartmentId : filterDept;

  const selectedFilterDepartment = useMemo(
    () => getDepartmentById(departments, activeFilterDepartmentId),
    [departments, activeFilterDepartmentId]
  );
  const formDepartment = useMemo(
    () => getDepartmentById(departments, departmentOnly ? lockedDepartmentId : formData.department),
    [departments, departmentOnly, lockedDepartmentId, formData.department]
  );
  const bulkDepartment = useMemo(
    () => getDepartmentById(departments, departmentOnly ? lockedDepartmentId : bulkData.department),
    [departments, departmentOnly, lockedDepartmentId, bulkData.department]
  );

  const availableFilterSections = useMemo(() => {
    if (selectedFilterDepartment) {
      return getDepartmentSections(selectedFilterDepartment);
    }

    return Array.from(new Set(students.map((student) => student.section || 'N/A').filter(Boolean))).sort((left, right) => {
      if (left === 'N/A') return 1;
      if (right === 'N/A') return -1;
      return left.localeCompare(right);
    });
  }, [selectedFilterDepartment, students]);

  const showSectionFilter = selectedFilterDepartment
    ? departmentUsesSections(selectedFilterDepartment)
    : availableFilterSections.length > 0;

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const userEndpoint = lockedDepartmentId
        ? `/users?role=STUDENT&department=${lockedDepartmentId}`
        : '/users?role=STUDENT';

      const [departmentData, userData, seriesData] = await Promise.all([
        api.get('/departments'),
        api.get(userEndpoint),
        api.get('/series')
      ]);

      const nextDepartments = Array.isArray(departmentData) ? departmentData : [];
      const nextStudents = Array.isArray(userData) ? userData : [];
      const nextSeries = Array.isArray(seriesData) ? seriesData.map((series) => String(series.year)) : [];

      setDepartments(nextDepartments);
      setStudents(nextStudents);
      setSeriesList(Array.from(new Set([
        ...nextSeries,
        ...nextStudents.map((student) => String(student.series || '')).filter(Boolean)
      ])).sort());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!departmentOnly || currentUser) {
      fetchData();
    }
  }, [currentUser, departmentOnly]);

  useEffect(() => {
    if (!showSectionFilter && filterSection) {
      setFilterSection('');
    }
  }, [showSectionFilter, filterSection]);

  const filteredStudents = useMemo(() => {
    const [sortKey, sortDirection] = sortOption.split('-');
    return [...students]
      .filter((student) => (
        (!activeFilterDepartmentId || student.department?._id === activeFilterDepartmentId) &&
        (!filterSeries || String(student.series || '') === String(filterSeries)) &&
        (!filterSection || (student.section || 'N/A') === filterSection)
      ))
      .sort((left, right) => {
        const leftValue = sortKey === 'name' ? (left.name || '') : (left.rollNumber || '');
        const rightValue = sortKey === 'name' ? (right.name || '') : (right.rollNumber || '');
        const comparison = String(leftValue).localeCompare(String(rightValue), undefined, { numeric: true, sensitivity: 'base' });
        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [students, activeFilterDepartmentId, filterSeries, filterSection, sortOption]);

  const updateFormDepartment = (departmentId) => {
    const department = getDepartmentById(departments, departmentId);
    setFormData((prev) => ({
      ...prev,
      department: departmentId,
      section: normalizeSectionValue(department, prev.section)
    }));
  };

  const updateBulkDepartment = (departmentId) => {
    const department = getDepartmentById(departments, departmentId);
    setBulkData((prev) => ({
      ...prev,
      department: departmentId,
      section: normalizeSectionValue(department, prev.section)
    }));
  };

  const openAddModal = () => {
    const nextDepartmentId = departmentOnly ? lockedDepartmentId : (filterDept || departments[0]?._id || '');
    const department = getDepartmentById(departments, nextDepartmentId);
    setEditingId(null);
    setFormData({ ...emptyForm, department: nextDepartmentId, section: normalizeSectionValue(department, '') });
    setShowSingleModal(true);
  };

  const openEditModal = (student) => {
    const departmentId = student.department?._id || lockedDepartmentId || '';
    const department = getDepartmentById(departments, departmentId);
    setEditingId(student._id);
    setFormData({
      name: student.name || '',
      rollNumber: student.rollNumber || '',
      email: student.email || '',
      department: departmentId,
      series: String(student.series || ''),
      section: normalizeSectionValue(department, student.section || 'N/A')
    });
    setShowSingleModal(true);
  };

  const openBulkModal = () => {
    const nextDepartmentId = departmentOnly ? lockedDepartmentId : (filterDept || departments[0]?._id || '');
    const department = getDepartmentById(departments, nextDepartmentId);
    setBulkData({ department: nextDepartmentId, series: '', section: normalizeSectionValue(department, ''), count: 60 });
    setBulkRows([]);
    setBulkResult(null);
    setBulkStep('setup');
    setShowBulkModal(true);
  };

  const handleRollChange = (rollNumber) => {
    setFormData((prev) => ({
      ...prev,
      rollNumber,
      email: buildStudentEmail(rollNumber)
    }));
  };

  const handleSaveSingle = (event) => {
    event.preventDefault();
    setConfirm({ open: true, type: editingId ? 'edit' : 'add', id: editingId });
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    try {
      const departmentId = departmentOnly ? lockedDepartmentId : formData.department;
      const department = getDepartmentById(departments, departmentId);
      const payload = {
        name: formData.name.trim(),
        rollNumber: formData.rollNumber.trim(),
        email: buildStudentEmail(formData.rollNumber.trim()) || formData.email,
        role: 'STUDENT',
        department: departmentId,
        series: Number.parseInt(formData.series, 10) || undefined,
        section: normalizeSectionValue(department, formData.section)
      };

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

  const handleBulkGenerate = (event) => {
    event.preventDefault();
    const count = Number.parseInt(bulkData.count, 10) || 0;
    const rows = [];
    for (let index = 1; index <= count; index += 1) {
      const rollSuffix = String(index).padStart(3, '0');
      const seriesShort = String(bulkData.series || '').slice(2);
      const roll = `${seriesShort}00${rollSuffix}`;
      rows.push({ roll, name: '', email: `${roll}@student.ruet.ac.bd` });
    }
    setBulkRows(rows);
    setBulkStep('sheet');
  };

  const handleBulkConfirm = async () => {
    setSaving(true);
    try {
      const departmentId = departmentOnly ? lockedDepartmentId : bulkData.department;
      const department = getDepartmentById(departments, departmentId);
      const payload = {
        students: bulkRows.map((row) => ({
          name: row.name || `Student ${row.roll}`,
          email: row.email,
          rollNumber: row.roll,
          department: departmentId,
          series: Number.parseInt(bulkData.series, 10) || undefined,
          section: normalizeSectionValue(department, bulkData.section)
        }))
      };

      const result = await api.post('/users/bulk', payload);
      setBulkResult(result);
      await fetchData();
      setBulkStep('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
      setConfirm({ open: false, type: '', id: null });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-ruet-blue" size={32} /></div>;
  }

  return (
    <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {departmentOnly ? `Student Info - ${currentUser?.department?.shortName || currentUser?.department?.name || 'Department'}` : 'Student Info'}
          </h2>

          <div className="flex flex-wrap gap-2 text-sm">
            {!departmentOnly && (
              <div className="flex items-center bg-gray-100 dark:bg-[#2d2d2d] rounded px-2 py-1">
                <Filter size={14} className="mr-2 text-gray-500" />
                <select value={filterDept} onChange={(event) => setFilterDept(event.target.value)} className="bg-transparent border-none outline-none dark:text-white">
                  <option value="">All Departments</option>
                  {departments.map((department) => (
                    <option key={department._id} value={department._id}>{department.shortName}</option>
                  ))}
                </select>
              </div>
            )}

            {departmentOnly && currentUser?.department && (
              <div className="flex items-center bg-gray-100 dark:bg-[#2d2d2d] rounded px-3 py-1">
                <Building2 size={14} className="mr-2 text-gray-500" />
                <span className="font-medium text-gray-700 dark:text-gray-300">{currentUser.department.shortName}</span>
              </div>
            )}

            <div className="flex items-center bg-gray-100 dark:bg-[#2d2d2d] rounded px-2 py-1">
              <select value={filterSeries} onChange={(event) => setFilterSeries(event.target.value)} className="bg-transparent border-none outline-none dark:text-white">
                <option value="">All Series</option>
                {seriesList.map((series) => (
                  <option key={series} value={series}>Series {series}</option>
                ))}
              </select>
            </div>

            {showSectionFilter && (
              <div className="flex items-center bg-gray-100 dark:bg-[#2d2d2d] rounded px-2 py-1">
                <select value={filterSection} onChange={(event) => setFilterSection(event.target.value)} className="bg-transparent border-none outline-none dark:text-white">
                  <option value="">All Sections</option>
                  {availableFilterSections.map((section) => (
                    <option key={section} value={section}>{section === 'N/A' ? 'No Section' : `Section ${section}`}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center bg-gray-100 dark:bg-[#2d2d2d] rounded px-2 py-1">
              <ArrowUpDown size={14} className="mr-2 text-gray-500" />
              <select value={sortOption} onChange={(event) => setSortOption(event.target.value)} className="bg-transparent border-none outline-none dark:text-white">
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={openBulkModal} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium text-sm">
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
              {!departmentOnly && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Department</th>}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Series / Section</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
            {filteredStudents.length > 0 ? filteredStudents.map((student) => (
              <tr key={student._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white font-mono">{student.rollNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                  <span className="block font-medium">{student.name}</span>
                  <span className="text-xs text-ruet-blue dark:text-blue-400">{student.email}</span>
                </td>
                {!departmentOnly && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">{student.department?.shortName}</td>}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {student.series || 'N/A'} <span className="mx-2 text-gray-300">|</span> <span className="font-bold text-gray-700 dark:text-gray-300">{formatSectionLabel(student.section)}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openEditModal(student)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3"><Edit size={18} /></button>
                  <button onClick={() => setConfirm({ open: true, type: 'delete', id: student._id })} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={departmentOnly ? 4 : 5} className="px-6 py-8 text-center text-sm text-gray-500">No students found matching the current filters.</td>
              </tr>
            )}
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
              <div>
                <label className="block text-sm font-medium mb-1">Student Name</label>
                <input required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.name} onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {!departmentOnly ? (
                  <div>
                    <label className="block text-sm font-medium mb-1">Department</label>
                    <select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.department} onChange={(event) => updateFormDepartment(event.target.value)}>
                      <option value="">Select...</option>
                      {departments.map((department) => (
                        <option key={department._id} value={department._id}>{department.shortName}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-1">Department</label>
                    <div className="w-full p-2 border rounded bg-gray-50 dark:bg-[#252525] dark:border-gray-700 text-gray-700 dark:text-gray-300">{currentUser?.department?.shortName || 'Department'}</div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Series (Year)</label>
                  <input type="number" required placeholder="e.g. 2021" className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.series} onChange={(event) => setFormData((prev) => ({ ...prev, series: event.target.value }))} />
                </div>
              </div>

              <div className={`grid gap-4 ${departmentUsesSections(formDepartment) ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {departmentUsesSections(formDepartment) && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Section</label>
                    <select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={formData.section} onChange={(event) => setFormData((prev) => ({ ...prev, section: event.target.value }))}>
                      {getDepartmentSections(formDepartment).map((section) => (
                        <option key={section} value={section}>{section}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Roll / ID</label>
                  <input type="text" pattern="^\\d{7}$" required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue font-mono" value={formData.rollNumber} onChange={(event) => handleRollChange(event.target.value)} placeholder="7-digit ID" />
                </div>
              </div>

              {!departmentUsesSections(formDepartment) && <p className="text-xs text-gray-500 dark:text-gray-400">This department does not use sections. Students will be saved without a section.</p>}

              <div>
                <label className="block text-sm font-medium mb-1">Email (auto)</label>
                <input type="email" readOnly className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none bg-gray-50 dark:bg-[#252525] font-mono text-gray-500" value={formData.email} />
              </div>

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
          <div className={`bg-white dark:bg-[#1e1e1e] rounded-lg shadow-xl ${bulkStep === 'sheet' ? 'w-full max-w-3xl' : 'w-full max-w-lg'} p-6 border border-gray-200 dark:border-gray-800 overflow-y-auto max-h-[90vh]`}>
            <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{bulkStep === 'done' ? 'Bulk Add - Done' : bulkStep === 'sheet' ? 'Bulk Add - Spreadsheet' : 'Bulk Add - Setup'}</h3>
              <button onClick={() => { setShowBulkModal(false); setBulkStep('setup'); setBulkRows([]); }} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>

            {bulkStep === 'done' ? (
              <div className="text-center py-6">
                <p className="text-green-600 dark:text-green-400 font-bold text-lg mb-2">{bulkResult?.created || 0} students added successfully.</p>
                {bulkResult?.errors > 0 && <p className="text-amber-600 text-sm">{bulkResult.errors} entries had errors.</p>}
                <button onClick={() => { setShowBulkModal(false); setBulkStep('setup'); setBulkRows([]); }} className="mt-4 px-6 py-2 bg-ruet-blue text-white rounded hover:bg-ruet-dark font-medium">Close</button>
              </div>
            ) : bulkStep === 'setup' ? (
              <form onSubmit={handleBulkGenerate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {!departmentOnly ? (
                    <div>
                      <label className="block text-sm font-medium mb-1">Department</label>
                      <select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={bulkData.department} onChange={(event) => updateBulkDepartment(event.target.value)}>
                        <option value="">Select...</option>
                        {departments.map((department) => (
                          <option key={department._id} value={department._id}>{department.shortName}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium mb-1">Department</label>
                      <div className="w-full p-2 border rounded bg-gray-50 dark:bg-[#252525] dark:border-gray-700 text-gray-700 dark:text-gray-300">{currentUser?.department?.shortName || 'Department'}</div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">Series (Year)</label>
                    <input type="number" required placeholder="e.g. 2021" className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={bulkData.series} onChange={(event) => setBulkData((prev) => ({ ...prev, series: event.target.value }))} />
                  </div>
                </div>

                <div className={`grid gap-4 ${departmentUsesSections(bulkDepartment) ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {departmentUsesSections(bulkDepartment) && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Section</label>
                      <select required className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={bulkData.section} onChange={(event) => setBulkData((prev) => ({ ...prev, section: event.target.value }))}>
                        {getDepartmentSections(bulkDepartment).map((section) => (
                          <option key={section} value={section}>{section}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">Total Students</label>
                    <input type="number" min="1" max="200" required placeholder="e.g. 60" className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue" value={bulkData.count || ''} onChange={(event) => setBulkData((prev) => ({ ...prev, count: event.target.value }))} />
                  </div>
                </div>

                {!departmentUsesSections(bulkDepartment) && <p className="text-xs text-gray-500 dark:text-gray-400">This department does not use sections. Bulk added students will be saved without a section.</p>}

                <button type="submit" className="w-full flex items-center justify-center px-4 py-2.5 bg-green-600 text-white rounded hover:bg-green-700 font-medium">
                  <FileSpreadsheet size={18} className="mr-2" /> Generate Spreadsheet
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
                      {bulkRows.map((row, index) => (
                        <tr key={row.roll}>
                          <td className="px-3 py-1.5 text-xs text-gray-400 font-mono">{index + 1}</td>
                          <td className="px-3 py-1.5 text-sm font-mono font-bold text-gray-900 dark:text-white">{row.roll}</td>
                          <td className="px-3 py-1.5">
                            <input type="text" placeholder="Name..." value={row.name} onChange={(event) => {
                              const nextRows = [...bulkRows];
                              nextRows[index] = { ...nextRows[index], name: event.target.value };
                              setBulkRows(nextRows);
                            }} className="w-full p-1 text-sm border border-gray-200 dark:border-gray-700 rounded bg-transparent dark:text-white outline-none focus:border-ruet-blue" />
                          </td>
                          <td className="px-3 py-1.5 text-sm font-mono text-ruet-blue dark:text-blue-400">{row.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button onClick={() => { setBulkStep('setup'); setBulkRows([]); }} className="px-4 py-2 border rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">Back</button>
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

export default StudentManagementPanel;
