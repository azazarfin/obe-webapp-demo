import React, { useState } from 'react';
import { Save, AlertCircle, Plus, X } from 'lucide-react';

const mockStudents = [
  { id: '2103001', name: 'Rahim Uddin' },
  { id: '2103002', name: 'Karim Hasan' },
  { id: '2103003', name: 'Sadia Rahman' },
  { id: '2103004', name: 'Tamim Iqbal' },
  { id: '2103005', name: 'Nadia Sultana' },
];

const THEORY_TYPES = ['Class Test', 'Assignment', 'Presentation', 'Quiz'];

const AddAssessment = () => {
  const [coList, setCoList] = useState(['CO1', 'CO2', 'CO3', 'CO4', 'CO5']);
  const [showAddCO, setShowAddCO] = useState(false);
  const [newCOName, setNewCOName] = useState('');

  const [formData, setFormData] = useState({
    assessmentType: '',
    customType: '',
    co: 'CO1',
    po: 'PO1',
    title: '',
    date: '',
    totalMarks: '',
  });

  const [showGrid, setShowGrid] = useState(false);
  const [marksData, setMarksData] = useState({});

  const isCustomType = formData.assessmentType === '__custom__';
  const resolvedType = isCustomType ? formData.customType : formData.assessmentType;

  const poOptions = ['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6', 'PO7', 'PO8', 'PO9', 'PO10', 'PO11', 'PO12'];

  const handleAddCO = () => {
    const name = newCOName.trim().toUpperCase();
    if (name && !coList.includes(name)) {
      setCoList([...coList, name]);
      setFormData({ ...formData, co: name });
    }
    setNewCOName('');
    setShowAddCO(false);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!resolvedType) return;
    setShowGrid(true);
  };

  const handleCellChange = (studentId, value) => {
    const upperVal = value.toUpperCase();
    if (upperVal !== '' && upperVal !== 'A' && isNaN(upperVal)) return;
    const total = parseFloat(formData.totalMarks) || 0;
    if (upperVal !== 'A' && upperVal !== '' && parseFloat(upperVal) > total) return;
    setMarksData(prev => ({ ...prev, [studentId]: upperVal }));
  };

  const getNumericMark = (val) => {
    if (!val || val === 'A') return 0;
    return parseFloat(val) || 0;
  };

  const handleSave = () => {
    const payload = {
      type: resolvedType,
      co: formData.co,
      po: formData.po,
      title: formData.title,
      date: formData.date,
      totalMarks: formData.totalMarks,
      marks: Object.entries(marksData).map(([id, val]) => ({
        studentId: id,
        rawValue: val,
        numericMark: getNumericMark(val),
        isAbsent: val === 'A',
      })),
    };
    console.log('Saving Theory Assessment:', payload);
    alert('Assessment saved successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Theory Assessment</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">CSE 3101 — Database Systems (Section A, 2021 Series)</p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Assessment Type</label>
              <select required value={formData.assessmentType}
                onChange={e => setFormData({ ...formData, assessmentType: e.target.value, customType: '' })}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue">
                <option value="" className="dark:bg-gray-800">-- Select Type --</option>
                {THEORY_TYPES.map(t => <option key={t} value={t} className="dark:bg-gray-800">{t}</option>)}
                <option value="__custom__" className="dark:bg-gray-800">Other (Custom...)</option>
              </select>
            </div>

            {isCustomType && (
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Custom Type Name</label>
                <input type="text" required placeholder="e.g. Group Presentation"
                  value={formData.customType}
                  onChange={e => setFormData({ ...formData, customType: e.target.value })}
                  className="w-full p-2.5 border border-orange-300 dark:border-orange-600 rounded-md bg-orange-50 dark:bg-orange-900/10 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">CO (Course Outcome)</label>
              <div className="flex space-x-2">
                <select required value={formData.co}
                  onChange={e => {
                    if (e.target.value === '__add_co__') { setShowAddCO(true); return; }
                    setFormData({ ...formData, co: e.target.value });
                  }}
                  className="flex-1 p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue">
                  {coList.map(c => <option key={c} value={c} className="dark:bg-gray-800">{c}</option>)}
                  <option value="__add_co__" className="dark:bg-gray-800 text-green-600">+ Add New CO</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">PO (Program Outcome)</label>
              <select required value={formData.po}
                onChange={e => setFormData({ ...formData, po: e.target.value })}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue">
                {poOptions.map(p => <option key={p} value={p} className="dark:bg-gray-800">{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Title</label>
              <input type="text" required placeholder="e.g. CT 1"
                value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Date</label>
              <input type="date" required value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Total Marks</label>
              <input type="number" min="1" required placeholder="e.g. 20"
                value={formData.totalMarks} onChange={e => setFormData({ ...formData, totalMarks: e.target.value })}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue" />
            </div>
          </div>

          {!showGrid && (
            <button type="submit" className="px-5 py-2.5 bg-ruet-blue text-white rounded-md hover:bg-ruet-dark font-medium transition-colors">
              Proceed to Marks Entry →
            </button>
          )}
        </form>
      </div>

      {showAddCO && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-lg shadow-xl w-full max-w-sm p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add New CO</h3>
              <button onClick={() => setShowAddCO(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>
            <input type="text" placeholder="e.g. CO6" value={newCOName}
              onChange={e => setNewCOName(e.target.value)}
              className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue mb-4 font-mono uppercase" />
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowAddCO(false)} className="px-4 py-2 border rounded text-gray-600 dark:text-gray-300 dark:border-gray-700">Cancel</button>
              <button onClick={handleAddCO} className="px-4 py-2 bg-ruet-blue text-white rounded hover:bg-ruet-dark font-medium">Add CO</button>
            </div>
          </div>
        </div>
      )}

      {showGrid && (
        <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Marks Entry — {resolvedType}: {formData.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formData.co} → {formData.po} · Total: {formData.totalMarks} marks · Date: {formData.date}
              </p>
            </div>
            <button onClick={handleSave}
              className="flex items-center px-4 py-2 bg-ruet-blue text-white rounded-md text-sm font-medium hover:bg-ruet-dark transition-colors">
              <Save size={16} className="mr-2" /> Save Assessment
            </button>
          </div>

          <div className="flex items-center p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-xs font-medium mb-4">
            <AlertCircle size={14} className="mr-2 flex-shrink-0" /> Type <strong className="font-mono mx-1">A</strong> to mark a student as absent (counts as 0 marks).
          </div>

          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-[#2d2d2d]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-16">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Roll</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-32">
                    Marks (/{formData.totalMarks})
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-24">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1e1e1e] divide-y divide-gray-200 dark:divide-gray-700">
                {mockStudents.map((student, idx) => {
                  const val = marksData[student.id] || '';
                  const isAbsent = val === 'A';
                  return (
                    <tr key={student.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${isAbsent ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white font-mono">{student.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{student.name}</td>
                      <td className="px-4 py-3 text-center">
                        <input type="text" placeholder="-" value={val}
                          onChange={e => handleCellChange(student.id, e.target.value)}
                          className={`w-20 text-center p-1.5 border rounded font-mono text-sm outline-none focus:ring-2 focus:ring-ruet-blue ${
                            isAbsent ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold'
                              : 'border-gray-300 dark:border-gray-600 bg-transparent dark:text-white'
                          }`} />
                      </td>
                      <td className="px-4 py-3 text-center text-xs">
                        {isAbsent ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded font-semibold">Absent</span>
                        ) : val ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded font-semibold">✓</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
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

export default AddAssessment;
