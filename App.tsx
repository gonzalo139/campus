
import React from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import { Role } from './types';
import LoginView from './views/LoginView';
import AdminDashboard from './views/AdminDashboard';
import TeacherDashboard from './views/TeacherDashboard';
import StudentDashboard from './views/StudentDashboard';
import FamilyDashboard from './views/FamilyDashboard';
import DirectorDashboard from './views/DirectorDashboard';
import Leaderboard from './views/Leaderboard';
import PeerEvaluationView from './views/PeerEvaluationView';
import SubmissionsView from './views/SubmissionsView';
import AttendanceView from './views/AttendanceView';
import AlertsView from './views/AlertsView';
import SchoolsView from './views/SchoolsView';
import CoursesView from './views/CoursesView';
import SubjectsView from './views/SubjectsView';
import UsersView from './views/UsersView';
import AssignmentsView from './views/AssignmentsView';
import StudentAssignmentsView from './views/StudentAssignmentsView';
import BadgesLevelsView from './views/BadgesLevelsView';
import MyCoursesView from './views/MyCoursesView';
import ProjectsView from './views/ProjectsView';
import SettingsView from './views/SettingsView';
import Navigation from './components/Navigation';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = React.useState('dashboard');

  console.log('📱 AppContent: Rendering...', { loading, userEmail: user?.email });

  React.useEffect(() => {
    if (user) {
      const runDebug = async () => {
        console.log('📡 Firestore: START - Global debug addDoc(collection(db, "debug"), ...)');
        try {
          const { collection, addDoc } = await import('firebase/firestore');
          const { db, auth } = await import('./src/firebase');
          const debugRef = await addDoc(collection(db, 'debug'), {
            global_test: true,
            timestamp: Date.now(),
            user_uid: auth.currentUser?.uid || 'anonymous',
            user_email: auth.currentUser?.email || 'none'
          });
          console.log('📡 Firestore: SUCCESS - Global debug write successful! Doc ID:', debugRef.id);
        } catch (err: any) {
          console.error('📡 Firestore: FAIL - Global debug write FAILED:', err.code, err.message);
        }
      };
      runDebug();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f0b] flex flex-col items-center justify-center gap-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest animate-pulse">Iniciando Campus48...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const renderContent = () => {
    if (activeTab === 'settings') return <SettingsView />;
    if (activeTab === 'leaderboard') return <Leaderboard />;
    // Common Tabs
    if (activeTab === 'evaluations') return <PeerEvaluationView />;
    if (activeTab === 'submissions') return <SubmissionsView />;
    if (activeTab === 'attendance') return <AttendanceView />;
    if (activeTab === 'alerts') return <AlertsView />;
    if (activeTab === 'analytics') return <DirectorDashboard setTab={setActiveTab} />;
    
    // Role-based Rendering
    switch (user.role) {
      case Role.ADMIN:
        if (activeTab === 'schools') return <SchoolsView />;
        if (activeTab === 'courses') return <CoursesView />;
        if (activeTab === 'subjects') return <SubjectsView />;
        if (activeTab === 'users') return <UsersView />;
        if (activeTab === 'assignments') return <AssignmentsView />;
        if (activeTab === 'student-assignments') return <StudentAssignmentsView />;
        if (activeTab === 'badges-levels') return <BadgesLevelsView />;
        return <AdminDashboard setTab={setActiveTab} />;
      case Role.TEACHER:
        if (activeTab === 'my-courses') return <MyCoursesView />;
        if (activeTab === 'projects') return <ProjectsView />;
        if (activeTab === 'users') return <UsersView />;
        return <TeacherDashboard setTab={setActiveTab} />;
      case Role.STUDENT:
        if (activeTab === 'badges') return <BadgesLevelsView />;
        return <StudentDashboard setTab={setActiveTab} />;
      case Role.FAMILY:
        return <FamilyDashboard setTab={setActiveTab} />;
      case Role.DIRECTOR:
        return <DirectorDashboard setTab={setActiveTab} />;
      default:
        return <div className="p-10 text-center">Rol no reconocido: {user.role}</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#080c09] text-slate-100 font-sans">
      <Navigation currentTab={activeTab} setTab={setActiveTab} />
      <main className="w-full max-w-2xl mx-auto min-h-screen bg-[#111812] md:border-x md:border-white/5 transition-all duration-300">
        <header className="sticky top-0 z-50 bg-[#111812]/95 backdrop-blur-md px-6 py-5 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-black font-black text-xl shadow-lg shadow-primary/20">C</div>
            <div className="flex flex-col">
              <span className="font-black tracking-tighter text-base uppercase leading-none text-primary">Campus48</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Sistema Gamificado</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold">{user.name || user.email}</span>
              <span className="text-[9px] font-black text-primary uppercase">{user.role}</span>
            </div>
            <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} className="size-8 rounded-lg border border-white/10" alt="Me" />
          </div>
        </header>
        <div className="animate-in fade-in zoom-in-95 duration-500">
          {renderContent()}
        </div>
        <div className="h-32" />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
