import React, { useState, useEffect } from 'react';
import { User, School } from '../../types';
import { Plus, School as SchoolIcon, Shield, Activity, Users, AlertCircle, X, Mail, Phone, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SuperAdminDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolAddress, setNewSchoolAddress] = useState('');
  const [newSchoolPhone, setNewSchoolPhone] = useState('');
  const [newSchoolEmail, setNewSchoolEmail] = useState('');
  const [newSchoolMotto, setNewSchoolMotto] = useState('');
  const [headTeacherName, setHeadTeacherName] = useState('');
  const [headTeacherUsername, setHeadTeacherUsername] = useState('');
  const [headTeacherPassword, setHeadTeacherPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/schools', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setSchools(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName || !headTeacherName || !headTeacherUsername || !headTeacherPassword) {
      alert("Please fill in all required fields (School Name, Head Teacher Name, Username, Password).");
      return;
    }
    try {
      const response = await fetch('/api/schools', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          name: newSchoolName,
          address: newSchoolAddress,
          phone: newSchoolPhone,
          email: newSchoolEmail,
          motto: newSchoolMotto,
          headTeacherName,
          headTeacherUsername,
          headTeacherPassword
        }),
      });
      if (response.ok) {
        setNewSchoolName('');
        setNewSchoolAddress('');
        setNewSchoolPhone('');
        setNewSchoolEmail('');
        setNewSchoolMotto('');
        setHeadTeacherName('');
        setHeadTeacherUsername('');
        setHeadTeacherPassword('');
        fetchSchools();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to create school");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while creating the school.");
    }
  };

  const handleSchoolClick = async (schoolId: number) => {
    setIsModalOpen(true);
    setIsLoadingDetails(true);
    try {
      const response = await fetch(`/api/schools/${schoolId}/details`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedSchool(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-kenya-black">System Overview</h1>
          <p className="text-slate-500">Global administration and school management</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-kenya-red/10 text-kenya-red rounded-xl flex items-center justify-center">
              <SchoolIcon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Schools</p>
              <p className="text-2xl font-black">{schools.length}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-kenya-green/10 text-kenya-green rounded-xl flex items-center justify-center">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Users</p>
              <p className="text-2xl font-black">1,284</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Add School Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Plus size={20} className="text-kenya-green" />
              Register New School
            </h2>
            <form onSubmit={handleAddSchool} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">School Details</h3>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Institution Name *</label>
                  <input 
                    type="text" 
                    value={newSchoolName}
                    onChange={(e) => setNewSchoolName(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm focus:border-kenya-green focus:outline-none transition-all"
                    placeholder="e.g. Alliance High School"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Address</label>
                  <input 
                    type="text" 
                    value={newSchoolAddress}
                    onChange={(e) => setNewSchoolAddress(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm focus:border-kenya-green focus:outline-none transition-all"
                    placeholder="e.g. P.O Box 123, Nairobi"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Phone</label>
                    <input 
                      type="text" 
                      value={newSchoolPhone}
                      onChange={(e) => setNewSchoolPhone(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm focus:border-kenya-green focus:outline-none transition-all"
                      placeholder="e.g. +254 700..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Email</label>
                    <input 
                      type="email" 
                      value={newSchoolEmail}
                      onChange={(e) => setNewSchoolEmail(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm focus:border-kenya-green focus:outline-none transition-all"
                      placeholder="e.g. info@school.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Motto</label>
                  <input 
                    type="text" 
                    value={newSchoolMotto}
                    onChange={(e) => setNewSchoolMotto(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm focus:border-kenya-green focus:outline-none transition-all"
                    placeholder="e.g. Strive for Excellence"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Head Teacher Details</h3>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Full Name *</label>
                  <input 
                    type="text" 
                    value={headTeacherName}
                    onChange={(e) => setHeadTeacherName(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm focus:border-kenya-green focus:outline-none transition-all"
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Username *</label>
                    <input 
                      type="text" 
                      value={headTeacherUsername}
                      onChange={(e) => setHeadTeacherUsername(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm focus:border-kenya-green focus:outline-none transition-all"
                      placeholder="e.g. jdoe"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Password *</label>
                    <input 
                      type="password" 
                      value={headTeacherPassword}
                      onChange={(e) => setHeadTeacherPassword(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm focus:border-kenya-green focus:outline-none transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              <button className="w-full bg-kenya-black text-white py-4 rounded-xl font-bold hover:bg-kenya-red transition-all mt-4">
                Create Institution & Account
              </button>
            </form>
          </div>
        </div>

        {/* Schools List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h2 className="text-xl font-bold">Managed Institutions</h2>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Active</span>
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Suspended</span>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {schools.map((school) => (
                <div 
                  key={school.id} 
                  className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => handleSchoolClick(school.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                      <SchoolIcon size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{school.name}</h3>
                      <p className="text-xs text-slate-500">ID: SCH-{school.id.toString().padStart(4, '0')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${school.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {school.status ? school.status.charAt(0).toUpperCase() + school.status.slice(1) : 'Active'}
                      </span>
                    </div>
                    <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-400 hover:text-kenya-red">
                      <Shield size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {schools.length === 0 && !isLoading && (
                <div className="p-12 text-center text-slate-400">
                  <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No schools registered yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* School Details Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  <SchoolIcon className="text-kenya-red" />
                  Institution Details
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8">
                {isLoadingDetails ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kenya-red"></div>
                  </div>
                ) : selectedSchool ? (
                  <div className="space-y-8">
                    {/* Header Info */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-3xl font-black text-slate-900 mb-2">{selectedSchool.name}</h3>
                        <p className="text-slate-500 font-mono mb-2">ID: SCH-{selectedSchool.id.toString().padStart(4, '0')}</p>
                        {selectedSchool.motto && <p className="text-sm italic text-slate-600">"{selectedSchool.motto}"</p>}
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-bold ${selectedSchool.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {selectedSchool.status ? selectedSchool.status.toUpperCase() : 'ACTIVE'}
                      </span>
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail size={16} className="text-slate-400" />
                        <span>{selectedSchool.email || 'No email'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone size={16} className="text-slate-400" />
                        <span>{selectedSchool.phone || 'No phone'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <SchoolIcon size={16} className="text-slate-400" />
                        <span>{selectedSchool.address || 'No address'}</span>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3 mb-2 text-slate-500">
                          <Users size={20} />
                          <span className="font-bold text-sm uppercase tracking-wider">Total Students</span>
                        </div>
                        <p className="text-3xl font-black text-slate-900">{selectedSchool.stats?.students || 0}</p>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3 mb-2 text-slate-500">
                          <UserIcon size={20} />
                          <span className="font-bold text-sm uppercase tracking-wider">Total Teachers</span>
                        </div>
                        <p className="text-3xl font-black text-slate-900">{selectedSchool.stats?.teachers || 0}</p>
                      </div>
                    </div>

                    {/* Head Teacher Info */}
                    <div>
                      <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Shield size={20} className="text-kenya-green" />
                        Head Teacher Contact
                      </h4>
                      {selectedSchool.headTeacher ? (
                        <div className="bg-white border-2 border-slate-100 rounded-2xl p-6 flex items-center gap-6">
                          <div className="w-16 h-16 bg-kenya-green/10 text-kenya-green rounded-full flex items-center justify-center">
                            <UserIcon size={32} />
                          </div>
                          <div>
                            <p className="text-xl font-bold text-slate-900">{selectedSchool.headTeacher.name}</p>
                            <div className="flex items-center gap-4 mt-2 text-slate-500">
                              <span className="flex items-center gap-1 text-sm"><Mail size={16} /> {selectedSchool.headTeacher.username}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-100 border-dashed rounded-2xl p-8 text-center text-slate-500">
                          <AlertCircle size={32} className="mx-auto mb-3 opacity-50" />
                          <p>No head teacher assigned yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <p>Failed to load school details.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuperAdminDashboard;
