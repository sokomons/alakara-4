import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, CheckCircle2, AlertCircle, Settings } from 'lucide-react';

interface GradingRule {
  min_score: number;
  max_score: number;
  grade: string;
  points: number;
}

const GradingSystemTab: React.FC = () => {
  const [grading, setGrading] = useState<GradingRule[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGradingSystem();
  }, []);

  const fetchGradingSystem = async () => {
    try {
      const response = await fetch('/api/grading', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setGrading(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRule = () => {
    setGrading([...grading, { min_score: 0, max_score: 0, grade: '', points: 0 }]);
  };

  const handleRemoveRule = (index: number) => {
    const newGrading = [...grading];
    newGrading.splice(index, 1);
    setGrading(newGrading);
  };

  const handleChange = (index: number, field: keyof GradingRule, value: string | number) => {
    const newGrading = [...grading];
    newGrading[index] = { ...newGrading[index], [field]: value };
    setGrading(newGrading);
  };

  const handleSave = async () => {
    // Basic validation
    for (const rule of grading) {
      if (rule.min_score > rule.max_score) {
        setMessage({ text: 'Min score cannot be greater than max score.', type: 'error' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        return;
      }
      if (!rule.grade) {
        setMessage({ text: 'Grade cannot be empty.', type: 'error' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/grading', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ grading }),
      });

      if (response.ok) {
        setMessage({ text: 'Grading system saved successfully!', type: 'success' });
      } else {
        setMessage({ text: 'Failed to save grading system.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'An error occurred.', type: 'error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading grading system...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings size={20} className="text-kenya-green" />
            Adjust Grading System
          </h2>
          <button 
            onClick={handleSave}
            disabled={isSubmitting}
            className="bg-kenya-black text-white px-6 py-2 rounded-xl font-bold hover:bg-kenya-red transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} /> Save Changes
          </button>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 font-bold border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            {message.text}
          </div>
        )}

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <div className="grid grid-cols-12 gap-4 mb-4 text-sm font-bold text-slate-600 px-2">
            <div className="col-span-3">Min Score</div>
            <div className="col-span-3">Max Score</div>
            <div className="col-span-3">Grade</div>
            <div className="col-span-2">Points</div>
            <div className="col-span-1 text-center">Action</div>
          </div>

          <div className="space-y-3">
            {grading.map((rule, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-center bg-white p-2 rounded-xl border border-slate-200">
                <div className="col-span-3">
                  <input 
                    type="number" 
                    value={rule.min_score}
                    onChange={(e) => handleChange(index, 'min_score', Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-kenya-green focus:outline-none transition-all"
                  />
                </div>
                <div className="col-span-3">
                  <input 
                    type="number" 
                    value={rule.max_score}
                    onChange={(e) => handleChange(index, 'max_score', Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-kenya-green focus:outline-none transition-all"
                  />
                </div>
                <div className="col-span-3">
                  <input 
                    type="text" 
                    value={rule.grade}
                    onChange={(e) => handleChange(index, 'grade', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-kenya-green focus:outline-none transition-all uppercase"
                  />
                </div>
                <div className="col-span-2">
                  <input 
                    type="number" 
                    value={rule.points}
                    onChange={(e) => handleChange(index, 'points', Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-kenya-green focus:outline-none transition-all"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <button 
                    onClick={() => handleRemoveRule(index)}
                    className="p-2 text-slate-400 hover:text-kenya-red hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={handleAddRule}
            className="mt-6 flex items-center gap-2 text-kenya-green font-bold hover:text-kenya-black transition-colors px-2"
          >
            <Plus size={18} /> Add Grading Rule
          </button>
        </div>
      </div>
    </div>
  );
};

export default GradingSystemTab;
