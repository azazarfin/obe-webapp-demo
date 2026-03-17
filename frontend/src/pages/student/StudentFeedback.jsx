import React, { useState } from 'react';
import { Send } from 'lucide-react';

const StudentFeedback = ({ courseName, onBack }) => {
  const [ratings, setRatings] = useState({
    q1: null,
    q2: null,
    q3: null,
    q4: null,
    q5: null,
  });

  const [submitted, setSubmitted] = useState(false);

  const questions = [
    { id: 'q1', text: 'The course objectives were clear.' },
    { id: 'q2', text: 'The instructor explained concepts effectively.' },
    { id: 'q3', text: 'The assessments aligned with the taught material.' },
    { id: 'q4', text: 'The course materials provided were helpful.' },
    { id: 'q5', text: 'Overall, I am satisfied with this course.' },
  ];

  const handleRatingChange = (id, value) => {
    setRatings(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting Feedback:', ratings);
    // TODO: Send to backend
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-8 border border-gray-100 dark:border-gray-800 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thank You!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Your anonymous feedback has been successfully submitted.</p>
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-ruet-blue text-white rounded-md hover:bg-ruet-dark transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Give Feedback</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Course: {courseName || 'CSE 3101 - Database Systems'}</p>
        </div>
        {onBack && (
          <button onClick={onBack} className="text-sm text-gray-600 dark:text-gray-400 hover:text-ruet-blue dark:hover:text-white font-medium">
            &larr; Back
          </button>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-md text-sm mb-6 border border-blue-100 dark:border-blue-800/50">
        <strong>Note:</strong> Your responses here are completely anonymous and will only be used to evaluate the achievement of Course Outcomes and improve future offerings.
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="border-b border-gray-100 dark:border-gray-800 pb-5">
              <p className="font-medium text-gray-800 dark:text-gray-200 mb-3">{idx + 1}. {q.text}</p>
              <div className="flex flex-wrap gap-4">
                {[
                  { val: 1, label: 'Strongly Disagree' },
                  { val: 2, label: 'Disagree' },
                  { val: 3, label: 'Neutral' },
                  { val: 4, label: 'Agree' },
                  { val: 5, label: 'Strongly Agree' },
                ].map((option) => (
                  <label key={option.val} className="flex items-center space-x-2 cursor-pointer group">
                    <input 
                      type="radio" 
                      name={q.id} 
                      value={option.val}
                      checked={ratings[q.id] === option.val}
                      onChange={() => handleRatingChange(q.id, option.val)}
                      required
                      className="w-4 h-4 text-ruet-blue border-gray-300 focus:ring-ruet-blue dark:bg-[#2d2d2d] dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            type="submit"
            className="flex items-center px-6 py-2.5 bg-ruet-blue text-white rounded-md text-sm font-medium hover:bg-ruet-dark transition-colors"
          >
            <Send size={16} className="mr-2" />
            Submit Feedback
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentFeedback;
