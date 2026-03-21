import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Calendar, Loader2 } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import api from '../../utils/api';

const SeriesManagement = () => {
  const [seriesList, setSeriesList] = useState([]);
  const [newSeries, setNewSeries] = useState('');
  const [confirm, setConfirm] = useState({ open: false, seriesVal: '', id: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchSeries = async () => {
    try {
      setLoading(true);
      const data = await api.get('/series');
      setSeriesList(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeries();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newSeries) return;

    try {
      setSaving(true);
      setError('');
      await api.post('/series', { year: newSeries });
      setNewSeries('');
      await fetchSeries();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (series) => {
    setConfirm({ open: true, seriesVal: series.year, id: series._id });
  };

  const handleDeleteConfirm = async () => {
    try {
      setSaving(true);
      setError('');
      await api.del(`/series/${confirm.id}`);
      await fetchSeries();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
      setConfirm({ open: false, seriesVal: '', id: null });
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-ruet-blue" size={28} /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Manage Series</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Add or remove the available student series years used across the system.</p>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded text-sm">{error}</div>}

      <form onSubmit={handleAdd} className="flex items-end gap-3">
        <div className="flex-1 max-w-xs">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">New Series Year</label>
          <input type="text" inputMode="numeric" maxLength={4} pattern="[0-9]{4}" title="Enter a 4-digit year (e.g. 2025)" required placeholder="e.g. 2025" value={newSeries} onChange={(e) => setNewSeries(e.target.value.replace(/\D/g, '').slice(0, 4))} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-ruet-blue dark:bg-[#2d2d2d]" />
        </div>
        <button type="submit" disabled={saving} className="flex items-center px-4 py-2.5 bg-ruet-blue text-white rounded-md hover:bg-ruet-dark transition-colors font-medium disabled:opacity-60">
          <Plus size={18} className="mr-2" /> Add Series
        </button>
      </form>

      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg border border-gray-100 dark:border-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Active Series ({seriesList.length})</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
          {seriesList.map((series) => (
            <div key={series._id} className="flex items-center justify-between bg-gray-50 dark:bg-[#2d2d2d] rounded-lg p-4 border border-gray-200 dark:border-gray-700 group hover:border-ruet-blue dark:hover:border-blue-500 transition-colors">
              <div className="flex items-center space-x-2">
                <Calendar size={16} className="text-ruet-blue dark:text-blue-400" />
                <span className="font-bold text-gray-900 dark:text-white">{series.year}</span>
              </div>
              <button onClick={() => handleDeleteClick(series)} disabled={saving} className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50" title="Remove series">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirm.open}
        title="Delete Series"
        message={`Are you sure you want to remove series "${confirm.seriesVal}" from the available list?`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirm({ open: false, seriesVal: '', id: null })}
      />
    </div>
  );
};

export default SeriesManagement;
