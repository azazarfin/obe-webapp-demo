import React, { useState } from 'react';
import { Search, MapPin, Book, Users, Briefcase } from 'lucide-react';

const mockCoursesInfo = [
  { id: 1, code: 'CSE 3101', name: 'Database Systems', credit: 3, dept: 'CSE', semester: '5th' },
  { id: 2, code: 'ECE 3101', name: 'Signals and Systems', credit: 3, dept: 'ECE', semester: '5th' },
  { id: 3, code: 'ME 2101', name: 'Basic Thermodynamics', credit: 3, dept: 'ME', semester: '3rd' },
  { id: 4, code: 'CSE 4101', name: 'Artificial Intelligence', credit: 3, dept: 'CSE', semester: '7th' }
];

const mockTeachersInfo = [
  { id: 1, name: 'Dr. John Doe', designation: 'Professor', dept: 'ECE', email: 'john@ece.ruet.ac.bd' },
  { id: 2, name: 'Jane Smith', designation: 'Assistant Professor', dept: 'CSE', email: 'jane@cse.ruet.ac.bd' },
  { id: 3, name: 'Dr. Alan Turing', designation: 'Professor', dept: 'CSE', email: 'alan@cse.ruet.ac.bd' }
];

const UniversityDirectory = () => {
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' or 'teachers'
  const [filterDept, setFilterDept] = useState('All');
  const [filterSemester, setFilterSemester] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const departments = ['All', 'CSE', 'ECE', 'ME', 'EEE', 'CE'];
  const semesters = ['All', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

  const filteredCourses = mockCoursesInfo.filter(course => {
    return (filterDept === 'All' || course.dept === filterDept) &&
           (filterSemester === 'All' || course.semester === filterSemester) &&
           (course.name.toLowerCase().includes(searchQuery.toLowerCase()) || course.code.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const filteredTeachers = mockTeachersInfo.filter(teacher => {
    return (filterDept === 'All' || teacher.dept === filterDept) &&
           (teacher.name.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      
      {/* Search and Filters */}
      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="w-full md:w-1/2 relative">
             <input 
                type="text" 
                placeholder={activeTab === 'courses' ? "Search by course name or code..." : "Search by teacher name..."}
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
                <option value="All" className="dark:bg-gray-800">All Depts</option>
                {departments.filter(d => d !== 'All').map(d => <option key={d} value={d} className="dark:bg-gray-800">{d}</option>)}
             </select>

             {activeTab === 'courses' && (
               <select 
                  value={filterSemester}
                  onChange={(e) => setFilterSemester(e.target.value)}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:border-ruet-blue"
               >
                  <option value="All" className="dark:bg-gray-800">All Sems</option>
                  {semesters.filter(s => s !== 'All').map(s => <option key={s} value={s} className="dark:bg-gray-800">{s}</option>)}
               </select>
             )}
          </div>
        </div>

        {/* Directory Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-6 py-3 font-medium text-sm flex items-center border-b-2 transition-colors ${activeTab === 'courses' ? 'border-ruet-blue text-ruet-blue dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'}`}
          >
            <Book size={16} className="mr-2" /> Course Directory
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-6 py-3 font-medium text-sm flex items-center border-b-2 transition-colors ${activeTab === 'teachers' ? 'border-ruet-blue text-ruet-blue dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'}`}
          >
            <Users size={16} className="mr-2" /> Faculty Directory
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'courses' ? (
           filteredCourses.length > 0 ? (
             filteredCourses.map(course => (
                <div key={course.id} className="bg-white dark:bg-[#1e1e1e] p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                   <div className="flex justify-between items-start mb-2">
                     <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded inline-block">{course.code}</span>
                     <span className="text-xs text-gray-500 dark:text-gray-400">{course.credit} CR</span>
                   </div>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 line-clamp-1">{course.name}</h3>
                   <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <span className="flex items-center"><MapPin size={14} className="mr-1" /> {course.dept}</span>
                      <span>Semester: {course.semester}</span>
                   </div>
                </div>
             ))
           ) : (
             <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">No courses found matching your criteria.</div>
           )
        ) : (
           filteredTeachers.length > 0 ? (
             filteredTeachers.map(teacher => (
                <div key={teacher.id} className="bg-white dark:bg-[#1e1e1e] p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{teacher.name}</h3>
                   <p className="text-sm text-ruet-blue dark:text-blue-400 font-medium mb-4 flex items-center"><Briefcase size={14} className="mr-1" /> {teacher.designation}</p>
                   
                   <div className="space-y-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-sm">
                      <p className="text-gray-600 dark:text-gray-400 flex justify-between"><span className="font-semibold">Department:</span> {teacher.dept}</p>
                      <p className="text-gray-600 dark:text-gray-400 flex justify-between"><span className="font-semibold">Email:</span> <a href={`mailto:${teacher.email}`} className="text-ruet-blue hover:underline">{teacher.email}</a></p>
                   </div>
                </div>
             ))
           ) : (
             <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">No faculty members found matching your criteria.</div>
           )
        )}
      </div>

    </div>
  );
};

export default UniversityDirectory;
