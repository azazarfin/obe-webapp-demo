import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, GraduationCap, X, Check, ChevronDown } from 'lucide-react';
import {
  useGetCourseAdvisorsQuery,
  useCreateCourseAdvisorMutation,
  useUpdateCourseAdvisorMutation,
  useDeleteCourseAdvisorMutation,
} from '../../store/slices/courseAdvisorSlice';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  departmentUsesSections,
  getDepartmentSections,
  normalizeSectionValue,
} from '../../utils/departmentUtils';

// ─── Searchable Multi-Teacher Picker ───────────────────────────
const TeacherMultiPicker = ({ teachers, loading, selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return teachers;
    const q = query.toLowerCase();
    return teachers.filter(t => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q));
  }, [teachers, query]);

  const toggle = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange(next);
  };

  const selectedTeachers = teachers.filter(t => selected.has(t._id));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(p => !p); setQuery(''); }}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#151b2e] text-left text-sm transition-all focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 min-h-[42px]"
      >
        {loading ? (
          <span className="text-gray-400">Loading teachers...</span>
        ) : selected.size > 0 ? (
          <div className="flex flex-wrap gap-1.5 min-w-0">
            {selectedTeachers.slice(0, 3).map(t => (
              <span key={t._id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-medium">
                {t.name.split(' ')[0]}
                <button type="button" onClick={(e) => { e.stopPropagation(); toggle(t._id); }} className="hover:text-red-500"><X size={12} /></button>
              </span>
            ))}
            {selected.size > 3 && <span className="text-xs text-gray-500 self-center">+{selected.size - 3} more</span>}
          </div>
        ) : (
          <span className="text-gray-400">Search and select teachers...</span>
        )}
        <ChevronDown size={16} className={`text-gray-400 flex-shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
          <div className="p-2 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input autoFocus type="text" placeholder="Search by name or email..." value={query} onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#151b2e] text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
          </div>
          <div className="pb-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">No teachers found</div>
            ) : filtered.map(t => {
              const checked = selected.has(t._id);
              return (
                <button key={t._id} type="button" onClick={() => toggle(t._id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${checked ? 'bg-blue-50 dark:bg-blue-500/10' : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'}`}>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600'}`}>
                    {checked && <Check size={13} className="text-white" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium text-sm ${checked ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>{t.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.email}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Single Teacher Picker (for Edit mode) ─────────────────────
const TeacherSinglePicker = ({ teachers, loading, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  const selected = teachers.find(t => t._id === value);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return teachers;
    const q = query.toLowerCase();
    return teachers.filter(t => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q));
  }, [teachers, query]);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => { setOpen(p => !p); setQuery(''); }}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#151b2e] text-left text-sm transition-all focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
        {loading ? <span className="text-gray-400">Loading...</span> : selected ? (
          <span className="text-gray-900 dark:text-white font-medium truncate">{selected.name}</span>
        ) : <span className="text-gray-400">Select a teacher...</span>}
        <ChevronDown size={16} className={`text-gray-400 flex-shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
          <div className="p-2 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input autoFocus type="text" placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#151b2e] text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-blue-500/30" />
            </div>
          </div>
          <div className="pb-1">
            {filtered.length === 0 ? <div className="px-4 py-6 text-center text-sm text-gray-400">No teachers found</div> : filtered.map(t => (
              <button key={t._id} type="button" onClick={() => { onChange(t._id); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${t._id === value ? 'bg-blue-50 dark:bg-blue-500/10' : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'}`}>
                <div className="min-w-0 flex-1">
                  <p className={`font-medium text-sm ${t._id === value ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>{t.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.email}</p>
                </div>
                {t._id === value && <Check size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────
const ManageCourseAdvisors = () => {
  const { currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdvisor, setEditingAdvisor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [advisorToDelete, setAdvisorToDelete] = useState(null);

  // Form State
  const [selectedTeachers, setSelectedTeachers] = useState(new Set());
  const [singleTeacher, setSingleTeacher] = useState('');
  const [series, setSeries] = useState('');
  const [section, setSection] = useState('');
  const [formError, setFormError] = useState('');

  // Teachers & department data
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [seriesList, setSeriesList] = useState([]);
  const [department, setDepartment] = useState(null);

  const { data: advisors = [], isLoading } = useGetCourseAdvisorsQuery();
  const [createAdvisor, { isLoading: isCreating }] = useCreateCourseAdvisorMutation();
  const [updateAdvisor, { isLoading: isUpdating }] = useUpdateCourseAdvisorMutation();
  const [deleteAdvisor, { isLoading: isDeleting }] = useDeleteCourseAdvisorMutation();

  const deptId = currentUser?.department?._id || currentUser?.department;
  const hasSections = departmentUsesSections(department);
  const sectionOptions = getDepartmentSections(department);

  useEffect(() => {
    if (isModalOpen && deptId) {
      fetchData();
    }
  }, [isModalOpen, deptId]);

  const fetchData = async () => {
    try {
      setLoadingTeachers(true);
      const [teacherRes, deptRes, seriesRes] = await Promise.all([
        api.get(`/users?role=TEACHER&activeOnly=true&department=${deptId}`),
        api.get(`/departments`),
        api.get('/series'),
      ]);
      setTeachers(teacherRes || []);
      const dept = (deptRes || []).find(d => d._id === deptId);
      setDepartment(dept || null);
      setSeriesList((seriesRes || []).map(s => String(s.year)).sort((a, b) => b - a));
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const filteredAdvisors = useMemo(() => {
    if (!searchQuery.trim()) return advisors;
    const q = searchQuery.toLowerCase();
    return advisors.filter(a =>
      a.teacher?.name?.toLowerCase().includes(q) ||
      a.teacher?.email?.toLowerCase().includes(q) ||
      a.section?.toLowerCase().includes(q) ||
      String(a.series).includes(q)
    );
  }, [advisors, searchQuery]);

  const openModal = (advisor = null) => {
    setEditingAdvisor(advisor);
    if (advisor) {
      setSingleTeacher(advisor.teacher?._id || '');
      setSeries(advisor.series || '');
      setSection(advisor.section || '');
    } else {
      setSelectedTeachers(new Set());
      setSeries('');
      setSection('');
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingAdvisor(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const sectionValue = hasSections ? section : 'N/A';

    if (editingAdvisor) {
      if (!singleTeacher || !series) { setFormError('Please fill in all fields'); return; }
      if (hasSections && !section) { setFormError('Please select a section'); return; }
      try {
        await updateAdvisor({ id: editingAdvisor._id, teacher: singleTeacher, series: parseInt(series, 10), section: sectionValue, department: deptId }).unwrap();
        closeModal();
      } catch (err) { setFormError(err.data?.error || 'Failed to update advisor'); }
    } else {
      if (selectedTeachers.size === 0 || !series) { setFormError('Please select at least one teacher and a series'); return; }
      if (hasSections && !section) { setFormError('Please select a section'); return; }
      try {
        const promises = Array.from(selectedTeachers).map(teacherId =>
          createAdvisor({ teacher: teacherId, series: parseInt(series, 10), section: sectionValue, department: deptId }).unwrap()
        );
        const results = await Promise.allSettled(promises);
        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0 && failures.length === results.length) {
          setFormError(failures[0].reason?.data?.error || 'Failed to assign advisors');
        } else {
          closeModal();
        }
      } catch (err) { setFormError(err.data?.error || 'Failed to assign advisors'); }
    }
  };

  const handleDelete = async () => {
    if (!advisorToDelete) return;
    try {
      await deleteAdvisor(advisorToDelete._id).unwrap();
      setDeleteModalOpen(false);
      setAdvisorToDelete(null);
    } catch (err) { console.error('Delete failed:', err); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Course Advisors</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Assign teachers as course advisors for specific series and sections</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
          <Plus size={18} /><span>Assign Advisor</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/50 dark:bg-[#1e1e1e]/50">
          <div className="relative w-full sm:max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by teacher name, email, series, or section..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#151b2e] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-sm" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 dark:bg-[#151b2e] text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Teacher</th>
                <th className="px-6 py-4">Series</th>
                <th className="px-6 py-4">Section</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
              {isLoading ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-500"><div className="flex flex-col items-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" /><p>Loading advisors...</p></div></td></tr>
              ) : filteredAdvisors.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center"><div className="flex flex-col items-center text-gray-500 dark:text-gray-400"><GraduationCap size={48} className="text-gray-300 dark:text-gray-600 mb-4" /><p className="text-lg font-medium text-gray-900 dark:text-white">No advisors found</p><p className="mt-1">Assign a new advisor to get started.</p></div></td></tr>
              ) : filteredAdvisors.map((advisor) => (
                <tr key={advisor._id} className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">{advisor.teacher?.name?.charAt(0) || 'T'}</div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{advisor.teacher?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{advisor.teacher?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{advisor.series}</td>
                  <td className="px-6 py-4">
                    {advisor.section && advisor.section !== 'N/A' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">Section {advisor.section}</span>
                    ) : (
                      <span className="text-xs text-gray-400">No Section</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openModal(advisor)} className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors" title="Edit"><Edit2 size={16} /></button>
                      <button onClick={() => { setAdvisorToDelete(advisor); setDeleteModalOpen(true); }} className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl w-full max-w-md animate-fade-in border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingAdvisor ? 'Edit Course Advisor' : 'Assign Course Advisors'}</h2>
              <button onClick={closeModal} className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
            </div>
            <div className="p-5 max-h-[70vh] overflow-y-auto">
              {formError && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-500/20">{formError}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {editingAdvisor ? 'Teacher' : 'Select Teachers'}
                  </label>
                  {editingAdvisor ? (
                    <TeacherSinglePicker teachers={teachers} loading={loadingTeachers} value={singleTeacher} onChange={setSingleTeacher} />
                  ) : (
                    <TeacherMultiPicker teachers={teachers} loading={loadingTeachers} selected={selectedTeachers} onChange={setSelectedTeachers} />
                  )}
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    {editingAdvisor ? 'Only teachers from your department' : `Select one or more teachers • ${selectedTeachers.size} selected`}
                  </p>
                </div>

                <div className={`grid gap-4 ${hasSections ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Series</label>
                    <select value={series} onChange={(e) => setSeries(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#151b2e] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-sm">
                      <option value="">Select series...</option>
                      {seriesList.map(yr => <option key={yr} value={yr}>{yr}</option>)}
                    </select>
                  </div>
                  {hasSections && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Section</label>
                      <select value={section} onChange={(e) => setSection(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#151b2e] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-sm">
                        <option value="">Select section</option>
                        {sectionOptions.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                {!hasSections && <p className="text-xs text-gray-500 dark:text-gray-400">This department does not use sections.</p>}

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.02] font-medium transition-colors">Cancel</button>
                  <button type="submit" disabled={isCreating || isUpdating} className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-sm disabled:opacity-50">
                    {isCreating || isUpdating ? 'Saving...' : editingAdvisor ? 'Save Changes' : `Assign ${selectedTeachers.size || ''} Advisor${selectedTeachers.size !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={deleteModalOpen} onCancel={() => setDeleteModalOpen(false)} onConfirm={handleDelete}
        title="Remove Course Advisor" message={`Remove ${advisorToDelete?.teacher?.name} as advisor for Series ${advisorToDelete?.series}${advisorToDelete?.section !== 'N/A' ? ` Section ${advisorToDelete?.section}` : ''}?`}
        confirmLabel={isDeleting ? 'Removing...' : 'Remove'} />
    </div>
  );
};

export default ManageCourseAdvisors;
