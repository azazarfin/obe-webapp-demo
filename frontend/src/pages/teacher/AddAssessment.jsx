import React, { useState } from 'react';
import { Save } from 'lucide-react';

// Mock Student Data
const initialStudents = [
  { id: '2103001', name: 'Rahim Uddin' },
  { id: '2103002', name: 'Karim Hasan' },
  { id: '2103003', name: 'Sadia Rahman' },
  { id: '2103004', name: 'Tamim Iqbal' },
  { id: '2103005', name: 'Nadia Sultana' },
];

const AddAssessment = () => {
  // Mock Assessment Structure for Semester Final Exam (mapping Q -> CO)
  const initialColumns = [
    { title: 'CT 1 (20)', mappedCO: 'CO1', type: 'CT', total: 20 },
    { title: 'CT 2 (20)', mappedCO: 'CO2', type: 'CT', total: 20 },
    { title: 'Q1a (15)', mappedCO: 'CO1', type: 'Final', total: 15 },
    { title: 'Q1b (15)', mappedCO: 'CO2', type: 'Final', total: 15 },
    { title: 'Q2a (15)', mappedCO: 'CO3', type: 'Final', total: 15 },
  ];

  const [columns, setColumns] = useState(initialColumns);
  
  // State structure: { '2103001': { 'CT 1 (20)': 18, 'Q1a (15)': 12 } }
  const [marksData, setMarksData] = useState({});

  const handleCellChange = (studentId, colTitle, value) => {
    const upperVal = value.toUpperCase();
    if (upperVal !== '' && upperVal !== 'A' && isNaN(upperVal)) return;

    setMarksData(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [colTitle]: upperVal
      }
    }));
  };

  const handleSave = () => {
    console.log('Saving Marks:', marksData);
    alert('Assessment Marks saved successfully!');
  };

  const calculateTotal = (studentId) => {
    const studentRecords = marksData[studentId] || {};
    let sum = 0;
    Object.values(studentRecords).forEach(mark => {
      if (mark && mark !== 'A' && !isNaN(mark)) {
        sum += parseFloat(mark);
      }
    });
    return sum.toFixed(1);
  };

  return (
    <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Input Assessment Marks</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Class: CSE 3101 (Section A, 2021 Series)</p>
        </div>
        <div className="flex space-x-3">
          <button 
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Manage Columns (Mappings)
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center px-4 py-2 bg-ruet-blue text-white rounded-md text-sm font-medium hover:bg-ruet-dark transition-colors"
          >
            <Save size={16} className="mr-2" />
            Save Marks
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
            <tr>
              <th rowSpan="2" scope="col" className="sticky left-0 z-20 bg-gray-50 dark:bg-[#2d2d2d] px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 border-b">
                Student ID
              </th>
              {columns.map((col, idx) => (
                <th key={idx} scope="col" className="px-4 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 whitespace-nowrap">
                  {col.title}
                </th>
              ))}
              <th rowSpan="2" scope="col" className="px-6 py-3 text-center text-xs font-medium text-ruet-blue dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-ruet-dark/20 border-b border-gray-200 dark:border-gray-700">
                Sum (Raw)
              </th>
            </tr>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} scope="col" className="px-4 py-1 text-center text-[10px] font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider border-r border-b border-gray-200 dark:border-gray-700">
                  {col.mappedCO}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
            {initialStudents.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 group">
                <td className="sticky left-0 z-10 bg-white dark:bg-[#1e1e1e] group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col">
                    <span>{student.id}</span>
                    <span className="text-xs text-gray-400 font-normal">{student.name}</span>
                  </div>
                </td>
                
                {columns.map((col, idx) => (
                  <td key={idx} className="p-0 border-r border-gray-200 dark:border-gray-700 text-center relative">
                    <input 
                      type="text"
                      className="w-full h-full min-h-[60px] text-center bg-transparent border-none focus:ring-2 focus:ring-inset focus:ring-ruet-blue dark:text-white outline-none caret-ruet-blue font-mono"
                      placeholder="-"
                      value={(marksData[student.id] && marksData[student.id][col.title]) || ''}
                      onChange={(e) => handleCellChange(student.id, col.title, e.target.value)}
                    />
                  </td>
                ))}
                
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-center text-gray-900 dark:text-white bg-blue-50/50 dark:bg-ruet-dark/10">
                  {calculateTotal(student.id)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AddAssessment;
