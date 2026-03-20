import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Edit, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { departmentUsesSections, getDepartmentSections, normalizeSectionValue } from '../../utils/departmentUtils';

const initialForm = {
  course: '',
  series: '',
  section: 'N/A',
  teachers: [],
  teacherSearch: ''
};

const DeptCourseManagement = () => {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingInstance, setEditingInstance] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [filterSection, setFilterSection] = useState('');
  const [confirm, setConfirm] = useState({ open: false, type: '', id: null });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseData, teacherData, instanceData] = await Promise.all([
        api.get('/courses'),
        api.get('/users?role=TEACHER'),
        api.get('/class-instances')
      ]);
      setCourses(Array.isArray(courseData) ? courseData : []);
      setTeachers(Array.isArray(teacherData) ? teacherData : []);
      setInstances(Array.isArray(instanceData) ? instanceData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedCourse = useMemo(
    () => courses.find((course) => course._id === formData.course) || null,
    [courses, formData.course]
  );

  const availableSections = useMemo(
    () => getDepartmentSections(selectedCourse?.department),
    [selectedCourse]
  );

  const showSectionSelect = departmentUsesSections(selectedCourse?.department);
  const activeTeachers = useMemo(() => teachers.filter((teacher) => !teacher.onLeave), [teachers]);
  const filteredTeachers = useMemo(() => activeTeachers.filter((teacher) => (
    !formData.teachers.includes(teacher._id) &&
    (!formData.teacherSearch || teacher.name.toLowerCase().includes(formData.teacherSearch.toLowerCase()))
  )), [activeTeachers, formData.teacherSearch, formData.teachers]);

  const departmentSections = useMemo(
    () => getDepartmentSections(currentUser?.department),
    [currentUser]
  );

  const filteredInstances = filterSection
    ? instances.filter((instance) => instance.section === filterSection)
    : instances;

  const resetForm = () => {
    setEditingInstance(null);
    setFormData(initialForm);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (instance) => {
    const courseDepartment = instance.course?.department;
    setEditingInstance(instance);
    setFormData({
      course: instance.course?._id || '',
      series: String(instance.series || ''),
      section: normalizeSectionValue(courseDepartment, instance.section || 'N/A'),
      teachers: Array.isArray(instance.teachers) && instance.teachers.length > 0
        ? instance.teachers.map((teacher) => String(teacher._id))
        : (instance.teacher?._id ? [String(instance.teacher._id)] : []),
      teacherSearch: ''
    });
    setShowModal(true);
  };

  const handleCourseChange = (courseId) => {
    const course = courses.find((item) => item._id === courseId);
    setFormData((prev) => ({
      ...prev,
      course: courseId,
      section: normalizeSectionValue(course?.department, prev.section)
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedCourse) return;

    setSaving(true);
    try {
      const payload = {
        course: formData.course,
        teachers: formData.teachers,
        series: Number.parseInt(formData.series, 10),
        section: normalizeSectionValue(selectedCourse.department, formData.section),
        status: editingInstance?.status || 'Running'
      };

      if (editingInstance) {
        await api.put(`/class-instances/${editingInstance._id}`, payload);
        setSuccessMsg('Running course updated successfully.');
      } else {
        await api.post('/class-instances', { ...payload, coPoMapping: [] });
        setSuccessMsg('Course assigned successfully.');
      }

      await fetchData();
      setShowModal(false);
      resetForm();
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

  const handleAddTeacher = (teacherId) => {
    if (!teacherId || formData.teachers.includes(teacherId)) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      teachers: [...prev.teachers, teacherId]
    }));
  };

  const handleRemoveTeacher = (teacherId) => {
    setFormData((prev) => ({
      ...prev,
      teachers: prev.teachers.filter((id) => id !== teacherId)
    }));
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-ruet-blue" size={32} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Course Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Assign teachers, edit running courses, and finish or delete course instances for your department.</p>
        </div>
        <button onClick={openCreateModal} className="flex items-center px-4 py-2 bg-ruet-blue text-white rounded-md hover:bg-ruet-dark transition-colors font-medium">
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
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Running & Finished Courses</h3>
          {departmentSections.length > 0 && (
            <select value={filterSection} onChange={(event) => setFilterSection(event.target.value)} className="text-sm p-1.5 border border-gray-300 dark:border-gray-600 rounded bg-transparent dark:text-white outline-none">
              <option value="">All Sections</option>
              {departmentSections.map((section) => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Course</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Series</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Section</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Teachers</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
              {filteredInstances.length > 0 ? filteredInstances.map((instance) => (
                <tr key={instance._id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-bold text-ruet-blue dark:text-blue-400">{instance.course?.courseCode}</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">{instance.course?.courseName}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{instance.series}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">{instance.section === 'N/A' ? 'No Section' : instance.section}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex flex-wrap gap-1.5">
                      {(Array.isArray(instance.teachers) && instance.teachers.length > 0 ? instance.teachers : [instance.teacher]).filter(Boolean).map((teacher) => (
                        <span key={teacher._id} className="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full">{teacher.name}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className={`text-xs px-2 py-1 rounded font-semibold ${instance.status === 'Running' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                      {instance.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm space-x-2">
                    {instance.status === 'Running' && (
                      <>
                        <button onClick={() => openEditModal(instance)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400" title="Edit Running Course"><Edit size={18} /></button>
                        <button onClick={() => setConfirm({ open: true, type: 'finish', id: instance._id })} className="text-orange-500 hover:text-orange-700" title="Mark Finished"><CheckCircle size={18} /></button>
                      </>
                    )}
                    <button onClick={() => setConfirm({ open: true, type: 'delete', id: instance._id })} className="text-red-500 hover:text-red-700" title="Delete"><Trash2 size={18} /></button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="px-4 py-8 text-center text-sm text-gray-500">No course instances found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-lg shadow-xl w-full max-w-xl p-6 border border-gray-200 dark:border-gray-800 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-5 border-b border-gray-200 dark:border-gray-800 pb-3">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editingInstance ? 'Edit Running Course' : 'Assign Teachers to Course'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Course</label>
                <select required value={formData.course} onChange={(event) => handleCourseChange(event.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue">
                  <option value="">-- Choose Course --</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>{course.courseCode} - {course.courseName}</option>
                  ))}
                </select>
              </div>

              <div className={`grid gap-3 ${showSectionSelect ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Series</label>
                  <input type="number" required placeholder="Series Year (e.g. 2021)" value={formData.series} onChange={(event) => setFormData((prev) => ({ ...prev, series: event.target.value }))} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue" />
                </div>

                {showSectionSelect && (
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Section</label>
                    <select required value={formData.section} onChange={(event) => setFormData((prev) => ({ ...prev, section: event.target.value }))} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue">
                      {availableSections.map((section) => (
                        <option key={section} value={section}>{section}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {!showSectionSelect && selectedCourse && (
                <p className="text-xs text-gray-500 dark:text-gray-400">This department does not use sections. The running course will be created without a section.</p>
              )}

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Assign Teachers</label>
                <div className="relative">
                  <input type="text" placeholder="Search teacher by name" value={formData.teacherSearch} onChange={(event) => setFormData((prev) => ({ ...prev, teacherSearch: event.target.value }))} className="w-full p-2.5 pl-9 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue" />
                  <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                </div>
                <select value="" onChange={(event) => handleAddTeacher(event.target.value)} size={Math.min(Math.max(filteredTeachers.length + 1, 2), 6)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue">
                  <option value="" disabled>Select a teacher to add</option>
                  {filteredTeachers.length > 0 ? filteredTeachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>{teacher.name} - {teacher.department?.shortName} ({teacher.teacherType || 'Host'})</option>
                  )) : (
                    <option value="" disabled>No available teacher found</option>
                  )}
                </select>
                {formData.teachers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.teachers.map((teacherId) => {
                      const teacher = teachers.find((item) => item._id === teacherId);
                      if (!teacher) return null;
                      return (
                        <span key={teacherId} className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs px-3 py-1 rounded-full">
                          {teacher.name} - {teacher.department?.shortName}
                          <button type="button" onClick={() => handleRemoveTeacher(teacherId)} className="text-red-500 hover:text-red-700">
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">Teachers on leave are excluded automatically. The first selected teacher becomes the primary instructor for compatibility across reports.</p>
              </div>

              <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border mr-2 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={saving || formData.teachers.length === 0} className="px-5 py-2 bg-ruet-blue text-white rounded-md hover:bg-ruet-dark font-medium disabled:opacity-40 transition-colors">
                  {saving ? 'Saving...' : editingInstance ? 'Save Changes' : 'Create & Assign'}
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
