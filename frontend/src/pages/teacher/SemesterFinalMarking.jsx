import React, { useState } from 'react';
import { Save, Plus, X, AlertCircle } from 'lucide-react';

const mockStudents = [
  { id: '2103001', name: 'Rahim Uddin' },
  { id: '2103002', name: 'Karim Hasan' },
  { id: '2103003', name: 'Sadia Rahman' },
  { id: '2103004', name: 'Tamim Iqbal' },
  { id: '2103005', name: 'Nadia Sultana' },
];

const SemesterFinalMarking = () => {
  const [partAQuestions, setPartAQuestions] = useState([]);
  const [partBQuestions, setPartBQuestions] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [showAddForm, setShowAddForm] = useState(null);
  const [newQuestion, setNewQuestion] = useState({ no: '', co: 'CO1', po: 'PO1', totalMarks: '' });

  const coOptions = ['CO1', 'CO2', 'CO3', 'CO4', 'CO5'];
  const poOptions = ['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6', 'PO7', 'PO8', 'PO9', 'PO10', 'PO11', 'PO12'];

  const allQuestions = [
    ...partAQuestions.map(q => ({ ...q, part: 'A' })),
    ...partBQuestions.map(q => ({ ...q, part: 'B' })),
  ];

  const handleAddQuestion = (part) => {
    if (!newQuestion.no || !newQuestion.totalMarks) return;
    const question = {
      id: `${part}-${Date.now()}`,
      no: newQuestion.no,
      co: newQuestion.co,
      po: newQuestion.po,
      totalMarks: parseFloat(newQuestion.totalMarks),
    };
    if (part === 'A') {
      setPartAQuestions([...partAQuestions, question]);
    } else {
      setPartBQuestions([...partBQuestions, question]);
    }
    setNewQuestion({ no: '', co: 'CO1', po: 'PO1', totalMarks: '' });
    setShowAddForm(null);
  };

  const handleRemoveQuestion = (part, id) => {
    if (part === 'A') {
      setPartAQuestions(partAQuestions.filter(q => q.id !== id));
    } else {
      setPartBQuestions(partBQuestions.filter(q => q.id !== id));
    }
    const newMarks = { ...marksData };
    Object.keys(newMarks).forEach(sid => {
      if (newMarks[sid][id] !== undefined) {
        delete newMarks[sid][id];
      }
    });
    setMarksData(newMarks);
  };

  const handleCellChange = (studentId, questionId, value, totalMarks) => {
    const upperVal = value.toUpperCase();
    if (upperVal !== '' && upperVal !== 'A' && isNaN(upperVal)) return;
    if (upperVal !== 'A' && upperVal !== '' && parseFloat(upperVal) > totalMarks) return;
    setMarksData(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [questionId]: upperVal },
    }));
  };

  const calculatePartTotal = (studentId, questions) => {
    const studentMarks = marksData[studentId] || {};
    return questions.reduce((sum, q) => {
      const val = studentMarks[q.id];
      if (val && val !== 'A' && !isNaN(val)) return sum + parseFloat(val);
      return sum;
    }, 0);
  };

  const handleSave = () => {
    console.log('Saving Semester Final:', { partAQuestions, partBQuestions, marksData });
    alert('Semester Final marks saved successfully!');
  };

  const renderQuestionSection = (part, questions) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Part {part}
          <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
            ({questions.length} question{questions.length !== 1 ? 's' : ''})
          </span>
        </h3>
        <button onClick={() => { setShowAddForm(part); setNewQuestion({ no: '', co: 'CO1', po: 'PO1', totalMarks: '' }); }}
          className="flex items-center px-3 py-1.5 bg-ruet-blue text-white rounded-md text-sm font-medium hover:bg-ruet-dark transition-colors">
          <Plus size={16} className="mr-1" /> Add Question
        </button>
      </div>

      {questions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {questions.map(q => (
            <div key={q.id} className="flex items-center bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm">
              <div className="mr-3">
                <span className="font-bold text-blue-800 dark:text-blue-300">Q{q.no}</span>
                <span className="text-blue-600 dark:text-blue-400 text-xs ml-2">{q.co} → {q.po} · {q.totalMarks}m</span>
              </div>
              <button onClick={() => handleRemoveQuestion(part, q.id)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Semester Final Marking</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">CSE 3101 — Database Systems (Section A, 2021 Series)</p>
          </div>
          {allQuestions.length > 0 && (
            <button onClick={handleSave}
              className="flex items-center px-4 py-2 bg-ruet-blue text-white rounded-md text-sm font-medium hover:bg-ruet-dark transition-colors">
              <Save size={16} className="mr-2" /> Save All Marks
            </button>
          )}
        </div>

        <div className="space-y-6">
          {renderQuestionSection('A', partAQuestions)}
          <hr className="border-gray-200 dark:border-gray-700" />
          {renderQuestionSection('B', partBQuestions)}
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-5 border-b border-gray-200 dark:border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add Question — Part {showAddForm}</h3>
              <button onClick={() => setShowAddForm(null)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Question No.</label>
                <input type="text" placeholder="e.g. 1(a)" value={newQuestion.no}
                  onChange={e => setNewQuestion({ ...newQuestion, no: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">CO</label>
                  <select value={newQuestion.co} onChange={e => setNewQuestion({ ...newQuestion, co: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue">
                    {coOptions.map(c => <option key={c} value={c} className="dark:bg-gray-800">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">PO</label>
                  <select value={newQuestion.po} onChange={e => setNewQuestion({ ...newQuestion, po: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue">
                    {poOptions.map(p => <option key={p} value={p} className="dark:bg-gray-800">{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Total Marks</label>
                <input type="number" min="1" placeholder="e.g. 15" value={newQuestion.totalMarks}
                  onChange={e => setNewQuestion({ ...newQuestion, totalMarks: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue" />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                <button onClick={() => setShowAddForm(null)} className="px-4 py-2 border rounded text-gray-600 dark:text-gray-300 dark:border-gray-700">Cancel</button>
                <button onClick={() => handleAddQuestion(showAddForm)} disabled={!newQuestion.no || !newQuestion.totalMarks}
                  className="px-4 py-2 bg-ruet-blue text-white rounded hover:bg-ruet-dark font-medium disabled:opacity-40 disabled:cursor-not-allowed">Add</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {allQuestions.length > 0 && (
        <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-xs font-medium mb-4">
            <AlertCircle size={14} className="mr-2 flex-shrink-0" /> Type <strong className="font-mono mx-1">A</strong> to mark absent (counts as 0).
          </div>

          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
                <tr>
                  <th rowSpan="3" className="sticky left-0 z-20 bg-gray-50 dark:bg-[#2d2d2d] px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase border-r border-b border-gray-200 dark:border-gray-700">
                    ID
                  </th>
                  {partAQuestions.length > 0 && (
                    <th colSpan={partAQuestions.length} className="px-2 py-1.5 text-center text-xs font-bold text-blue-700 dark:text-blue-300 uppercase border-r border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
                      Part A
                    </th>
                  )}
                  {partBQuestions.length > 0 && (
                    <th colSpan={partBQuestions.length} className="px-2 py-1.5 text-center text-xs font-bold text-purple-700 dark:text-purple-300 uppercase border-r border-b border-gray-200 dark:border-gray-700 bg-purple-50 dark:bg-purple-900/20">
                      Part B
                    </th>
                  )}
                  <th rowSpan="3" className="px-4 py-2 text-center text-xs font-bold text-ruet-blue dark:text-blue-400 uppercase bg-blue-50 dark:bg-ruet-dark/20 border-b border-gray-200 dark:border-gray-700">
                    Total
                  </th>
                </tr>
                <tr>
                  {allQuestions.map(q => (
                    <th key={q.id} className="px-3 py-1.5 text-center text-xs font-bold text-gray-700 dark:text-gray-200 border-r border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 whitespace-nowrap">
                      Q{q.no} ({q.totalMarks})
                    </th>
                  ))}
                </tr>
                <tr>
                  {allQuestions.map(q => (
                    <th key={q.id} className="px-3 py-1 text-center text-[10px] font-medium text-purple-600 dark:text-purple-400 border-r border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                      {q.co} · {q.po}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
                {mockStudents.map(student => {
                  const total = allQuestions.reduce((sum, q) => {
                    const val = marksData[student.id]?.[q.id];
                    if (val && val !== 'A' && !isNaN(val)) return sum + parseFloat(val);
                    return sum;
                  }, 0);
                  return (
                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 group">
                      <td className="sticky left-0 z-10 bg-white dark:bg-[#1e1e1e] group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50 px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col">
                          <span className="font-mono">{student.id}</span>
                          <span className="text-xs text-gray-400 font-normal">{student.name}</span>
                        </div>
                      </td>
                      {allQuestions.map(q => (
                        <td key={q.id} className="p-0 border-r border-gray-200 dark:border-gray-700 text-center">
                          <input type="text" placeholder="-"
                            value={(marksData[student.id]?.[q.id]) || ''}
                            onChange={e => handleCellChange(student.id, q.id, e.target.value, q.totalMarks)}
                            className="w-full h-full min-h-[52px] text-center bg-transparent border-none focus:ring-2 focus:ring-inset focus:ring-ruet-blue dark:text-white outline-none caret-ruet-blue font-mono text-sm" />
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center text-sm font-bold text-ruet-blue dark:text-blue-400 bg-blue-50/30 dark:bg-ruet-dark/10">
                        {total.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SemesterFinalMarking;
