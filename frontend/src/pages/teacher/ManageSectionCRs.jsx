import React, { useState, useEffect, useMemo } from 'react';
import { ShieldCheck, Search, Users, ShieldAlert, Check } from 'lucide-react';
import {
  useGetAdvisedSectionsQuery,
  useGetSectionStudentsQuery,
  useSetSectionCRsMutation,
} from '../../store/slices/courseAdvisorSlice';
import ConfirmDialog from '../../components/ConfirmDialog';

const ManageSectionCRs = () => {
  const { data: advisedSections = [], isLoading: sectionsLoading } = useGetAdvisedSectionsQuery();
  const [selectedSectionId, setSelectedSectionId] = useState('');
  
  const { data: students = [], isLoading: studentsLoading, isFetching: studentsFetching } = useGetSectionStudentsQuery(selectedSectionId, {
    skip: !selectedSectionId
  });
  
  const [setCRs, { isLoading: isUpdating }] = useSetSectionCRsMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCRs, setSelectedCRs] = useState(new Set());
  const [initialCRs, setInitialCRs] = useState(new Set());
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Auto-select the first section if available and none selected
  useEffect(() => {
    if (advisedSections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(advisedSections[0]._id);
    }
  }, [advisedSections, selectedSectionId]);

  // Sync initial state when students data changes
  useEffect(() => {
    if (students && students.length > 0) {
      const currentCRs = new Set(
        students.filter((s) => s.isSectionCR).map((s) => s._id)
      );
      setSelectedCRs(currentCRs);
      setInitialCRs(new Set(currentCRs));
    } else {
      setSelectedCRs(new Set());
      setInitialCRs(new Set());
    }
  }, [students]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const query = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query) ||
        (s.rollNumber && s.rollNumber.toString().toLowerCase().includes(query))
    );
  }, [students, searchQuery]);

  const hasChanges = useMemo(() => {
    if (selectedCRs.size !== initialCRs.size) return true;
    for (let id of selectedCRs) {
      if (!initialCRs.has(id)) return true;
    }
    return false;
  }, [selectedCRs, initialCRs]);

  const toggleStudent = (studentId) => {
    setSelectedCRs((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedSectionId) return;
    try {
      await setCRs({
        id: selectedSectionId,
        studentIds: Array.from(selectedCRs),
      }).unwrap();
      
      setInitialCRs(new Set(selectedCRs));
      showToast('Section CRs updated successfully!');
      setConfirmOpen(false);
    } catch (error) {
      console.error('Failed to update CRs:', error);
      showToast('Failed to update CRs. Please try again.');
    }
  };

  const selectedSection = advisedSections.find(s => s._id === selectedSectionId);

  if (sectionsLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
        Loading advised sections...
      </div>
    );
  }

  if (advisedSections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-800">
        <ShieldAlert size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Not a Course Advisor</h2>
        <p className="mt-2 text-center max-w-md">
          You have not been assigned as a course advisor for any sections. Please contact your department administrator if you believe this is a mistake.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-fade-in">
          <Check size={18} className="text-green-400 dark:text-green-600" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="text-blue-600 dark:text-blue-400" size={24} />
            Manage Section CRs
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Assign class representatives for your advised sections
          </p>
        </div>

        <div className="flex-shrink-0 min-w-[250px]">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            Select Section
          </label>
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="w-full bg-gray-50 dark:bg-[#151b2e] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-medium"
          >
            {advisedSections.map(section => (
              <option key={section._id} value={section._id}>
                Series {section.series} - Section {section.section}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="relative w-full sm:max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#151b2e] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-sm"
            />
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="text-sm font-medium">
              <span className="text-gray-500 dark:text-gray-400 mr-2">Selected CRs:</span>
              <span className={`px-2.5 py-0.5 rounded-full ${
                selectedCRs.size > 0 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                {selectedCRs.size}
              </span>
            </div>
            
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={!hasChanges || isUpdating}
              className={`px-5 py-2 rounded-lg font-medium transition-all text-sm ${
                hasChanges
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
              }`}
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Student List */}
        <div className="flex-1 overflow-y-auto p-4">
          {studentsLoading || studentsFetching ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p>Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <Users size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white">No students found</p>
              <p className="mt-1">Try adjusting your search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredStudents.map((student) => {
                const isSelected = selectedCRs.has(student._id);
                return (
                  <div
                    key={student._id}
                    onClick={() => toggleStudent(student._id)}
                    className={`flex items-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10'
                        : 'border-transparent bg-gray-50 dark:bg-[#151b2e] hover:border-blue-200 dark:hover:border-blue-800'
                    }`}
                  >
                    <div className="flex-shrink-0 mr-4 relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        isSelected 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {student.name?.charAt(0).toUpperCase()}
                      </div>
                      {isSelected && (
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-[#1e1e1e] rounded-full p-0.5">
                          <div className="bg-blue-600 text-white rounded-full p-0.5">
                            <Check size={10} strokeWidth={3} />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm truncate ${
                        isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
                      }`}>
                        {student.name}
                      </p>
                      <p className={`text-xs truncate ${
                        isSelected ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {student.rollNumber || student.email}
                      </p>
                    </div>

                    <div className="flex-shrink-0 ml-2">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        isSelected 
                          ? 'bg-blue-600 border-blue-600' 
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent'
                      }`}>
                        {isSelected && <Check size={14} className="text-white" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleSave}
        title="Update Section CRs"
        message={`Are you sure you want to update the CRs for Series ${selectedSection?.series} Section ${selectedSection?.section}? You have selected ${selectedCRs.size} student(s).`}
        confirmLabel={isUpdating ? 'Saving...' : 'Save Changes'}
        variant="primary"
      />
    </div>
  );
};

export default ManageSectionCRs;
