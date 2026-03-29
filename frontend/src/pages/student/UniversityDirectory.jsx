import React, { useEffect, useMemo, useState } from 'react';
import { Search, MapPin, Book, Users, Briefcase, FileText, Loader2 } from 'lucide-react';
import { SEMESTERS } from '../../utils/semesterUtils';
import api from '../../utils/api';
import { useHistoryBackedState } from '../../hooks/useHistoryBackedState';

const INITIAL_DIRECTORY_STATE = { activeTab: 'courses' };

const UniversityDirectory = () => {
  const [filterDept, setFilterDept] = useState('All');
  const [filterSemester, setFilterSemester] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { state: directoryState, pushState: pushDirectoryState } = useHistoryBackedState('university-directory', INITIAL_DIRECTORY_STATE);
  const activeTab = directoryState.activeTab;

  useEffect(() => {
    const fetchDirectory = async () => {
      try {
        setLoading(true);
        const [courseData, teacherData, departmentData] = await Promise.all([
          api.get('/courses'),
          api.get('/users?role=TEACHER'),
          api.get('/departments')
        ]);
        setCourses(Array.isArray(courseData) ? courseData : []);
        setTeachers(Array.isArray(teacherData) ? teacherData : []);
        setDepartments(Array.isArray(departmentData) ? departmentData : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDirectory();
  }, []);

  const departmentOptions = useMemo(() => (
    ['All', ...departments.map((department) => department.shortName)]
  ), [departments]);

  const filteredCourses = useMemo(() => courses.filter((course) => {
    const department = course.department?.shortName || '';
    return (filterDept === 'All' || department === filterDept) &&
      (filterSemester === 'All' || (course.semester || 'Unassigned') === filterSemester) &&
      (course.courseName.toLowerCase().includes(searchQuery.toLowerCase()) || course.courseCode.toLowerCase().includes(searchQuery.toLowerCase()));
  }), [courses, filterDept, filterSemester, searchQuery]);

  const filteredTeachers = useMemo(() => teachers.filter((teacher) => {
    const department = teacher.department?.shortName || '';
    return (filterDept === 'All' || department === filterDept) &&
      (
        teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (teacher.designation || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
  }), [teachers, filterDept, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded text-sm">{error}</div>}

      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="w-full md:w-1/2 relative">
            <input
              type="text"
              placeholder={activeTab === 'courses' ? 'Search by course name or code...' : 'Search by teacher name...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-ruet-blue outline-none"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>

          <div className="flex w-full md:w-auto space-x-3">
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:border-ruet-blue"
            >
              {departmentOptions.map((department) => (
                <option key={department} value={department} className="dark:bg-gray-800">
                  {department === 'All' ? 'All Depts' : department}
                </option>
              ))}
            </select>

            {activeTab === 'courses' && (
              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:border-ruet-blue"
              >
                <option value="All" className="dark:bg-gray-800">All Semesters</option>
                {SEMESTERS.map((semester) => <option key={semester} value={semester} className="dark:bg-gray-800">{semester}</option>)}
              </select>
            )}
          </div>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => pushDirectoryState((currentState) => ({ ...currentState, activeTab: 'courses' }))}
            className={`px-6 py-3 font-medium text-sm flex items-center border-b-2 transition-colors ${activeTab === 'courses' ? 'border-ruet-blue text-ruet-blue dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'}`}
          >
            <Book size={16} className="mr-2" /> Course Directory
          </button>
          <button
            onClick={() => pushDirectoryState((currentState) => ({ ...currentState, activeTab: 'teachers' }))}
            className={`px-6 py-3 font-medium text-sm flex items-center border-b-2 transition-colors ${activeTab === 'teachers' ? 'border-ruet-blue text-ruet-blue dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'}`}
          >
            <Users size={16} className="mr-2" /> Faculty Directory
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-ruet-blue" size={28} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === 'courses' ? (
            filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <div key={course._id} className="bg-white dark:bg-[#1e1e1e] p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2 gap-3">
                    <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded inline-block">{course.courseCode}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{course.credit} CR</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">{course.courseName}</h3>

                  <div className="mb-4">
                    <div className="flex items-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                      <FileText size={12} className="mr-1" /> Course Contents
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">{course.syllabus || 'Course content has not been added yet.'}</p>
                  </div>

                  <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <span className="flex items-center"><MapPin size={14} className="mr-1" /> {course.department?.shortName || 'N/A'}</span>
                    <span className="text-xs font-medium bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{course.semester || 'Unassigned'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">No courses found matching your criteria.</div>
            )
          ) : (
            filteredTeachers.length > 0 ? (
              filteredTeachers.map((teacher) => (
                <div key={teacher._id} className="bg-white dark:bg-[#1e1e1e] p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{teacher.name}</h3>
                      <p className="text-sm text-ruet-blue dark:text-blue-400 font-medium flex items-center"><Briefcase size={14} className="mr-1" /> {teacher.designation || 'Faculty Member'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">{teacher.teacherType || 'Host'}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${teacher.onLeave ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
                        {teacher.onLeave ? 'On Leave' : 'Available'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-sm">
                    <p className="text-gray-600 dark:text-gray-400 flex justify-between gap-4"><span className="font-semibold">Department:</span> {teacher.department?.shortName || 'N/A'}</p>
                    <p className="text-gray-600 dark:text-gray-400 flex justify-between gap-4"><span className="font-semibold">Email:</span> <a href={`mailto:${teacher.email}`} className="text-ruet-blue hover:underline break-all">{teacher.email}</a></p>
                    <p className="text-gray-600 dark:text-gray-400 flex justify-between gap-4"><span className="font-semibold">Teacher Type:</span> {teacher.teacherType || 'Host'}</p>
                    <p className="text-gray-600 dark:text-gray-400 flex justify-between gap-4"><span className="font-semibold">Status:</span> {teacher.onLeave ? 'On Leave' : 'Available'}</p>
                    {teacher.onLeave && teacher.leaveReason && (
                      <p className="text-gray-600 dark:text-gray-400 flex justify-between gap-4"><span className="font-semibold">Leave Note:</span> {teacher.leaveReason}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">No faculty members found matching your criteria.</div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default UniversityDirectory;
