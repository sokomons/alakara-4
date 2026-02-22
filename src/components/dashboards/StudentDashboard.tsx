import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { FileText, BookOpen, Library, Wallet, Award, Calendar } from 'lucide-react';

const StudentDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarks = async () => {
      try {
        const response = await fetch('/api/student/marks', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setMarks(data);
        }
      } catch (error) {
        console.error('Error fetching marks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarks();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-kenya-black uppercase tracking-tight">Student Portal</h1>
        <p className="text-slate-500">Welcome back, {user.name}. Admission: {user.admission_number}</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickAction icon={<FileText />} label="Exam Reports" color="bg-kenya-red" />
        <QuickAction icon={<BookOpen />} label="Notes & Materials" color="bg-kenya-green" />
        <QuickAction icon={<Library />} label="Library Status" color="bg-kenya-black" />
        <QuickAction icon={<Wallet />} label="Fee Statement" color="bg-blue-600" />
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Award size={20} className="text-kenya-red" />
          Recent Performance
        </h2>
        <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
          <p>No recent exam results published.</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Calendar size={20} className="text-kenya-green" />
          Academic Results
        </h2>
        
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading your results...</div>
        ) : marks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-4 px-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                  <th className="py-4 px-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Score</th>
                  <th className="py-4 px-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Term</th>
                  <th className="py-4 px-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Year</th>
                  <th className="py-4 px-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Grade</th>
                </tr>
              </thead>
              <tbody>
                {marks.map((mark) => (
                  <tr key={mark.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-700">{mark.subject_name}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        mark.score >= 80 ? 'bg-green-100 text-green-700' :
                        mark.score >= 60 ? 'bg-blue-100 text-blue-700' :
                        mark.score >= 40 ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {mark.score}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-600">{mark.term}</td>
                    <td className="py-4 px-4 text-slate-600">{mark.year}</td>
                    <td className="py-4 px-4 font-black">
                      {mark.score >= 80 ? 'A' :
                       mark.score >= 70 ? 'B' :
                       mark.score >= 60 ? 'C' :
                       mark.score >= 50 ? 'D' : 'E'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
            <p>No academic results found in your profile.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const QuickAction: React.FC<{ icon: React.ReactNode; label: string; color: string }> = ({ icon, label, color }) => (
  <button className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center gap-4 hover:shadow-xl hover:-translate-y-1 transition-all group">
    <div className={`w-14 h-14 ${color} text-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
      {React.cloneElement(icon as React.ReactElement<any>, { size: 28 })}
    </div>
    <span className="font-bold text-slate-700">{label}</span>
  </button>
);

export default StudentDashboard;
