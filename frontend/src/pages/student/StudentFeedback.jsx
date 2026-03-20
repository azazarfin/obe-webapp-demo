import React, { useEffect, useMemo, useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import api from '../../utils/api';

const StudentFeedback = ({ course, onBack }) => {
  const [ratings, setRatings] = useState({});
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [feedbackInfo, setFeedbackInfo] = useState({ published: false, hasSubmitted: false, canSubmit: false });

  useEffect(() => {
    const fetchFeedbackConfig = async () => {
      if (!course?.classInstanceId) {
        return;
      }

      try {
        setLoading(true);
        setError('');
        const data = await api.get(`/feedback/class/${course.classInstanceId}`);
        setQuestions(Array.isArray(data.questions) ? data.questions : []);
        setFeedbackInfo({
          published: Boolean(data.published),
          hasSubmitted: Boolean(data.hasSubmitted),
          canSubmit: Boolean(data.canSubmit)
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbackConfig();
  }, [course]);

  const questionEntries = useMemo(() => questions.map((text, index) => ({
    id: `q${index + 1}`,
    text
  })), [questions]);

  const handleRatingChange = (id, value) => {
    setRatings((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!course?.classInstanceId) return;

    try {
      setSubmitting(true);
      setError('');
      await api.post(`/feedback/class/${course.classInstanceId}/submit`, {
        ratings: questionEntries.map((question) => ({
          attribute: question.text,
          score: ratings[question.id]
        }))
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted || feedbackInfo.hasSubmitted) {
    return (
      <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-8 border border-gray-100 dark:border-gray-800 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thank You!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Your anonymous feedback has already been recorded for this course.</p>
        <button onClick={onBack} className="px-4 py-2 bg-ruet-blue text-white rounded-md hover:bg-ruet-dark transition-colors">Return to Dashboard</button>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-ruet-blue" size={28} /></div>;
  }

  return (
    <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Give Feedback</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Course: {course ? `${course.code} - ${course.name}` : 'Unknown Course'}</p>
        </div>
        {onBack && (
          <button onClick={onBack} className="text-sm text-gray-600 dark:text-gray-400 hover:text-ruet-blue dark:hover:text-white font-medium">
            &larr; Back
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded text-sm mb-4">{error}</div>}

      {!feedbackInfo.published ? (
        <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-4 rounded-md text-sm border border-amber-100 dark:border-amber-800/50">
          The feedback form for this course is currently closed.
        </div>
      ) : (
        <>
          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-md text-sm mb-6 border border-blue-100 dark:border-blue-800/50">
            <strong>Note:</strong> Your responses are stored anonymously for quality improvement and course evaluation.
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {questionEntries.map((question, index) => (
                <div key={question.id} className="border-b border-gray-100 dark:border-gray-800 pb-5">
                  <p className="font-medium text-gray-800 dark:text-gray-200 mb-3">{index + 1}. {question.text}</p>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { val: 1, label: 'Strongly Disagree' },
                      { val: 2, label: 'Disagree' },
                      { val: 3, label: 'Neutral' },
                      { val: 4, label: 'Agree' },
                      { val: 5, label: 'Strongly Agree' }
                    ].map((option) => (
                      <label key={option.val} className="flex items-center space-x-2 cursor-pointer group">
                        <input
                          type="radio"
                          name={question.id}
                          value={option.val}
                          checked={ratings[question.id] === option.val}
                          onChange={() => handleRatingChange(question.id, option.val)}
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
              <button type="submit" disabled={submitting || !feedbackInfo.canSubmit} className="flex items-center px-6 py-2.5 bg-ruet-blue text-white rounded-md text-sm font-medium hover:bg-ruet-dark transition-colors disabled:opacity-60">
                {submitting ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Send size={16} className="mr-2" />}
                Submit Feedback
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default StudentFeedback;
