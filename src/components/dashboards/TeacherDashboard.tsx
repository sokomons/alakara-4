import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { 
  Plus, 
  FileText, 
  Upload, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  BookOpen,
  Send,
  Save
} from 'lucide-react';

const TeacherDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [term, setTerm] = useState('Term 1');
  const [year] = useState(new Date().getFullYear());
  
  const [marksData, setMarksData] = useState<Record<number, string>>({});
  const [existingMarks, setExistingMarks] = useState<Record<number, boolean>>({});

  const [materialTitle, setMaterialTitle] = useState('');
  const [materialType, setMaterialType] = useState('note');
  const [materialContent, setMaterialContent] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchStudents();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject && term && year) {
      fetchExistingMarks();
    }
  }, [selectedSubject, term, year]);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/users/students', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/subjects', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setSubjects(data);
      if (data.length > 0) setSelectedSubject(data[0].id.toString());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExistingMarks = async () => {
    try {
      // In a real app, we might want to filter by class too, but TeacherDashboard currently fetches all students.
      // Let's assume we fetch marks for the selected subject, term, and year.
      const response = await fetch(`/api/marks?subject_id=${selectedSubject}&term=${term}&year=${year}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        const newMarksData: Record<number, string> = {};
        const newExistingMarks: Record<number, boolean> = {};
        data.forEach((mark: any) => {
          newMarksData[mark.student_id] = mark.score.toString();
          newExistingMarks[mark.student_id] = true;
        });
        setMarksData(newMarksData);
        setExistingMarks(newExistingMarks);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkChange = (studentId: number, value: string) => {
    setMarksData(prev => ({ ...prev, [studentId]: value }));
  };

  const handleBulkMarkSubmission = async () => {
    if (!selectedSubject) {
      setMessage({ text: 'Please select a subject first.', type: 'error' });
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
        year,
        isExisting: existingMarks[parseInt(studentId)] || false
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
          method: mark.isExisting ? 'PUT' : 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            student_id: mark.student_id,
            subject_id: mark.subject_id,
            score: mark.score,
            term: mark.term,
            year: mark.year
          }),
        })
      );

      await Promise.all(promises);
      
      setMessage({ text: 'Marks saved successfully!', type: 'success' });
      // Refresh existing marks state
      fetchExistingMarks();
    } catch (err) {
      setMessage({ text: 'Failed to save some marks.', type: 'error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const handleMaterialUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialTitle || !materialContent) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          title: materialTitle, 
          type: materialType, 
          content: materialContent 
        }),
      });
      if (response.ok) {
        setMessage({ text: 'Material uploaded for approval!', type: 'success' });
        setMaterialTitle('');
        setMaterialContent('');
      }
    } catch (err) {
      setMessage({ text: 'Failed to upload material.', type: 'error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-kenya-black">Teacher Portal</h1>
        <p className="text-slate-500">Manage your classes, marks, and learning materials</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 font-bold border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Marks Entry - Tabular */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText size={20} className="text-kenya-red" />
              Submit Student Marks
            </h2>
            <button 
              onClick={handleBulkMarkSubmission}
              disabled={isSubmitting}
              className="bg-kenya-black text-white px-6 py-2 rounded-xl font-bold hover:bg-kenya-red transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={18} /> Save All Marks
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600">Subject</label>
              <select 
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 focus:border-kenya-green focus:outline-none transition-all"
                required
              >
                <option value="">Select Subject</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
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
          </div>

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
                {students.map((student) => (
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
                        className="w-full bg-white border-2 border-slate-200 rounded-lg p-2 text-center focus:border-kenya-green focus:outline-none transition-all"
                        placeholder="--"
                      />
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Material Upload */}
        <div className="lg:col-span-1 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 h-fit">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Upload size={20} className="text-kenya-green" />
            Upload Materials
          </h2>
          <form onSubmit={handleMaterialUpload} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600">Title</label>
              <input 
                type="text" 
                value={materialTitle}
                onChange={(e) => setMaterialTitle(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 focus:border-kenya-green focus:outline-none transition-all"
                placeholder="e.g. Algebra Basics Notes"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600">Type</label>
              <select 
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 focus:border-kenya-green focus:outline-none transition-all"
              >
                <option value="note">Study Notes</option>
                <option value="exam">Past Exam</option>
                <option value="marking_scheme">Marking Scheme</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600">Content / Description</label>
              <textarea 
                rows={4}
                value={materialContent}
                onChange={(e) => setMaterialContent(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 focus:border-kenya-green focus:outline-none transition-all"
                placeholder="Enter material details or link to file..."
                required
              />
            </div>

            <button 
              disabled={isSubmitting}
              className="w-full bg-kenya-green text-white py-4 rounded-xl font-bold hover:bg-kenya-black transition-all flex items-center justify-center gap-2"
            >
              <BookOpen size={18} /> Upload Material
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
