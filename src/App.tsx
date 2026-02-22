import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  GraduationCap, 
  Library, 
  Wallet, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  School as SchoolIcon,
  FileText,
  BarChart3,
  Plus,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, UserRole } from './types';
import Logo from './components/Logo';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SuperAdminDashboard from './components/dashboards/SuperAdminDashboard';
import SchoolHeadDashboard from './components/dashboards/SchoolHeadDashboard';
import TeacherDashboard from './components/dashboards/TeacherDashboard';
import StudentDashboard from './components/dashboards/StudentDashboard';
import LibrarianDashboard from './components/dashboards/LibrarianDashboard';
import AccountsDashboard from './components/dashboards/AccountsDashboard';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: User, token: string) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage onLogin={handleLogin} />} />
        <Route 
          path="/dashboard/*" 
          element={
            user ? (
              <DashboardLayout user={user} onLogout={handleLogout}>
                <Routes>
                  <Route index element={<DashboardRouter user={user} />} />
                  {/* Add more specific routes as needed */}
                </Routes>
              </DashboardLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
      </Routes>
    </Router>
  );
};

const DashboardRouter: React.FC<{ user: User }> = ({ user }) => {
  switch (user.role) {
    case 'super_admin':
    case 'associate_admin':
      return <SuperAdminDashboard user={user} />;
    case 'school_head':
      return <SchoolHeadDashboard user={user} />;
    case 'teacher':
      return <TeacherDashboard user={user} />;
    case 'student':
      return <StudentDashboard user={user} />;
    case 'librarian':
      return <LibrarianDashboard user={user} />;
    case 'accounts_clerk':
      return <AccountsDashboard user={user} />;
    default:
      return <div>Role not found</div>;
  }
};

const DashboardLayout: React.FC<{ user: User; onLogout: () => void; children: React.ReactNode }> = ({ user, onLogout, children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', roles: ['super_admin', 'associate_admin', 'school_head', 'teacher', 'student', 'librarian', 'accounts_clerk'] },
    { icon: SchoolIcon, label: 'Schools', roles: ['super_admin', 'associate_admin'] },
    { icon: Users, label: 'Users', roles: ['super_admin', 'school_head'] },
    { icon: GraduationCap, label: 'Classes', roles: ['school_head', 'teacher'] },
    { icon: FileText, label: 'Exams & Marks', roles: ['school_head', 'teacher', 'student'] },
    { icon: BookOpen, label: 'Materials', roles: ['school_head', 'teacher', 'student'] },
    { icon: Library, label: 'Library', roles: ['school_head', 'librarian', 'student'] },
    { icon: Wallet, label: 'Accounts', roles: ['school_head', 'accounts_clerk', 'student'] },
    { icon: Settings, label: 'Settings', roles: ['super_admin', 'school_head'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-kenya-black text-white transition-all duration-300 flex flex-col`}
      >
        <div className="p-6 flex items-center gap-3">
          <Logo size={48} />
          {isSidebarOpen && <span className="font-bold text-lg truncate">ALAKARA PRO</span>}
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {filteredMenu.map((item, idx) => (
            <button
              key={idx}
              className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-white/10 transition-colors text-left"
              title={item.label}
            >
              <item.icon size={20} className="text-kenya-green" />
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-kenya-red transition-colors text-left"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-8">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user.role.replace('_', ' ')}</p>
            </div>
            <div className="w-10 h-10 bg-kenya-green rounded-full flex items-center justify-center text-white font-bold">
              {user.name[0]}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 overflow-auto flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};

export default App;
