import React, { useState, useEffect } from 'react';
import { FileText, BarChart2, Search } from 'lucide-react';

interface AdminMarksTabProps {
  onAnalyze: () => void;
}

const AdminMarksTab: React.FC<AdminMarksTabProps> = ({ onAnalyze }) => {
  const [marks, setMarks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMarks = async () => {
    try {
      const response = await fetch('/api/school/marks', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMarks(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarks();

    // WebSocket for real-time updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'MARKS_UPDATED') {
        fetchMarks();
      }
    };

    return () => ws.close();
  }, []);

  const filteredMarks = marks.filter(m => 
    m.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.admission_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.subject_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-kenya-black">Submitted Marks</h2>
          <p className="text-slate-500">Real-time feed of marks uploaded by teachers</p>
        </div>
        <button 
          onClick={onAnalyze}
          className="bg-kenya-green text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-kenya-black transition-all"
        >
          <BarChart2 size={20} /> Analyse Results
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search student or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-kenya-green"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Term/Year</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Teacher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredMarks.map((mark) => (
                <tr key={mark.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(mark.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-700">{mark.student_name}</div>
                    <div className="text-xs text-slate-500">{mark.admission_number}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">{mark.subject_name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{mark.term} {mark.year}</td>
                  <td className="px-6 py-4 font-mono font-bold text-kenya-green">{mark.score}%</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{mark.teacher_name}</td>
                </tr>
              ))}
              {filteredMarks.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No marks found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminMarksTab;
