import React, { useState, useEffect } from 'react';
import { Plus, Users, AlertCircle, Mail, Shield } from 'lucide-react';

const TeachersTab: React.FC = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherUsername, setNewTeacherUsername] = useState('');
  const [newTeacherPassword, setNewTeacherPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/users/teachers', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTeachers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName || !newTeacherUsername || !newTeacherPassword) return;
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          name: newTeacherName,
          username: newTeacherUsername,
          password: newTeacherPassword,
          role: 'teacher'
        }),
      });
      if (response.ok) {
        setNewTeacherName('');
        setNewTeacherUsername('');
        setNewTeacherPassword('');
        setSuccess('Teacher added successfully!');
        fetchTeachers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create teacher account');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while creating the teacher account.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Add Teacher Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Plus size={20} className="text-kenya-green" />
              Add New Teacher
            </h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm font-bold border border-red-100">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-xl text-sm font-bold border border-green-100">
                {success}
              </div>
            )}
            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-600 block mb-2">Full Name *</label>
                <input 
                  type="text" 
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 focus:border-kenya-green focus:outline-none transition-all"
                  placeholder="e.g. Jane Smith"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 block mb-2">Username *</label>
                <input 
                  type="text" 
                  value={newTeacherUsername}
                  onChange={(e) => setNewTeacherUsername(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 focus:border-kenya-green focus:outline-none transition-all"
                  placeholder="e.g. jsmith"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600 block mb-2">Password *</label>
                <input 
                  type="password" 
                  value={newTeacherPassword}
                  onChange={(e) => setNewTeacherPassword(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 focus:border-kenya-green focus:outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button className="w-full bg-kenya-black text-white py-4 rounded-xl font-bold hover:bg-kenya-red transition-all">
                Create Teacher Account
              </button>
            </form>
          </div>
        </div>

        {/* Teachers List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h2 className="text-xl font-bold">Managed Teachers</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                      <Users size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{teacher.name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Mail size={12} /> {teacher.username}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Active</span>
                    </div>
                    <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-400 hover:text-kenya-red">
                      <Shield size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {teachers.length === 0 && !isLoading && (
                <div className="p-12 text-center text-slate-400">
                  <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No teachers registered yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeachersTab;
