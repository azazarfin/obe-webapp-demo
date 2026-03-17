import React from 'react';
import { Target, MessageSquare, AlertCircle } from 'lucide-react';

const mockReviews = [
  {
    courseName: 'CSE 3101 - Database Systems (Sec A)',
    teacher: 'Dr. John Doe',
    ratings: { infra: 4, eng: 4, curr: 3 },
    suggestion: 'Recommend adding a lab module on NoSQL databases; current syllabus is slightly outdated for modern industry needs.'
  },
  {
    courseName: 'CSE 2101 - Data Structures (Sec B)',
    teacher: 'Jane Smith',
    ratings: { infra: 3, eng: 5, curr: 5 },
    suggestion: 'Students struggled with advanced sorting algorithms initially. Extra tutorial sessions helped.'
  },
  {
    courseName: 'CSE 4105 - Artificial Intelligence (Sec A)',
    teacher: 'Prof. Alan Turing',
    ratings: { infra: 2, eng: 4, curr: 4 },
    suggestion: 'Lab PCs are struggling to train minor ML models. We need infrastructure upgrades immediately.'
  }
];

const CourseReviewHub = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
         <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Curriculum & Course Review Hub</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Aggregated Instructor Experience Reports</p>
         </div>
         <div className="flex space-x-2">
            <select className="border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1e1e1e] text-sm py-1.5 px-3 focus:outline-none dark:text-white">
               <option>Current Year</option>
               <option>2022-2023</option>
            </select>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
         <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center space-x-3 text-ruet-blue dark:text-blue-400 mb-2">
               <Target size={20} />
               <span className="font-semibold text-gray-700 dark:text-gray-200">Avg. Curriculum Suitability</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white">4.0 <span className="text-sm font-normal text-gray-500">/ 5</span></p>
         </div>
         <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center space-x-3 text-orange-500 dark:text-orange-400 mb-2">
               <AlertCircle size={20} />
               <span className="font-semibold text-gray-700 dark:text-gray-200">Infra. Satisfaction</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white">3.0 <span className="text-sm font-normal text-gray-500">/ 5</span></p>
            <p className="text-xs text-red-500 mt-1">Requires immediate attention in Labs</p>
         </div>
         <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center space-x-3 text-green-500 dark:text-green-400 mb-2">
               <MessageSquare size={20} />
               <span className="font-semibold text-gray-700 dark:text-gray-200">Reports Submitted</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white">45 <span className="text-sm font-normal text-gray-500">instances</span></p>
         </div>
      </div>

      <div className="space-y-4">
         <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Recent Suggestions</h3>
         
         {mockReviews.map((review, idx) => (
            <div key={idx} className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 rounded-lg p-5 hover:shadow-md transition-shadow">
               <div className="flex justify-between items-start mb-3">
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
               <div className="mt-3 text-right">
                  <button className="text-sm text-ruet-blue hover:underline font-medium">View Full Report &rarr;</button>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};

export default CourseReviewHub;
