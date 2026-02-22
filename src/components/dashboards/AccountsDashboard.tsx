import React from 'react';
import { User } from '../../types';
import { Wallet, CreditCard, FileText, AlertCircle } from 'lucide-react';

const AccountsDashboard: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-kenya-black">Accounts & Finance</h1>
        <p className="text-slate-500">Manage school fees and financial records</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6">
          <div className="w-16 h-16 bg-kenya-green text-white rounded-2xl flex items-center justify-center">
            <Wallet size={32} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Collected</p>
            <p className="text-3xl font-black">KES 1.2M</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6">
          <div className="w-16 h-16 bg-kenya-red text-white rounded-2xl flex items-center justify-center">
            <AlertCircle size={32} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Outstanding</p>
            <p className="text-3xl font-black">KES 450K</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6">
          <div className="w-16 h-16 bg-kenya-black text-white rounded-2xl flex items-center justify-center">
            <FileText size={32} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Pending Invoices</p>
            <p className="text-3xl font-black">42</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <h2 className="text-xl font-bold">Recent Fee Payments</h2>
        </div>
        <div className="p-12 text-center text-slate-400">
          <p>No recent transactions found.</p>
        </div>
      </div>
    </div>
  );
};

export default AccountsDashboard;
