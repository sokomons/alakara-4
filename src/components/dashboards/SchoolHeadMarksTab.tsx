import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { FileText, Save, CheckCircle2, AlertCircle, Search, Calculator, Download, Settings } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import GradingSystemTab from './GradingSystemTab';

interface GradingRule {
  min_score: number;
  max_score: number;
  grade: string;
  points: number;
}

const SchoolHeadMarksTab: React.FC<{ user: User }> = ({ user }) => {
  const [activeSubTab, setActiveSubTab] = useState('upload');
  
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [gradingSystem, setGradingSystem] = useState<GradingRule[]>([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [term, setTerm] = useState('Term 1');
  const [year] = useState(new Date().getFullYear());
  
  const [marksData, setMarksData] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Process Results State
  const [processedResults, setProcessedResults] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Processing Options
  const [includeSubjectGrades, setIncludeSubjectGrades] = useState(false);
  const [rankingMethod, setRankingMethod] = useState<'marks' | 'points'>('marks');

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
    fetchGradingSystem();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass);
    } else {
      setStudents([]);
      setMarksData({});
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedSubject && term && year && activeSubTab === 'upload') {
      fetchExistingMarks();
    }
  }, [selectedClass, selectedSubject, term, year, activeSubTab]);

  useEffect(() => {
    if (selectedClass && term && year && activeSubTab === 'process') {
      fetchProcessedResults();
    }
  }, [selectedClass, term, year, activeSubTab, includeSubjectGrades, rankingMethod]);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/subjects', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGradingSystem = async () => {
    try {
      const response = await fetch('/api/grading', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setGradingSystem(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async (classId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/classes/${classId}/students`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExistingMarks = async () => {
    try {
      const response = await fetch(`/api/marks?class_id=${selectedClass}&subject_id=${selectedSubject}&term=${term}&year=${year}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        const newMarksData: Record<number, string> = {};
        data.forEach((mark: any) => {
          newMarksData[mark.student_id] = mark.score.toString();
        });
        setMarksData(newMarksData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getGradeInfo = (score: number) => {
    for (const rule of gradingSystem) {
      if (score >= rule.min_score && score <= rule.max_score) {
        return { grade: rule.grade, points: rule.points };
      }
    }
    return { grade: 'E', points: 1 }; // Fallback
  };

  const fetchProcessedResults = async () => {
    if (!selectedClass) return;
    setIsProcessing(true);
    try {
      // Fetch all marks for the class, term, year
      const response = await fetch(`/api/marks?class_id=${selectedClass}&term=${term}&year=${year}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const marks = await response.json();
        
        // Process marks into a tabular format per student
        const studentMap = new Map<number, any>();
        
        // Initialize students
        students.forEach(student => {
          studentMap.set(student.id, {
            id: student.id,
            name: student.name,
            admission_number: student.admission_number,
            marks: {},
            totalMarks: 0,
            totalPoints: 0,
            average: 0,
            grade: ''
          });
        });

        // Add marks
        marks.forEach((mark: any) => {
          if (studentMap.has(mark.student_id)) {
            const student = studentMap.get(mark.student_id);
            const score = mark.score;
            const gradeInfo = getGradeInfo(score);
            
            student.marks[mark.subject_id] = {
              score: score,
              grade: gradeInfo.grade,
              points: gradeInfo.points
            };
            student.totalMarks += score;
            student.totalPoints += gradeInfo.points;
          }
        });

        // Calculate averages and grades
        const results = Array.from(studentMap.values()).map(student => {
          const numSubjects = Object.keys(student.marks).length;
          student.average = numSubjects > 0 ? student.totalMarks / numSubjects : 0;
          const overallGradeInfo = getGradeInfo(student.average);
          student.grade = overallGradeInfo.grade;
          return student;
        });

        // Sort by selected ranking method descending
        results.sort((a, b) => {
          if (rankingMethod === 'marks') {
            return b.totalMarks - a.totalMarks;
          } else {
            return b.totalPoints - a.totalPoints;
          }
        });
        
        setProcessedResults(results);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkChange = (studentId: number, value: string) => {
    setMarksData(prev => ({ ...prev, [studentId]: value }));
  };

  const handleBulkMarkSubmission = async () => {
    if (!selectedSubject || !selectedClass) {
      setMessage({ text: 'Please select a class and subject first.', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      return;
    }

    const marksToSubmit = Object.entries(marksData)
      .filter(([_, score]) => score !== '')
      .map(([studentId, score]) => ({
        student_id: parseInt(studentId),
        subject_id: parseInt(selectedSubject),
        score: parseFloat(score),
        term,
        year
      }));

    if (marksToSubmit.length === 0) {
      setMessage({ text: 'No marks entered to submit.', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      return;
    }

    setIsSubmitting(true);
    try {
      const promises = marksToSubmit.map(mark => 
        fetch('/api/marks', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(mark),
        })
      );

      await Promise.all(promises);
      
      setMessage({ text: 'Marks saved successfully!', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to save some marks.', type: 'error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const exportProcessedResults = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text(`Class Results - ${classes.find(c => c.id.toString() === selectedClass)?.name || 'Unknown Class'}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`${term} - ${year}`, 14, 28);
    
    const head = [['Rank', 'Adm No', 'Name', ...subjects.map(s => s.name.substring(0, 3).toUpperCase()), 'Total Marks', 'Total Pts', 'Avg', 'Grade']];
    
    const body = processedResults.map((student, index) => [
      index + 1,
      student.admission_number,
      student.name,
      ...subjects.map(s => {
        const mark = student.marks[s.id];
        if (!mark) return '-';
        return includeSubjectGrades ? `${mark.score} ${mark.grade}` : mark.score;
      }),
      student.totalMarks,
      student.totalPoints,
      student.average.toFixed(1),
      student.grade
    ]);

    (doc as any).autoTable({
      startY: 35,
      head: head,
      body: body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 0, 0] }
    });

    doc.save(`results_${selectedClass}_${term}_${year}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-slate-200 pb-2">
        <button 
          onClick={() => setActiveSubTab('upload')}
          className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeSubTab === 'upload' ? 'bg-kenya-black text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          <div className="flex items-center gap-2"><FileText size={18} /> Upload / Edit Marks</div>
        </button>
        <button 
          onClick={() => setActiveSubTab('process')}
          className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeSubTab === 'process' ? 'bg-kenya-black text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          <div className="flex items-center gap-2"><Calculator size={18} /> Process Results</div>
        </button>
        <button 
          onClick={() => setActiveSubTab('grading')}
          className={`px-4 py-2 rounded-lg font-bold transition-colors ${activeSubTab === 'grading' ? 'bg-kenya-black text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          <div className="flex items-center gap-2"><Settings size={18} /> Grading System</div>
        </button>
      </div>

      {activeSubTab === 'grading' ? (
        <GradingSystemTab />
      ) : (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="grid md:grid-cols-4 gap-4 mb-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600">Class</label>
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 focus:border-kenya-green focus:outline-none transition-all"
              >
                <option value="">Select Class</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            {activeSubTab === 'upload' && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Subject</label>
                <select 
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 focus:border-kenya-green focus:outline-none transition-all"
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600">Term</label>
              <select 
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 focus:border-kenya-green focus:outline-none transition-all"
              >
                <option>Term 1</option>
                <option>Term 2</option>
                <option>Term 3</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600">Year</label>
              <input 
                type="number" 
                value={year}
                disabled
                className="w-full bg-slate-100 border-2 border-slate-200 rounded-xl p-3 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          {activeSubTab === 'upload' ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FileText size={20} className="text-kenya-red" />
                  Manage Student Marks
                </h2>
                <button 
                  onClick={handleBulkMarkSubmission}
                  disabled={isSubmitting || students.length === 0}
                  className="bg-kenya-black text-white px-6 py-2 rounded-xl font-bold hover:bg-kenya-red transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={18} /> Save All Marks
                </button>
              </div>

              {message.text && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 font-bold border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                  {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  {message.text}
                </div>
              )}

              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Adm No.</th>
                      <th className="px-6 py-4">Student Name</th>
                      <th className="px-6 py-4 w-48">Score (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {isLoading ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                          Loading students...
                        </td>
                      </tr>
                    ) : students.length > 0 ? (
                      students.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3 font-mono text-sm text-slate-500">{student.admission_number}</td>
                          <td className="px-6 py-3 font-bold text-slate-700">{student.name}</td>
                          <td className="px-6 py-3">
                            <input 
                              type="number" 
                              max="100"
                              min="0"
                              value={marksData[student.id] || ''}
                              onChange={(e) => handleMarkChange(student.id, e.target.value)}
                              disabled={!selectedSubject}
                              className="w-full bg-white border-2 border-slate-200 rounded-lg p-2 text-center focus:border-kenya-green focus:outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed"
                              placeholder="--"
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                          {selectedClass ? 'No students found in this class.' : 'Select a class to view students.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Calculator size={20} className="text-kenya-green" />
                  Processed Results
                </h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                    <label className="text-sm font-bold text-slate-600">Rank By:</label>
                    <select 
                      value={rankingMethod}
                      onChange={(e) => setRankingMethod(e.target.value as 'marks' | 'points')}
                      className="bg-transparent font-bold text-kenya-black focus:outline-none"
                    >
                      <option value="marks">Total Marks</option>
                      <option value="points">Total Points</option>
                    </select>
                  </div>
                  
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                    <input 
                      type="checkbox" 
                      checked={includeSubjectGrades}
                      onChange={(e) => setIncludeSubjectGrades(e.target.checked)}
                      className="w-4 h-4 text-kenya-green rounded focus:ring-kenya-green"
                    />
                    <span className="text-sm font-bold text-slate-600">Show Subject Grades</span>
                  </label>

                  <button 
                    onClick={exportProcessedResults}
                    disabled={processedResults.length === 0}
                    className="bg-kenya-black text-white px-6 py-2 rounded-xl font-bold hover:bg-kenya-green transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Download size={18} /> Export PDF
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="px-4 py-4">Rank</th>
                      <th className="px-4 py-4">Adm No.</th>
                      <th className="px-4 py-4">Student Name</th>
                      {subjects.map(s => (
                        <th key={s.id} className="px-4 py-4 text-center" title={s.name}>
                          {s.name.substring(0, 3).toUpperCase()}
                        </th>
                      ))}
                      <th className="px-4 py-4 text-center">Total Marks</th>
                      <th className="px-4 py-4 text-center">Total Pts</th>
                      <th className="px-4 py-4 text-center">Avg</th>
                      <th className="px-4 py-4 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {isProcessing ? (
                      <tr>
                        <td colSpan={8 + subjects.length} className="px-6 py-12 text-center text-slate-400">
                          Processing results...
                        </td>
                      </tr>
                    ) : processedResults.length > 0 ? (
                      processedResults.map((student, index) => (
                        <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-500">{index + 1}</td>
                          <td className="px-4 py-3 font-mono text-sm text-slate-500">{student.admission_number}</td>
                          <td className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap">{student.name}</td>
                          {subjects.map(s => {
                            const mark = student.marks[s.id];
                            return (
                              <td key={s.id} className="px-4 py-3 text-center font-mono text-sm">
                                {mark ? (
                                  <div className="flex flex-col items-center">
                                    <span>{mark.score}</span>
                                    {includeSubjectGrades && (
                                      <span className="text-[10px] font-bold text-slate-400">{mark.grade}</span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-center font-bold text-kenya-black">{student.totalMarks}</td>
                          <td className="px-4 py-3 text-center font-bold text-kenya-green">{student.totalPoints}</td>
                          <td className="px-4 py-3 text-center font-mono text-sm">{student.average.toFixed(1)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                              student.grade.startsWith('A') ? 'bg-green-100 text-green-700' :
                              student.grade.startsWith('B') ? 'bg-blue-100 text-blue-700' :
                              student.grade.startsWith('C') ? 'bg-yellow-100 text-yellow-700' :
                              student.grade.startsWith('D') ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {student.grade}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8 + subjects.length} className="px-6 py-12 text-center text-slate-400">
                          {selectedClass ? 'No marks found to process for this class.' : 'Select a class to process results.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SchoolHeadMarksTab;
