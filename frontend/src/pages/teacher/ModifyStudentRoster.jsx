import React, { useEffect, useMemo, useState } from 'react';
import { UserPlus, UserMinus, Search, Eye, EyeOff, Loader2 } from 'lucide-react';
import api from '../../utils/api';

const ModifyStudentRoster = ({ classInstance }) => {
  const [enrollments, setEnrollments] = useState([]);
  const [searchRoll, setSearchRoll] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchRoster = async () => {
    if (!classInstance?._id) return;

    try {
      setLoading(true);
      setError('');
      const data = await api.get(`/enrollments?classInstance=${classInstance._id}`);
      setEnrollments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [classInstance]);

  const roster = useMemo(() => enrollments
    .map((enrollment) => ({
      enrollmentId: enrollment._id,
      studentId: enrollment.student?._id,
      id: enrollment.student?.rollNumber || '',
      name: enrollment.student?.name || '',
      status: enrollment.status || 'active',
      type: enrollment.type || 'regular'
    }))
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' })), [enrollments]);

  const activeStudents = useMemo(
    () => roster.filter((student) => student.status === 'active'),
    [roster]
  );

  const toggleStatus = async (student) => {
    try {
      setSaving(true);
      setError('');
      setMessage('');
      await api.put(`/enrollments/${student.enrollmentId}`, {
        status: student.status === 'active' ? 'hidden' : 'active'
      });
      await fetchRoster();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const hideAllStudents = async () => {
    if (activeStudents.length === 0) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      setMessage('');
      await Promise.all(activeStudents.map((student) => (
        api.put(`/enrollments/${student.enrollmentId}`, { status: 'hidden' })
      )));
      setMessage('All active students have been hidden from this roster.');
      await fetchRoster();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddIrregular = async (e) => {
    e.preventDefault();
    if (!searchRoll) return;

    try {
      setSaving(true);
      setError('');
      setMessage('');

      const students = await api.get(`/users?role=STUDENT&rollNumber=${searchRoll}`);
      if (!Array.isArray(students) || students.length === 0) {
        throw new Error('No student found with that roll number.');
      }

      await api.post('/enrollments', {
        student: students[0]._id,
        classInstance: classInstance._id,
        type: 'irregular',
        status: 'active'
      });

      setMessage('Irregular student added to the roster.');
      setSearchRoll('');
      await fetchRoster();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!classInstance) {
    return null;
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-ruet-blue" size={28} /></div>;
  }

  return (
    <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
      <div className="mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Modify Student Roster</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Class: {classInstance.course?.courseCode} ({classInstance.section === 'N/A' ? 'No Section' : `Section ${classInstance.section}`}, {classInstance.series} Series)</p>
      </div>

      {message && <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded text-sm mb-4">{message}</div>}
      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded text-sm mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-50 dark:bg-[#2d2d2d] p-4 rounded-lg border border-gray-200 dark:border-gray-700 col-span-1">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
            <UserPlus size={18} className="mr-2 text-ruet-blue" /> Add Irregular Student
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Assign a student who is retaking this course or belongs to a different series.</p>
          <form onSubmit={handleAddIrregular} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student Roll Number</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={7}
                  pattern="[0-9]{7}"
                  title="7 Digit Roll (e.g. 1903001)"
                  required
                  placeholder="e.g. 1903001"
                  value={searchRoll}
                  onChange={(e) => setSearchRoll(e.target.value.replace(/\D/g, '').slice(0, 7))}
                  className="w-full pl-9 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-white focus:ring-2 focus:ring-ruet-blue outline-none"
                />
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>
            <button type="submit" disabled={saving} className="w-full py-2 bg-ruet-blue text-white rounded-md hover:bg-ruet-dark transition-colors font-medium disabled:opacity-60">
              Search &amp; Assign
            </button>
          </form>
        </div>

        <div className="col-span-1 md:col-span-2">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                <UserMinus size={18} className="mr-2 text-orange-500" /> Manage Existing Roster
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Hide dropped students without deleting their enrollment history.</p>
            </div>
            <button
              type="button"
              onClick={hideAllStudents}
              disabled={saving || activeStudents.length === 0}
              className="inline-flex items-center justify-center rounded-md border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-100 disabled:opacity-50 dark:border-orange-900/50 dark:bg-orange-900/20 dark:text-orange-300 dark:hover:bg-orange-900/30"
            >
              <EyeOff size={16} className="mr-2" />
              Hide All
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Roll</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
                {roster.length > 0 ? roster.map((student) => (
                  <tr key={student.enrollmentId} className={student.status === 'hidden' ? 'opacity-50 bg-gray-50 dark:bg-gray-800/20' : ''}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{student.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-400">{student.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${student.type === 'regular' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'}`}>
                        {student.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {student.status === 'active'
                        ? <span className="text-xs text-green-600 dark:text-green-400 font-bold">Active</span>
                        : <span className="text-xs text-red-500 font-bold">Hidden</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button onClick={() => toggleStatus(student)} disabled={saving} className={`flex items-center justify-end w-full text-sm font-medium ${student.status === 'active' ? 'text-orange-500 hover:text-orange-700' : 'text-green-600 hover:text-green-700'} disabled:opacity-60`}>
                        {student.status === 'active' ? <><EyeOff size={16} className="mr-1" /> Hide (Drop)</> : <><Eye size={16} className="mr-1" /> Unhide</>}
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">No students are enrolled in this class instance yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModifyStudentRoster;
