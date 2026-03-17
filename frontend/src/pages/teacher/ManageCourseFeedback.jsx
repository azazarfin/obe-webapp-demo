import React, { useState } from 'react';
import { Send, PieChart, Clock, PenTool } from 'lucide-react';

const mockQuestions = [
  "Does the teacher clearly explain the concepts?",
  "Is the syllabus material up to date?",
  "Are the assessments fair and aligned with what was taught?",
  "Are teaching-learning facilities (labs, projectors) adequate?"
];

const mockResults = {
  active: true,
  participation: 45,
  totalStudents: 60,
  averages: [4.2, 3.8, 4.5, 2.9] // out of 5
};

const ManageCourseFeedback = () => {
  const [isPublished, setIsPublished] = useState(mockResults.active);
  const [questions, setQuestions] = useState(mockQuestions);
  const [newQuestion, setNewQuestion] = useState('');
  const [activeTab, setActiveTab] = useState('setup');

  const handleAddQuestion = (e) => {
    e.preventDefault();
    if (newQuestion.trim() !== '') {
      setQuestions([...questions, newQuestion]);
      setNewQuestion('');
    }
  };

  const handleRemoveQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handlePublishToggle = () => {
    setIsPublished(!isPublished);
  };

  return (
    <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 border border-gray-100 dark:border-gray-800">
      <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Student Course Feedback</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Class: CSE 3101 (Section A, 2021 Series)</p>
        </div>
        <div className="flex space-x-2">
            <button 
              onClick={() => setActiveTab('setup')}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'setup' ? 'bg-ruet-blue text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'}`}
            >
              Form Setup
            </button>
            <button 
              onClick={() => setActiveTab('results')}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'results' ? 'bg-ruet-blue text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'}`}
            >
              View Results
            </button>
        </div>
      </div>

      {activeTab === 'setup' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1 md:col-span-2 space-y-4">
            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 flex items-center">
               <PenTool className="mr-2" size={18} /> Edit Questionnaire
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">These questions will be presented to students on a 1-5 Likert scale.</p>
            
            <ul className="space-y-3">
              {questions.map((q, idx) => (
                <li key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-[#2d2d2d] p-3 rounded-md border border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">{idx + 1}. {q}</span>
                  <button onClick={() => handleRemoveQuestion(idx)} disabled={isPublished} className="text-red-500 hover:text-red-700 text-sm font-bold px-2 disabled:opacity-50">X</button>
                </li>
              ))}
            </ul>

            <form onSubmit={handleAddQuestion} className="flex mt-4">
              <input 
                type="text" 
                placeholder="Type a new custom question..." 
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                disabled={isPublished}
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-white outline-none focus:border-ruet-blue disabled:opacity-50"
              />
              <button disabled={isPublished} type="submit" className="bg-gray-200 text-gray-800 px-4 rounded-r-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50">Add</button>
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
                     <p className="text-sm text-green-600 dark:text-green-500 mb-6">Students can currently submit anonymous feedback from their portal.</p>
                     <button onClick={handlePublishToggle} className="w-full py-2 border border-red-500 text-red-600 font-bold rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Close Form</button>
                   </>
                ) : (
                   <>
                     <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 mb-4">
                        <Clock size={32} />
                     </div>
                     <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Form is Closed</h3>
                     <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Edit your questions on the left. Once ready to collect feedback, publish the form.</p>
                     <button onClick={handlePublishToggle} className="w-full py-2 bg-ruet-blue text-white font-bold rounded-md hover:bg-ruet-dark transition-colors">Publish Form</button>
                   </>
                )}
             </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
           <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-ruet-dark/20 border border-blue-100 dark:border-blue-900 rounded-lg">
              <div className="flex items-center">
                 <PieChart className="text-ruet-blue mr-3" size={32}/>
                 <div>
                    <h3 className="font-bold text-lg text-ruet-blue dark:text-blue-300">Participation Rate</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Anonymous Submissions Mode</p>
                 </div>
              </div>
              <div className="text-right">
                 <span className="text-3xl font-extrabold text-ruet-blue dark:text-blue-400">{mockResults.participation} <span className="text-lg text-gray-500 font-normal">/ {mockResults.totalStudents}</span></span>
                 <p className="text-xs font-bold text-green-600 mt-1">{(mockResults.participation / mockResults.totalStudents * 100).toFixed(1)}% Completed</p>
              </div>
           </div>

           <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Aggregated Ratings (Out of 5)</h3>
              <div className="space-y-4">
                 {questions.map((q, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                       <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">{q}</p>
                       <div className="flex items-center">
                          <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mr-4">
                             <div 
                                className={`h-full rounded-full ${mockResults.averages[idx] >= 4 ? 'bg-green-500' : mockResults.averages[idx] >= 3 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${(mockResults.averages[idx] / 5) * 100}%` }}
                             />
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white">{mockResults.averages[idx]} <span className="text-gray-400 text-xs">/ 5</span></span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ManageCourseFeedback;
