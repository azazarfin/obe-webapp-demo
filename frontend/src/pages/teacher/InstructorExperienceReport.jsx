import React, { useState } from 'react';
import { Save } from 'lucide-react';

const InstructorExperienceReport = ({ onBack }) => {
  const [ratings, setRatings] = useState({
    infrastructure: 3,
    studentEngagement: 3,
    curriculumRelevance: 3,
  });
  
  const [remarks, setRemarks] = useState({
    challenges: '',
    suggestions: ''
  });

  const handleRatingChange = (key, val) => {
    setRatings(prev => ({ ...prev, [key]: val }));
  };

  const handleRemarkChange = (key, val) => {
    setRemarks(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting Experience Report:', { ratings, remarks });
    alert('Experience Report Saved Successfully!');
    if (onBack) onBack();
  };

  return (
    <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Instructor Experience Report</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Class: CSE 3101 (Section A, 2021 Series)</p>
        </div>
        {onBack && (
          <button onClick={onBack} className="text-sm text-gray-600 dark:text-gray-400 hover:text-ruet-blue dark:hover:text-white font-medium">
            &larr; Back
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Rating Metrics */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Evaluation Attributes (1-5)</h3>
          <div className="space-y-5">
            {[
              { id: 'infrastructure', label: 'Adequacy of Lab/Classroom Infrastructure' },
              { id: 'studentEngagement', label: 'Overall Student Engagement & Response' },
              { id: 'curriculumRelevance', label: 'Alignment of Curriculum with Modern Needs' }
            ].map(metric => (
              <div key={metric.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                <span className="font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-0 w-2/3">{metric.label}</span>
                <div className="flex items-center space-x-1 w-1/3 justify-end">
                  {[1, 2, 3, 4, 5].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleRatingChange(metric.id, val)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${ratings[metric.id] === val ? 'bg-ruet-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Written Remarks */}
        <div>
           <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Qualitative Feedback</h3>
           <div className="space-y-4">
              <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key Challenges Faced</label>
                 <textarea 
                    rows="3"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-ruet-blue focus:border-transparent outline-none transition-colors"
                    placeholder="E.g., Students lacked prerequisite knowledge in XYZ..."
                    value={remarks.challenges}
                    onChange={(e) => handleRemarkChange('challenges', e.target.value)}
                 ></textarea>
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Suggestions for Next Year / Curriculum Updates</label>
                 <textarea 
                    rows="3"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-ruet-blue focus:border-transparent outline-none transition-colors"
                    placeholder="E.g., Recommend adding a lab module on Cloud databases..."
                    value={remarks.suggestions}
                    onChange={(e) => handleRemarkChange('suggestions', e.target.value)}
                 ></textarea>
              </div>
           </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit"
            className="flex items-center px-6 py-2.5 bg-ruet-blue text-white rounded-md text-sm font-medium hover:bg-ruet-dark transition-colors"
          >
            <Save size={16} className="mr-2" />
            Submit Final Report
          </button>
        </div>

      </form>
    </div>
  );
};

export default InstructorExperienceReport;
