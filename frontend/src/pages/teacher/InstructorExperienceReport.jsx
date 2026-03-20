import React, { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import api from '../../utils/api';

const InstructorExperienceReport = ({ classInstance, onBack }) => {
  const [ratings, setRatings] = useState({
    infrastructure: 3,
    studentEngagement: 3,
    curriculumRelevance: 3
  });
  const [remarks, setRemarks] = useState({
    challenges: '',
    suggestions: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleRatingChange = (key, value) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  const handleRemarkChange = (key, value) => {
    setRemarks((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!classInstance?._id) return;

    try {
      setSaving(true);
      setError('');
      setMessage('');
      await api.post('/instructor-reports', {
        classInstance: classInstance._id,
        ratings: [
          { attribute: 'infrastructure', score: ratings.infrastructure },
          { attribute: 'studentEngagement', score: ratings.studentEngagement },
          { attribute: 'curriculumRelevance', score: ratings.curriculumRelevance }
        ],
        suggestions: {
          teaching: remarks.challenges,
          syllabus: remarks.suggestions
        }
      });
      setMessage('Experience report saved successfully.');
      if (onBack) {
        onBack();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Instructor Experience Report</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Class: {classInstance?.course?.courseCode} (Section {classInstance?.section}, {classInstance?.series} Series)</p>
        </div>
        {onBack && (
          <button onClick={onBack} className="text-sm text-gray-600 dark:text-gray-400 hover:text-ruet-blue dark:hover:text-white font-medium">
            &larr; Back
          </button>
        )}
      </div>

      {message && <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded text-sm mb-4">{message}</div>}
      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded text-sm mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Evaluation Attributes (1-5)</h3>
          <div className="space-y-5">
            {[
              { id: 'infrastructure', label: 'Adequacy of Lab/Classroom Infrastructure' },
              { id: 'studentEngagement', label: 'Overall Student Engagement & Response' },
              { id: 'curriculumRelevance', label: 'Alignment of Curriculum with Modern Needs' }
            ].map((metric) => (
              <div key={metric.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                <span className="font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-0 w-2/3">{metric.label}</span>
                <div className="flex items-center space-x-1 w-1/3 justify-end">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button key={value} type="button" onClick={() => handleRatingChange(metric.id, value)} className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${ratings[metric.id] === value ? 'bg-ruet-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}>
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Qualitative Feedback</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key Challenges Faced</label>
              <textarea rows="3" className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-ruet-blue focus:border-transparent outline-none transition-colors" placeholder="E.g., Students lacked prerequisite knowledge in XYZ..." value={remarks.challenges} onChange={(e) => handleRemarkChange('challenges', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Suggestions for Next Year / Curriculum Updates</label>
              <textarea rows="3" className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-ruet-blue focus:border-transparent outline-none transition-colors" placeholder="E.g., Recommend adding a lab module on Cloud databases..." value={remarks.suggestions} onChange={(e) => handleRemarkChange('suggestions', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={saving} className="flex items-center px-6 py-2.5 bg-ruet-blue text-white rounded-md text-sm font-medium hover:bg-ruet-dark transition-colors disabled:opacity-60">
            {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
            Submit Final Report
          </button>
        </div>
      </form>
    </div>
  );
};

export default InstructorExperienceReport;
