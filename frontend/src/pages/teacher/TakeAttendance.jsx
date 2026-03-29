import React, { useEffect, useMemo, useState } from 'react';
import { Save, Loader2, Filter } from 'lucide-react';
import { getAttendanceMarks, getAttendanceStatus } from '../../utils/attendanceUtils';
import { useAuth } from '../../contexts/AuthContext';
import { useGetEnrollmentsQuery, useSaveAttendanceMutation } from '../../store/slices/enrollmentSlice';

const buildAttendanceState = (enrollments) => {
  const dates = new Set();
  const attendanceData = {};
  const takenByMap = {};

  enrollments.forEach((enrollment) => {
    const studentId = enrollment.student?._id;
    if (!studentId) return;

    attendanceData[studentId] = {};
    (enrollment.attendanceRecord || []).forEach((record) => {
      const date = new Date(record.date).toISOString().slice(0, 10);
      dates.add(date);
      attendanceData[studentId][date] = record.status === 'Absent'
        ? 'A'
        : 'P';

      if (!takenByMap[date] && record.takenBy) {
        takenByMap[date] = {
          id: record.takenBy._id || record.takenBy,
          name: record.takenBy.name || null
        };
      }
    });
  });

  return {
    dates: Array.from(dates).sort(),
    attendanceData,
    takenByMap
  };
};

