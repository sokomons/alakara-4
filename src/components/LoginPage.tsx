import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, User as UserIcon, Shield, GraduationCap, Book, Library, Wallet, School } from 'lucide-react';
import { User, UserRole } from '../types';
import Logo from './Logo';

interface LoginPageProps {
  onLogin: (user: User, token: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.user, data.token);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 left-0 w-full h-2 bg-kenya-black" />
      <div className="absolute top-2 left-0 w-full h-2 bg-kenya-red" />
      <div className="absolute top-4 left-0 w-full h-2 bg-kenya-green" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
      >
        <div className="p-8 bg-kenya-black text-white text-center">
          <div className="mb-6 flex justify-center">
            <Logo size={120} className="drop-shadow-xl" />
          </div>
          <h1 className="text-2xl font-black">ALAKARA PRO PORTAL</h1>
          <p className="text-slate-400 text-sm mt-2">Secure Institutional Access</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Username / Admission No.</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-4 pl-12 pr-4 focus:border-kenya-green focus:outline-none transition-all"
                  placeholder="Enter your ID"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-4 pl-12 pr-4 focus:border-kenya-green focus:outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-kenya-green text-white py-4 rounded-xl font-bold text-lg hover:bg-kenya-red transition-all shadow-lg shadow-kenya-green/20 disabled:opacity-50"
            >
              {isLoading ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-4 gap-4">
            <RoleIcon icon={<Shield size={16} />} label="Admin" />
            <RoleIcon icon={<School size={16} />} label="Head" />
            <RoleIcon icon={<GraduationCap size={16} />} label="Teacher" />
            <RoleIcon icon={<UserIcon size={16} />} label="Student" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const RoleIcon: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex flex-col items-center gap-1 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default">
    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
      {icon}
    </div>
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </div>
);

export default LoginPage;
