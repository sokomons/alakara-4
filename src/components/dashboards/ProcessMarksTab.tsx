import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { FileText, Save, CheckCircle2, AlertCircle, Search, Calculator, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const ProcessMarksTab: React.FC<{ user: User }> = ({ user }) => {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [term, setTerm] = useState('Term 1');
  const [year] = useState(new Date().getFullYear());
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

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

  const handleProcessMarks = async () => {
    if (!selectedClass || !term || !year) {
      setError('Please select a class, term, and year.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/marks/process?class_id=${selectedClass}&term=${term}&year=${year}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects);
        setResults(data.results);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to process marks');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while processing marks.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (results.length === 0) return;

    const doc = new jsPDF('landscape');
    const className = classes.find(c => c.id.toString() === selectedClass)?.name || 'Class';
    
    doc.setFontSize(20);
    doc.text(`Results: ${className} - ${term} ${year}`, 14, 22);
    
    const head = [['Rank', 'Adm No', 'Name', ...subjects.map(s => s.name), 'Total', 'Avg', 'Grade']];
    
    const body = results.map((student, index) => [
      index + 1,
      student.admission_number,
      student.name,
      ...subjects.map(s => student.marks[s.id] !== undefined ? student.marks[s.id] : '-'),
      student.totalScore,
      student.averageScore.toFixed(1),
      student.grade
    ]);

    (doc as any).autoTable({
      startY: 30,
      head: head,
      body: body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 0, 0] }
    });

    doc.save(`results_${className}_${term}_${year}.pdf`);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calculator size={20} className="text-kenya-green" />
            Process Marks & Results
          </h2>
          <button 
            onClick={handleExportPDF}
            disabled={results.length === 0}
            className="bg-kenya-black text-white px-6 py-2 rounded-xl font-bold hover:bg-kenya-red transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Download size={18} /> Export PDF
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}
        
        <div className="grid md:grid-cols-4 gap-4 mb-6 bg-slate-50 p-6 rounded-2xl border border-slate-100 items-end">
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
          <div>
            <button 
              onClick={handleProcessMarks}
              disabled={isLoading || !selectedClass}
              className="w-full bg-kenya-green text-white px-6 py-3 rounded-xl font-bold hover:bg-kenya-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Process Marks'}
            </button>
          </div>
        </div>

        {results.length > 0 && (
          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="px-4 py-4">Rank</th>
                  <th className="px-4 py-4">Adm No.</th>
                  <th className="px-4 py-4">Student Name</th>
                  {subjects.map(subject => (
                    <th key={subject.id} className="px-4 py-4 text-center">{subject.name.substring(0, 3)}</th>
                  ))}
                  <th className="px-4 py-4 text-center">Total</th>
                  <th className="px-4 py-4 text-center">Avg</th>
                  <th className="px-4 py-4 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {results.map((student, index) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-700">{index + 1}</td>
                    <td className="px-4 py-3 font-mono text-sm text-slate-500">{student.admission_number}</td>
                    <td className="px-4 py-3 font-bold text-slate-700">{student.name}</td>
                    {subjects.map(subject => (
                      <td key={subject.id} className="px-4 py-3 text-center text-sm">
                        {student.marks[subject.id] !== undefined ? student.marks[subject.id] : '-'}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center font-bold text-kenya-black">{student.totalScore}</td>
                    <td className="px-4 py-3 text-center font-mono text-sm">{student.averageScore.toFixed(1)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                        student.grade === 'A' ? 'bg-green-100 text-green-700' :
                        student.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                        student.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                        student.grade === 'D' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {student.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {results.length === 0 && !isLoading && !error && (
          <div className="p-12 text-center text-slate-400">
            <Calculator size={48} className="mx-auto mb-4 opacity-20" />
            <p>Select a class and click "Process Marks" to view results.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessMarksTab;
