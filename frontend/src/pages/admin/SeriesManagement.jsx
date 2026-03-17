import React, { useState } from 'react';
import { Plus, Trash2, Calendar } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';

const defaultSeries = ['2020', '2021', '2022', '2023', '2024'];

const SeriesManagement = () => {
  const [seriesList, setSeriesList] = useState(defaultSeries);
  const [newSeries, setNewSeries] = useState('');
  const [confirm, setConfirm] = useState({ open: false, seriesVal: '' });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newSeries || seriesList.includes(newSeries)) return;
    setSeriesList([...seriesList, newSeries].sort());
    setNewSeries('');
  };

  const handleDeleteClick = (val) => {
    setConfirm({ open: true, seriesVal: val });
  };

  const handleDeleteConfirm = () => {
    setSeriesList(seriesList.filter(s => s !== confirm.seriesVal));
    setConfirm({ open: false, seriesVal: '' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Manage Series</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Add or remove student series years. Changes will reflect across the entire system.</p>
      </div>

      <form onSubmit={handleAdd} className="flex items-end gap-3">
        <div className="flex-1 max-w-xs">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">New Series Year</label>
          <input
            type="text"
            pattern="^\d{4}$"
            title="Enter a 4-digit year (e.g. 2025)"
            required
            placeholder="e.g. 2025"
            value={newSeries}
            onChange={e => setNewSeries(e.target.value)}
            className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue dark:bg-[#2d2d2d]"
          />
        </div>
        <button type="submit" className="flex items-center px-4 py-2.5 bg-ruet-blue text-white rounded-md hover:bg-ruet-dark transition-colors font-medium">
          <Plus size={18} className="mr-2" /> Add Series
        </button>
      </form>

      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg border border-gray-100 dark:border-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Active Series ({seriesList.length})</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
          {seriesList.map(s => (
            <div key={s} className="flex items-center justify-between bg-gray-50 dark:bg-[#2d2d2d] rounded-lg p-4 border border-gray-200 dark:border-gray-700 group hover:border-ruet-blue dark:hover:border-blue-500 transition-colors">
              <div className="flex items-center space-x-2">
                <Calendar size={16} className="text-ruet-blue dark:text-blue-400" />
                <span className="font-bold text-gray-900 dark:text-white">{s}</span>
              </div>
              <button
                onClick={() => handleDeleteClick(s)}
                className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                title="Remove series"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirm.open}
        title="Delete Series"
        message={`Are you sure you want to remove series "${confirm.seriesVal}"? This may affect students and courses linked to this series.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirm({ open: false, seriesVal: '' })}
      />
    </div>
  );
};

export default SeriesManagement;
export { defaultSeries };
