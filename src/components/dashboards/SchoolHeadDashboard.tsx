import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { 
  Users, 
  GraduationCap, 
  TrendingUp, 
  Award, 
  FileText,
  Download,
  BarChart3,
  Book,
  Wallet,
  BookOpen,
  LayoutDashboard,
  Library
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

import TeacherDashboard from './TeacherDashboard';
import LibrarianDashboard from './LibrarianDashboard';
import AccountsDashboard from './AccountsDashboard';
import ClassesTab from './ClassesTab';
import TeachersTab from './TeachersTab';
import SubjectsTab from './SubjectsTab';
import SchoolHeadMarksTab from './SchoolHeadMarksTab';

const SchoolHeadDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ teachers: 0, students: 0, classes: 0 });
  const [analysis, setAnalysis] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Real-time sync simulation (WebSocket would be better, but let's use a simple interval for now or just the initial fetch)
    // In a real app, the WebSocket in server.ts would notify the client.
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, analysisRes] = await Promise.all([
        fetch('/api/school/stats', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        fetch('/api/marks/analysis', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      ]);
      const statsData = await statsRes.json();
      const analysisData = await analysisRes.json();
      setStats(statsData);
      setAnalysis(analysisData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Academic Performance Report', 14, 22);
    doc.setFontSize(12);
    doc.text(`School: ${user.school_id}`, 14, 30);
    
    const tableData = analysis.map((item, index) => [
      index + 1,
      item.name,
      item.average_score.toFixed(2)
    ]);

    (doc as any).autoTable({
      startY: 40,
      head: [['Rank', 'Student Name', 'Average Score']],
      body: tableData,
    });

    doc.save('school_performance_report.pdf');
  };

  const COLORS = ['#006600', '#BB0613', '#000000', '#4F46E5', '#F59E0B'];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-black text-kenya-black">School Administration</h1>
                <p className="text-slate-500">Academic oversight and performance analysis</p>
              </div>
              <button 
                onClick={generateReport}
                className="bg-kenya-black text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-kenya-red transition-all"
              >
                <Download size={20} /> Export Report
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              <StatCard icon={<Users />} label="Total Students" value={stats.students} color="bg-kenya-green" />
              <StatCard icon={<GraduationCap />} label="Total Teachers" value={stats.teachers} color="bg-kenya-red" />
              <StatCard icon={<BarChart3 />} label="Classes" value={stats.classes} color="bg-kenya-black" />
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Performance Chart */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
                  <TrendingUp size={20} className="text-kenya-green" />
                  Top Performing Students
                </h2>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysis.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="average_score" radius={[8, 8, 0, 0]}>
                        {analysis.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Rankings Table */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Award size={20} className="text-kenya-red" />
                    Academic Rankings
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Rank</th>
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4">Avg Score</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {analysis.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx < 3 ? 'bg-kenya-red text-white' : 'bg-slate-100 text-slate-500'}`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-700">{item.name}</td>
                          <td className="px-6 py-4 font-mono text-kenya-green font-bold">{item.average_score.toFixed(1)}%</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase">Excellence</span>
                          </td>
                        </tr>
                      ))}
                      {analysis.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-400">No data available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      case 'classes':
        return <ClassesTab />;
      case 'subjects':
        return <SubjectsTab />;
      case 'teachers':
        return <TeachersTab />;
      case 'exams_marks':
        return <SchoolHeadMarksTab user={user} />;
      case 'materials':
        return <TeacherDashboard user={user} />;
      case 'library':
        return <LibrarianDashboard user={user} />;
      case 'accounts':
        return <AccountsDashboard user={user} />;
      default:
        return <div>Tab not found</div>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 rounded-t-xl font-bold whitespace-nowrap transition-colors ${activeTab === 'overview' ? 'bg-kenya-black text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
        >
          <div className="flex items-center gap-2"><LayoutDashboard size={18} /> Overview</div>
        </button>
        <button 
          onClick={() => setActiveTab('classes')}
          className={`px-6 py-3 rounded-t-xl font-bold whitespace-nowrap transition-colors ${activeTab === 'classes' ? 'bg-kenya-black text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
        >
          <div className="flex items-center gap-2"><BookOpen size={18} /> Classes</div>
        </button>
        <button 
          onClick={() => setActiveTab('subjects')}
          className={`px-6 py-3 rounded-t-xl font-bold whitespace-nowrap transition-colors ${activeTab === 'subjects' ? 'bg-kenya-black text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
        >
          <div className="flex items-center gap-2"><Library size={18} /> Subjects</div>
        </button>
        <button 
          onClick={() => setActiveTab('teachers')}
          className={`px-6 py-3 rounded-t-xl font-bold whitespace-nowrap transition-colors ${activeTab === 'teachers' ? 'bg-kenya-black text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
        >
          <div className="flex items-center gap-2"><Users size={18} /> Teachers</div>
        </button>
        <button 
          onClick={() => setActiveTab('exams_marks')}
          className={`px-6 py-3 rounded-t-xl font-bold whitespace-nowrap transition-colors ${activeTab === 'exams_marks' ? 'bg-kenya-black text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
        >
          <div className="flex items-center gap-2"><FileText size={18} /> Exams & Marks</div>
        </button>
        <button 
          onClick={() => setActiveTab('materials')}
          className={`px-6 py-3 rounded-t-xl font-bold whitespace-nowrap transition-colors ${activeTab === 'materials' ? 'bg-kenya-black text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
        >
          <div className="flex items-center gap-2"><BookOpen size={18} /> Materials</div>
        </button>
        <button 
          onClick={() => setActiveTab('library')}
          className={`px-6 py-3 rounded-t-xl font-bold whitespace-nowrap transition-colors ${activeTab === 'library' ? 'bg-kenya-black text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
        >
          <div className="flex items-center gap-2"><Book size={18} /> Library</div>
        </button>
        <button 
          onClick={() => setActiveTab('accounts')}
          className={`px-6 py-3 rounded-t-xl font-bold whitespace-nowrap transition-colors ${activeTab === 'accounts' ? 'bg-kenya-black text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
        >
          <div className="flex items-center gap-2"><Wallet size={18} /> Accounts</div>
        </button>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number; color: string }> = ({ icon, label, value, color }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6">
    <div className={`w-16 h-16 ${color} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
      {React.cloneElement(icon as React.ReactElement<any>, { size: 32 })}
    </div>
    <div>
      <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-black text-kenya-black">{value.toLocaleString()}</p>
    </div>
  </div>
);

export default SchoolHeadDashboard;
