import React, { useEffect, useMemo, useState } from 'react';
import { Target, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

const averageForAttribute = (reports, attribute) => {
  const scores = reports
    .map((report) => report.ratings?.find((rating) => rating.attribute === attribute)?.score)
    .filter((score) => typeof score === 'number');

  if (scores.length === 0) {
    return 0;
  }

  const total = scores.reduce((sum, score) => sum + score, 0);
  return Number((total / scores.length).toFixed(1));
};

const CourseReviewHub = () => {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const departmentId = currentUser?.department?._id;
        const endpoint = departmentId
          ? `/instructor-reports?department=${departmentId}`
          : '/instructor-reports';
        const data = await api.get(endpoint);
        setReports(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchReports();
    }
  }, [currentUser]);

  const stats = useMemo(() => ({
    curriculum: averageForAttribute(reports, 'curriculumRelevance'),
    infrastructure: averageForAttribute(reports, 'infrastructure'),
    reportsSubmitted: reports.length
  }), [reports]);

  const recentSuggestions = useMemo(() => reports.flatMap((report) => {
    const suggestions = [];
    const suggestionEntries = [
      report.suggestions?.syllabus,
      report.suggestions?.teaching,
      report.suggestions?.resources,
      report.suggestions?.assessment
    ].filter(Boolean);

    suggestionEntries.forEach((suggestion) => {
      suggestions.push({
        id: `${report._id}-${suggestion}`,
        courseName: `${report.classInstance?.course?.courseCode || ''} - ${report.classInstance?.course?.courseName || ''} (Sec ${report.classInstance?.section || 'N/A'})`,
        teacher: report.teacher?.name || report.classInstance?.teacher?.name || 'Unknown',
        suggestion,
        ratings: {
          curr: report.ratings?.find((rating) => rating.attribute === 'curriculumRelevance')?.score || 0,
          infra: report.ratings?.find((rating) => rating.attribute === 'infrastructure')?.score || 0
        }
      });
    });

    return suggestions;
  }).slice(0, 10), [reports]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Curriculum &amp; Course Review Hub</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Aggregated instructor experience reports from the database.</p>
        </div>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded text-sm">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-ruet-blue" size={28} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center space-x-3 text-ruet-blue dark:text-blue-400 mb-2">
                <Target size={20} />
                <span className="font-semibold text-gray-700 dark:text-gray-200">Avg. Curriculum Suitability</span>
              </div>
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats.curriculum.toFixed(1)} <span className="text-sm font-normal text-gray-500">/ 5</span></p>
            </div>

            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center space-x-3 text-orange-500 dark:text-orange-400 mb-2">
                <AlertCircle size={20} />
                <span className="font-semibold text-gray-700 dark:text-gray-200">Infra. Satisfaction</span>
              </div>
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats.infrastructure.toFixed(1)} <span className="text-sm font-normal text-gray-500">/ 5</span></p>
              <p className="text-xs text-red-500 mt-1">{stats.infrastructure < 3 ? 'Requires attention based on submitted reports.' : 'Infrastructure is trending acceptable.'}</p>
            </div>

            <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center space-x-3 text-green-500 dark:text-green-400 mb-2">
                <MessageSquare size={20} />
                <span className="font-semibold text-gray-700 dark:text-gray-200">Reports Submitted</span>
              </div>
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{stats.reportsSubmitted} <span className="text-sm font-normal text-gray-500">instances</span></p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Recent Suggestions</h3>

            {recentSuggestions.length === 0 ? (
              <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 rounded-lg p-6 text-sm text-gray-500 dark:text-gray-400">
                No instructor reports have been submitted yet.
              </div>
            ) : (
              recentSuggestions.map((review) => (
                <div key={review.id} className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3 gap-3">
                    <div>
                      <h4 className="font-bold text-ruet-blue dark:text-blue-400 text-lg">{review.courseName}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Instructor: {review.teacher}</p>
                    </div>
                    <div className="flex space-x-2 text-xs">
                      <span className={`px-2 py-1 rounded-full ${review.ratings.curr < 4 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
                        Curriculum: {review.ratings.curr}/5
                      </span>
                      <span className={`px-2 py-1 rounded-full ${review.ratings.infra < 3 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                        Infra: {review.ratings.infra}/5
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#2d2d2d] border-l-4 border-ruet-blue p-3 rounded-r-md">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Recommendation:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">{review.suggestion}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CourseReviewHub;
