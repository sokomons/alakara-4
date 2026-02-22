import React from 'react';
import { User } from '../../types';
import { Library, Book, Users, History } from 'lucide-react';

const LibrarianDashboard: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-kenya-black">Library Management</h1>
        <p className="text-slate-500">Track book inventory and student borrowing</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6">
          <div className="w-16 h-16 bg-kenya-black text-white rounded-2xl flex items-center justify-center">
            <Book size={32} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Books</p>
            <p className="text-3xl font-black">2,450</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6">
          <div className="w-16 h-16 bg-kenya-green text-white rounded-2xl flex items-center justify-center">
            <History size={32} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">On Loan</p>
            <p className="text-3xl font-black">124</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6">
          <div className="w-16 h-16 bg-kenya-red text-white rounded-2xl flex items-center justify-center">
            <Users size={32} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Active Borrowers</p>
            <p className="text-3xl font-black">86</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <h2 className="text-xl font-bold">Recent Borrowing Activity</h2>
        </div>
        <div className="p-12 text-center text-slate-400">
          <p>No recent activity recorded.</p>
        </div>
      </div>
    </div>
  );
};

export default LibrarianDashboard;
