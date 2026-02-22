import React, { useState, useEffect } from 'react';
import { Plus, Users, BookOpen, AlertCircle, Trash2, ArrowLeft, UserPlus } from 'lucide-react';

const ClassesTab: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for managing a specific class
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentUsername, setNewStudentUsername] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [newStudentAdmission, setNewStudentAdmission] = useState('');
  const [studentError, setStudentError] = useState('');
  const [studentSuccess, setStudentSuccess] = useState('');

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
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async (classId: number) => {
    try {
      const response = await fetch(`/api/classes/${classId}/students`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName) return;
    setError('');
    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: newClassName }),
      });
      if (response.ok) {
        setNewClassName('');
        fetchClasses();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create class');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while creating the class.');
    }
  };

  const handleManageClass = (cls: any) => {
    setSelectedClass(cls);
    fetchStudents(cls.id);
  };

  const handleBackToClasses = () => {
    setSelectedClass(null);
    setStudents([]);
    setStudentError('');
    setStudentSuccess('');
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !newStudentName || !newStudentUsername || !newStudentPassword || !newStudentAdmission) return;
    setStudentError('');
    setStudentSuccess('');
    
    try {
      const response = await fetch(`/api/classes/${selectedClass.id}/students`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          name: newStudentName,
          username: newStudentUsername,
          password: newStudentPassword,
          admission_number: newStudentAdmission
        }),
      });
      
      if (response.ok) {
        setNewStudentName('');
        setNewStudentUsername('');
        setNewStudentPassword('');
        setNewStudentAdmission('');
        setStudentSuccess('Student added successfully!');
        fetchStudents(selectedClass.id);
        setTimeout(() => setStudentSuccess(''), 3000);
      } else {
        const data = await response.json();
        setStudentError(data.error || 'Failed to add student');
      }
    } catch (err) {
      console.error(err);
      setStudentError('An error occurred while adding the student.');
    }
  };

  const handleDeleteStudent = async (studentId: number) => {
    if (!selectedClass) return;
    if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) return;
    
    try {
      const response = await fetch(`/api/classes/${selectedClass.id}/students/${studentId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        fetchStudents(selectedClass.id);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete student');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while deleting the student.');
    }
  };

  if (selectedClass) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBackToClasses}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-kenya-black">Manage Class: {selectedClass.name}</h2>
            <p className="text-slate-500">Add or remove students from this class</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Add Student Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <UserPlus size={20} className="text-kenya-green" />
                Add New Student
              </h2>
              {studentError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm font-bold border border-red-100">
                  {studentError}
                </div>
              )}
              {studentSuccess && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-xl text-sm font-bold border border-green-100">
                  {studentSuccess}
                </div>
              )}
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">Full Name *</label>
                  <input 
                    type="text" 
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 focus:border-kenya-green focus:outline-none transition-all"
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">Admission Number *</label>
                  <input 
                    type="text" 
                    value={newStudentAdmission}
                    onChange={(e) => setNewStudentAdmission(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 focus:border-kenya-green focus:outline-none transition-all"
                    placeholder="e.g. ADM-2023-001"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">Username *</label>
                  <input 
                    type="text" 
                    value={newStudentUsername}
                    onChange={(e) => setNewStudentUsername(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 focus:border-kenya-green focus:outline-none transition-all"
                    placeholder="e.g. jdoe"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-600 block mb-2">Password *</label>
                  <input 
                    type="password" 
                    value={newStudentPassword}
                    onChange={(e) => setNewStudentPassword(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 focus:border-kenya-green focus:outline-none transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <button className="w-full bg-kenya-black text-white py-4 rounded-xl font-bold hover:bg-kenya-red transition-all">
                  Add Student
                </button>
              </form>
            </div>
          </div>

          {/* Students List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Users size={20} className="text-kenya-black" />
                  Enrolled Students ({students.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Adm No.</th>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Username</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-sm text-slate-500">{student.admission_number}</td>
                        <td className="px-6 py-4 font-bold text-slate-700">{student.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{student.username}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDeleteStudent(student.id)}
                            className="p-2 text-slate-400 hover:text-kenya-red hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove student"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                          <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                          <p>No students enrolled in this class yet.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Add Class Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Plus size={20} className="text-kenya-green" />
              Create New Class
            </h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm font-bold border border-red-100">
                {error}
              </div>
            )}
            <form onSubmit={handleAddClass} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-600 block mb-2">Class Name</label>
                <input 
                  type="text" 
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 focus:border-kenya-green focus:outline-none transition-all"
                  placeholder="e.g. Form 1A"
                  required
                />
              </div>
              <button className="w-full bg-kenya-black text-white py-4 rounded-xl font-bold hover:bg-kenya-red transition-all">
                Create Class
              </button>
            </form>
          </div>
        </div>

        {/* Classes List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h2 className="text-xl font-bold">Managed Classes</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {classes.map((cls) => (
                <div key={cls.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{cls.name}</h3>
                      <p className="text-xs text-slate-500">ID: CLS-{cls.id.toString().padStart(4, '0')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => handleManageClass(cls)}
                      className="px-4 py-2 bg-slate-100 hover:bg-kenya-black hover:text-white text-slate-600 rounded-xl font-bold text-sm transition-colors"
                    >
                      Manage Students
                    </button>
                  </div>
                </div>
              ))}
              {classes.length === 0 && !isLoading && (
                <div className="p-12 text-center text-slate-400">
                  <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No classes registered yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassesTab;
