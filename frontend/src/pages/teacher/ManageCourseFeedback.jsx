import React, { useEffect, useState } from 'react';
import { Send, PieChart, Clock, PenTool, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import { useHistoryBackedState } from '../../hooks/useHistoryBackedState';

const INITIAL_FEEDBACK_STATE = { activeTab: 'setup' };

const ManageCourseFeedback = ({ classInstance }) => {
  const [isPublished, setIsPublished] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [results, setResults] = useState({ participation: 0, totalStudents: 0, averages: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const historyKey = `course-feedback-${classInstance?._id || 'default'}`;
  const { state: feedbackState, pushState: pushFeedbackState } = useHistoryBackedState(historyKey, INITIAL_FEEDBACK_STATE);
  const activeTab = feedbackState.activeTab;

  useEffect(() => {
    const fetchFeedbackData = async () => {
      if (!classInstance?._id) return;

      try {
        setLoading(true);
        setError('');
        const data = await api.get(`/feedback/class/${classInstance._id}`);
        setQuestions(Array.isArray(data.questions) ? data.questions : []);
        setIsPublished(Boolean(data.published));
        setResults({
          participation: data.participation || 0,
          totalStudents: data.totalStudents || 0,
          averages: Array.isArray(data.averages) ? data.averages : []
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbackData();
  }, [classInstance?._id]);

  const handleAddQuestion = (e) => {
    e.preventDefault();
    if (newQuestion.trim() !== '') {
      setQuestions([...questions, newQuestion.trim()]);
      setNewQuestion('');
    }
  };

  const handleRemoveQuestion = (index) => {
    setQuestions(questions.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSaveConfig = async (published = isPublished) => {
    if (!classInstance?._id) return;

    try {
      setSaving(true);
      setError('');
      setMessage('');
      await api.put(`/feedback/class/${classInstance._id}/config`, {
        questions,
        published
      });
      setIsPublished(published);
      setMessage(published ? 'Feedback form published successfully.' : 'Feedback configuration saved.');
      const data = await api.get(`/feedback/class/${classInstance._id}`);
      setQuestions(Array.isArray(data.questions) ? data.questions : []);
      setIsPublished(Boolean(data.published));
      setResults({
        participation: data.participation || 0,
        totalStudents: data.totalStudents || 0,
        averages: Array.isArray(data.averages) ? data.averages : []
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async () => {
    await handleSaveConfig(!isPublished);
  };

  if (!classInstance) {
    return null;
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-ruet-blue" size={28} /></div>;
  }

  return (
    <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
      <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-800 pb-4 gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Student Course Feedback</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Class: {classInstance.course?.courseCode} (Section {classInstance.section}, {classInstance.series} Series)</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => pushFeedbackState((currentState) => ({ ...currentState, activeTab: 'setup' }))} className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'setup' ? 'bg-ruet-blue text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'}`}>Form Setup</button>
          <button onClick={() => pushFeedbackState((currentState) => ({ ...currentState, activeTab: 'results' }))} className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'results' ? 'bg-ruet-blue text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'}`}>View Results</button>
        </div>
      </div>

      {message && <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded text-sm mb-4">{message}</div>}
      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded text-sm mb-4">{error}</div>}

      {activeTab === 'setup' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 flex items-center">
                  <PenTool className="mr-2" size={18} /> Edit Questionnaire
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">These questions are shown to students on a 1-5 scale.</p>
              </div>
              <button onClick={() => handleSaveConfig(false)} disabled={saving || isPublished} className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60">
                Save Draft
              </button>
            </div>

            <ul className="space-y-3">
              {questions.map((question, index) => (
                <li key={`${question}-${index}`} className="flex justify-between items-center bg-gray-50 dark:bg-[#2d2d2d] p-3 rounded-md border border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">{index + 1}. {question}</span>
                  <button onClick={() => handleRemoveQuestion(index)} disabled={isPublished || saving} className="text-red-500 hover:text-red-700 text-sm font-bold px-2 disabled:opacity-50">X</button>
                </li>
              ))}
            </ul>

            <form onSubmit={handleAddQuestion} className="flex mt-4">
              <input type="text" placeholder="Type a new custom question..." value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} disabled={isPublished || saving} className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-white outline-none focus:border-ruet-blue disabled:opacity-50" />
              <button disabled={isPublished || saving} type="submit" className="bg-gray-200 text-gray-800 px-4 rounded-r-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50">Add</button>
            </form>
          </div>

          <div className="col-span-1">
            <div className={`p-6 rounded-lg border flex flex-col items-center justify-center h-full text-center ${isPublished ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-gray-50 border-gray-200 dark:bg-[#2d2d2d] dark:border-gray-700'}`}>
              {isPublished ? (
                <>
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-800/50 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
                    <Send size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">Form is Live</h3>
                  <p className="text-sm text-green-600 dark:text-green-500 mb-6">Students can submit anonymous feedback from their portal.</p>
                  <button onClick={handlePublishToggle} disabled={saving} className="w-full py-2 border border-red-500 text-red-600 font-bold rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-60">Close Form</button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 mb-4">
                    <Clock size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Form is Closed</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Edit your questions, save the draft, then publish when you are ready to collect feedback.</p>
                  <button onClick={handlePublishToggle} disabled={saving || questions.length === 0} className="w-full py-2 bg-ruet-blue text-white font-bold rounded-md hover:bg-ruet-dark transition-colors disabled:opacity-60">Publish Form</button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-ruet-dark/20 border border-blue-100 dark:border-blue-900 rounded-lg">
            <div className="flex items-center">
              <PieChart className="text-ruet-blue mr-3" size={32} />
              <div>
                <h3 className="font-bold text-lg text-ruet-blue dark:text-blue-300">Participation Rate</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Anonymous submissions mode</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-extrabold text-ruet-blue dark:text-blue-400">{results.participation} <span className="text-lg text-gray-500 font-normal">/ {results.totalStudents}</span></span>
              <p className="text-xs font-bold text-green-600 mt-1">{results.totalStudents > 0 ? ((results.participation / results.totalStudents) * 100).toFixed(1) : '0.0'}% Completed</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Aggregated Ratings (Out of 5)</h3>
            <div className="space-y-4">
              {questions.length > 0 ? questions.map((question, index) => {
                const average = results.averages[index] || 0;
                return (
                  <div key={`${question}-${index}`} className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">{question}</p>
                    <div className="flex items-center">
                      <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mr-4">
                        <div className={`${average >= 4 ? 'bg-green-500' : average >= 3 ? 'bg-yellow-500' : 'bg-red-500'} h-full rounded-full`} style={{ width: `${(average / 5) * 100}%` }} />
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white">{average.toFixed(1)} <span className="text-gray-400 text-xs">/ 5</span></span>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No questionnaire has been configured for this class yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCourseFeedback;
