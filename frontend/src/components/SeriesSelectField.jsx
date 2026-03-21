import React, { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';

const ADD_NEW_SERIES_VALUE = '__add_new_series__';

const SeriesSelectField = ({
  label = 'Series (Year)',
  value,
  onChange,
  options = [],
  onAddSeries,
  required = false,
  disabled = false,
  placeholder = 'Select...'
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSeries, setNewSeries] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSelectChange = (event) => {
    const nextValue = event.target.value;
    if (nextValue === ADD_NEW_SERIES_VALUE) {
      setShowAddForm(true);
      setError('');
      return;
    }

    onChange(nextValue);
  };

  const handleAddSeries = async () => {
    if (!onAddSeries || !newSeries.trim()) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      const createdSeries = await onAddSeries(newSeries.trim());
      onChange(createdSeries);
      setNewSeries('');
      setShowAddForm(false);
    } catch (err) {
      setError(err.message || 'Unable to add series right now.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select
        required={required}
        value={value || ''}
        disabled={disabled || saving}
        onChange={handleSelectChange}
        className="w-full p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue disabled:opacity-60"
      >
        <option value="">{placeholder}</option>
        {options.map((series) => (
          <option key={series} value={series}>{series}</option>
        ))}
        {onAddSeries && <option value={ADD_NEW_SERIES_VALUE}>+ Add new series</option>}
      </select>

      {showAddForm && (
        <div className="mt-2 space-y-2 rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/40 dark:bg-blue-900/10">
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              pattern="[0-9]{4}"
              value={newSeries}
              onChange={(event) => setNewSeries(event.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="e.g. 2026"
              className="flex-1 p-2 border rounded dark:bg-[#2d2d2d] dark:border-gray-700 outline-none focus:border-ruet-blue"
            />
            <button
              type="button"
              onClick={handleAddSeries}
              disabled={saving || newSeries.length !== 4}
              className="inline-flex items-center rounded-md bg-ruet-blue px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-ruet-dark disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-blue-700 dark:text-blue-300">Add a 4-digit series year without leaving this form.</p>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewSeries('');
                setError('');
              }}
              className="text-xs font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};

export default SeriesSelectField;