const TakeAttendance = ({ classInstance }) => {
  const { currentUser } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [dates, setDates] = useState([new Date().toISOString().split('T')[0]]);
  const [attendanceData, setAttendanceData] = useState({});
  const [takenByMap, setTakenByMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');

  const teachers = useMemo(() => {
    const list = Array.isArray(classInstance?.teachers) ? classInstance.teachers : [];
    return list.length > 0 ? list : (classInstance?.teacher ? [classInstance.teacher] : []);
  }, [classInstance]);

  const isMultiTeacher = teachers.length > 1;

  const { data: enrollmentsData, isLoading: loadingEnrollments, error: errorEnrollments } = useGetEnrollmentsQuery(
    { classInstance: classInstance?._id },
    { skip: !classInstance?._id }
  );
  
  const [saveAttendance] = useSaveAttendanceMutation();

  useEffect(() => {
    if (loadingEnrollments) {
      setLoading(true);
      return;
    }
    setLoading(false);

    if (errorEnrollments) {
      setError(errorEnrollments?.data?.error || errorEnrollments?.message || 'Failed to fetch enrollments');
      return;
    }

    const activeEnrollments = (Array.isArray(enrollmentsData?.data) ? enrollmentsData.data : []).filter((enrollment) => enrollment.status !== 'hidden');
    setEnrollments(activeEnrollments);

    const { dates: existingDates, attendanceData: existingAttendance, takenByMap: existingTakenBy } = buildAttendanceState(activeEnrollments);
    setDates(existingDates.length > 0 ? existingDates : [new Date().toISOString().split('T')[0]]);
    setAttendanceData(existingAttendance);
    setTakenByMap(existingTakenBy);
  }, [enrollmentsData, loadingEnrollments, errorEnrollments]);

  const filteredDates = useMemo(() => {
    if (!teacherFilter) return dates;
    return dates.filter((date) => {
      const info = takenByMap[date];
      if (!info) return true;
      return String(info.id) === teacherFilter;
    });
  }, [dates, teacherFilter, takenByMap]);

  const handleCellChange = (studentId, date, value) => {
    const normalized = value.toUpperCase();
    if (!['P', 'A'].includes(normalized)) return;

    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [date]: normalized
      }
    }));
  };

  const getStudentStats = (studentId) => {
    const studentRecords = attendanceData[studentId] || {};
    const activeDates = teacherFilter ? filteredDates : dates;
    const totalClasses = activeDates.length;
    let presentCount = 0;

    activeDates.forEach((date) => {
      const status = (studentRecords[date] || 'P').toUpperCase().trim();
      if (status !== 'A') {
        presentCount += 1;
      }
    });

    const percentage = totalClasses === 0 ? 0 : (presentCount / totalClasses) * 100;
    const marks = getAttendanceMarks(percentage);
    const status = getAttendanceStatus(percentage);
    return {
      percentage: percentage.toFixed(1),
      marks,
      status,
      presentCount,
      totalClasses
    };
  };

  const handleSave = async () => {
    if (!classInstance?._id || dates.length === 0) return;

    try {
      setSaving(true);
      setError('');
      setMessage('');

      await Promise.all(dates.map((date) => saveAttendance({
        classInstanceId: classInstance._id,
        date,
        records: enrollments.map((enrollment) => ({
          studentId: enrollment.student?._id,
          status: attendanceData[enrollment.student?._id]?.[date] || 'P'
        }))
      }).unwrap()));

      setMessage('Attendance saved successfully.');
    } catch (err) {
      setError(err?.data?.error || err.message || 'Error saving attendance');
    } finally {
      setSaving(false);
    }
  };

  const addNewDateColumn = () => {
    const newDate = window.prompt('Enter new class date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (newDate && !dates.includes(newDate)) {
      setDates([...dates, newDate].sort());
      if (currentUser?._id) {
        setTakenByMap((prev) => ({
          ...prev,
          [newDate]: { id: currentUser._id, name: currentUser.name || 'You' }
        }));
      }
    }
  };

  const students = useMemo(() => enrollments
    .map((enrollment) => ({
      id: enrollment.student?._id,
      rollNumber: enrollment.student?.rollNumber || '',
      name: enrollment.student?.name || ''
    }))
    .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true, sensitivity: 'base' })), [enrollments]);

  const displayDates = teacherFilter ? filteredDates : dates;

  if (!classInstance) {
    return null;
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-ruet-blue" size={28} /></div>;
  }

  return (
    <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Take Attendance</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Class: {classInstance.course?.courseCode} ({classInstance.section}, {classInstance.series} Series)</p>
        </div>
        <div className="flex space-x-3 items-center flex-wrap gap-2">
          {isMultiTeacher && (
            <div className="flex items-center space-x-2">
              <Filter size={14} className="text-gray-500 dark:text-gray-400" />
              <select
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-transparent text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-ruet-blue"
              >
                <option value="" className="dark:bg-gray-800">All Teachers</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id} className="dark:bg-gray-800">
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button onClick={addNewDateColumn} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            + Add Class Date
          </button>
          <button onClick={handleSave} disabled={saving || students.length === 0} className="flex items-center px-4 py-2 bg-ruet-blue text-white rounded-md text-sm font-medium hover:bg-ruet-dark transition-colors disabled:opacity-60">
            {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
            Save Records
          </button>
        </div>
      </div>

      {message && <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded text-sm mb-4">{message}</div>}
      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded text-sm mb-4">{error}</div>}

      {students.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">No enrolled students were found for this class instance.</div>
      ) : (
        <>
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
                <tr>
                  <th scope="col" className="sticky left-0 z-10 bg-gray-50 dark:bg-[#2d2d2d] px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">Student ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700">Name</th>
                  {displayDates.map((date) => (
                    <th key={date} scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">{date}</th>
                  ))}
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/10">Attendance %</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-ruet-blue dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-ruet-dark/20 border-r border-gray-200 dark:border-gray-700">Marks (/10)</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-amber-50 dark:bg-amber-900/10">Status</th>
                </tr>
                {isMultiTeacher && (
                  <tr className="bg-indigo-50/50 dark:bg-indigo-900/10">
                    <th className="sticky left-0 z-10 bg-indigo-50/50 dark:bg-indigo-900/10 px-6 py-1.5 text-left text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase border-r border-gray-200 dark:border-gray-700">Taken By</th>
                    <th className="border-r border-gray-200 dark:border-gray-700"></th>
                    {displayDates.map((date) => {
                      const info = takenByMap[date];
                      return (
                        <th key={`tb-${date}`} className="px-2 py-1.5 text-center text-[10px] font-medium text-indigo-500 dark:text-indigo-400 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                          {info?.name || '-'}
                        </th>
                      );
                    })}
                    <th className="border-r border-gray-200 dark:border-gray-700"></th>
                    <th className="border-r border-gray-200 dark:border-gray-700"></th>
                    <th></th>
                  </tr>
                )}
              </thead>
              <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 group">
                    <td className="sticky left-0 z-10 bg-white dark:bg-[#1e1e1e] group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">{student.rollNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">{student.name}</td>
                    {displayDates.map((date) => {
                      const status = (attendanceData[student.id] && attendanceData[student.id][date]) || 'P';
                      return (
                        <td key={date} className="p-0 border-r border-gray-200 dark:border-gray-700 text-center">
                          <div
                            tabIndex={0}
                            role="button"
                            aria-label={`Attendance for ${student.name} on ${date}`}
                            className={`w-full py-4 outline-none focus:ring-2 focus:ring-inset focus:ring-ruet-blue transition-colors font-bold cursor-default hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                              status === 'P' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}
                            onKeyDown={(e) => {
                              const key = e.key.toLowerCase();
                              if (key === 'p') handleCellChange(student.id, date, 'P');
                              else if (key === 'a') handleCellChange(student.id, date, 'A');
                            }}
                            onDoubleClick={() => handleCellChange(student.id, date, status === 'P' ? 'A' : 'P')}
                          >
                            {status}
                          </div>
                        </td>
                      );
                    })}
                    {(() => {
                      const stats = getStudentStats(student.id);
                      return (
                        <>
                          <td className={`px-4 py-4 whitespace-nowrap text-sm font-bold text-center border-r border-gray-200 dark:border-gray-700 ${parseFloat(stats.percentage) >= 75 ? 'text-green-600 dark:text-green-400' : parseFloat(stats.percentage) >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>{stats.percentage}%</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-extrabold text-center text-ruet-blue dark:text-blue-400 border-r border-gray-200 dark:border-gray-700 bg-blue-50/50 dark:bg-ruet-dark/10">{stats.marks}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${stats.status.color}`}>{stats.status.label}</span>
                          </td>
                        </>
                      );
                    })()}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p><span className="font-semibold">Grid Helper:</span> Double-tap/click a cell to toggle, or focus a cell and press **P** (Present) or **A** (Absent) on your keyboard. Single-tap is disabled to prevent accidental entries.</p>
            <p className="text-red-500 dark:text-red-400"><span className="font-semibold">Rule 14.3:</span> Students with less than 50% attendance are barred from the Semester Final. Below 75% also affects scholarship eligibility.</p>
          </div>
        </>
      )}
    </div>
  );
};

export default TakeAttendance;
