import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, AlertCircle, Trash2 } from 'lucide-react';

const SubjectsTab: React.FC = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/subjects', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName) return;
    setError('');
    try {
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: newSubjectName }),
      });
      if (response.ok) {
        setNewSubjectName('');
        fetchSubjects();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create subject');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while creating the subject.');
    }
  };

  const handleDeleteSubject = async (subjectId: number) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    
    try {
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        fetchSubjects();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete subject');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while deleting the subject.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Add Subject Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Plus size={20} className="text-kenya-green" />
              Create New Subject
            </h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm font-bold border border-red-100">
                {error}
              </div>
            )}
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-600 block mb-2">Subject Name</label>
                <input 
                  type="text" 
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 focus:border-kenya-green focus:outline-none transition-all"
                  placeholder="e.g. Mathematics"
                  required
                />
              </div>
              <button className="w-full bg-kenya-black text-white py-4 rounded-xl font-bold hover:bg-kenya-red transition-all">
                Create Subject
              </button>
            </form>
          </div>
        </div>

        {/* Subjects List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h2 className="text-xl font-bold">Managed Subjects</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {subjects.map((subject) => (
                <div key={subject.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{subject.name}</h3>
                      <p className="text-xs text-slate-500">ID: SUB-{subject.id.toString().padStart(4, '0')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => handleDeleteSubject(subject.id)}
                      className="p-2 text-slate-400 hover:text-kenya-red hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete subject"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {subjects.length === 0 && !isLoading && (
                <div className="p-12 text-center text-slate-400">
                  <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No subjects registered yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectsTab;
