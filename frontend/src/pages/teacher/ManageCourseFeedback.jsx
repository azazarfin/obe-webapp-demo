import React, { useEffect, useState } from 'react';
import { Send, PieChart, Clock, PenTool, Loader2, Download } from 'lucide-react';
import api from '../../utils/api';
import { useHistoryBackedState } from '../../hooks/useHistoryBackedState';
import { exportFeedbackToExcel } from '../../utils/excelExport';

const INITIAL_FEEDBACK_STATE = { activeTab: 'setup' };

const ManageCourseFeedback = ({ classInstance }) => {
  const [isPublished, setIsPublished] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState({ participation: 0, totalStudents: 0, averages: [], suggestions: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
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
          averages: Array.isArray(data.averages) ? data.averages : [],
          suggestions: Array.isArray(data.suggestions) ? data.suggestions : []
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbackData();
  }, [classInstance?._id]);



  const handleExport = async () => {
    if (!classInstance?._id) return;
    try {
      setExporting(true);
      setError('');
      const data = await api.get(`/feedback/class/${classInstance._id}/export-data`);
      const courseName = `${classInstance.course?.courseCode || 'Course'}_Sec_${classInstance.section}_${classInstance.series}`;
      await exportFeedbackToExcel(data.feedbacks, data.questions, courseName);
    } catch (err) {
      setError(err.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleSaveConfig = async (published = isPublished) => {
    if (!classInstance?._id) return;

    try {
      setSaving(true);
      setError('');
      setMessage('');
      await api.put(`/feedback/class/${classInstance._id}/config`, {
        published
      });
      setIsPublished(published);
      setMessage(published ? 'Feedback form published successfully.' : 'Feedback form closed successfully.');
      const data = await api.get(`/feedback/class/${classInstance._id}`);
      setQuestions(Array.isArray(data.questions) ? data.questions : []);
      setIsPublished(Boolean(data.published));
      setResults({
        participation: data.participation || 0,
        totalStudents: data.totalStudents || 0,
        averages: Array.isArray(data.averages) ? data.averages : [],
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : []
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
        <div className="flex justify-center mt-8 mb-4">
          <div className="w-full max-w-md">
            <div className={`p-8 rounded-lg border flex flex-col items-center justify-center text-center shadow-sm ${isPublished ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-gray-50 border-gray-200 dark:bg-[#2d2d2d] dark:border-gray-700'}`}>
              {isPublished ? (
                <>
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-800/50 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-6 shadow-sm">
                    <Send size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-3">Form is Live</h3>
                  <p className="text-gray-600 dark:text-green-500 mb-8">Students can submit anonymous feedback from their portal using the standardized feedback form.</p>
                  <button onClick={handlePublishToggle} disabled={saving} className="w-full py-3 border-2 border-red-500 text-red-600 font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-60 text-lg">Close Feedback Form</button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 mb-6 shadow-sm">
                    <Clock size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-3">Form is Closed</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-8">Publish the standardized feedback form to start collecting responses from students.</p>
                  <button onClick={handlePublishToggle} disabled={saving} className="w-full py-3 bg-ruet-blue text-white font-bold rounded-lg hover:bg-ruet-dark transition-colors disabled:opacity-60 text-lg shadow-sm">Publish Feedback Form</button>
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
            <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Aggregated Ratings (Out of 5)</h3>
              <button 
                onClick={handleExport}
                disabled={exporting || results.participation === 0}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-60 text-sm font-medium shadow-sm"
              >
                {exporting ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Download size={16} className="mr-2" />}
                Export to Excel
              </button>
            </div>
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

          {results.suggestions && results.suggestions.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Student Suggestions</h3>
              <div className="space-y-4">
                {results.suggestions.map((suggestion, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-[#2d2d2d] border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                    <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageCourseFeedback;
