import React, { useState } from 'react';
import { UserPlus, UserMinus, Search, Eye, EyeOff } from 'lucide-react';

const initialRoster = [
  { id: '2103001', name: 'Rahim Uddin', status: 'active', type: 'regular' },
  { id: '2103002', name: 'Karim Hasan', status: 'active', type: 'regular' },
  { id: '2103003', name: 'Sadia Rahman', status: 'active', type: 'regular' },
  { id: '2103004', name: 'Tamim Iqbal', status: 'active', type: 'regular' },
  { id: '2003015', name: 'Nadia Sultana', status: 'active', type: 'irregular' },
];

const ModifyStudentRoster = () => {
  const [roster, setRoster] = useState(initialRoster);
  const [searchRoll, setSearchRoll] = useState('');

  const toggleStatus = (id) => {
    setRoster(roster.map(student => 
      student.id === id ? { ...student, status: student.status === 'active' ? 'hidden' : 'active' } : student
    ));
  };

  const handleAddIrregular = (e) => {
    e.preventDefault();
    if (searchRoll && !roster.find(s => s.id === searchRoll)) {
      setRoster([...roster, { id: searchRoll, name: 'New Irregular Student', status: 'active', type: 'irregular' }]);
      setSearchRoll('');
    }
  };

  return (
    <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
      <div className="mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Modify Student Roster</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Class: CSE 3101 (Section A, 2021 Series)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Add Student Section */}
        <div className="bg-gray-50 dark:bg-[#2d2d2d] p-4 rounded-lg border border-gray-200 dark:border-gray-700 col-span-1">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
            <UserPlus size={18} className="mr-2 text-ruet-blue" /> Add Irregular Student
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Manually assign a student who is retaking this course or belongs to a different series.</p>
          <form onSubmit={handleAddIrregular} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student Roll Number</label>
              <div className="relative">
                <input 
                  type="text" 
                  pattern="^\d{7}$"
                  title="7 Digit Roll (e.g. 1903001)"
                  required
                  placeholder="e.g. 1903001"
                  value={searchRoll}
                  onChange={(e) => setSearchRoll(e.target.value)}
                  className="w-full pl-9 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-white focus:ring-2 focus:ring-ruet-blue outline-none"
                />
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>
            <button type="submit" className="w-full py-2 bg-ruet-blue text-white rounded-md hover:bg-ruet-dark transition-colors font-medium">
              Search & Assign
            </button>
          </form>
        </div>

        {/* Current Roster Section */}
        <div className="col-span-1 md:col-span-2">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <UserMinus size={18} className="mr-2 text-orange-500" /> Manage Existing Roster
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Hide students who have dropped out to keep your Attendance and Assessment sheets clean without needing admin intervention.</p>
          
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
                {roster.map((student) => (
                  <tr key={student.id} className={student.status === 'hidden' ? 'opacity-50 bg-gray-50 dark:bg-gray-800/20' : ''}>
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
                        : <span className="text-xs text-red-500 font-bold">Hidden</span>
                      }
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button 
                        onClick={() => toggleStatus(student.id)}
                        className={`flex items-center justify-end w-full text-sm font-medium ${student.status === 'active' ? 'text-orange-500 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}`}
                      >
                        {student.status === 'active' ? <><EyeOff size={16} className="mr-1"/> Hide (Drop)</> : <><Eye size={16} className="mr-1"/> Unhide</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModifyStudentRoster;
