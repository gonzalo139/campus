
import React from 'react';
import { useAuth } from './AuthContext';
import { Role } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Trophy, 
  LogOut, 
  Settings, 
  ShieldCheck, 
  School, 
  GraduationCap, 
  BookMarked, 
  UserPlus, 
  Link2, 
  Award, 
  Layers,
  ClipboardCheck,
  FolderKanban,
  Send
} from 'lucide-react';

interface NavigationProps {
  currentTab: string;
  setTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentTab, setTab }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getTabs = () => {
    switch (user.role) {
      case Role.ADMIN:
        return [
          { id: 'dashboard', icon: LayoutDashboard, label: 'Panel' },
          { id: 'schools', icon: School, label: 'Escuelas' },
          { id: 'courses', icon: GraduationCap, label: 'Cursos' },
          { id: 'subjects', icon: BookMarked, label: 'Materias' },
          { id: 'users', icon: UserPlus, label: 'Usuarios' },
          { id: 'assignments', icon: Link2, label: 'Asignaciones Docentes' },
          { id: 'student-assignments', icon: GraduationCap, label: 'Asignaciones Estudiantes' },
          { id: 'badges-levels', icon: Award, label: 'Badges & Niveles' },
          { id: 'attendance', icon: ClipboardCheck, label: 'Asistencia' },
          { id: 'leaderboard', icon: Trophy, label: 'Ranking' },
          { id: 'settings', icon: Settings, label: 'Ajustes' },
        ];
      case Role.TEACHER:
        return [
          { id: 'dashboard', icon: LayoutDashboard, label: 'Panel' },
          { id: 'my-courses', icon: GraduationCap, label: 'Mis Cursos' },
          { id: 'projects', icon: FolderKanban, label: 'Proyectos' },
          { id: 'users', icon: UserPlus, label: 'Estudiantes' },
          { id: 'submissions', icon: BookOpen, label: 'Entregas' },
          { id: 'attendance', icon: ClipboardCheck, label: 'Asistencia' },
          { id: 'evaluations', icon: ShieldCheck, label: 'Evaluaciones' },
          { id: 'leaderboard', icon: Trophy, label: 'Ranking' },
          { id: 'settings', icon: Settings, label: 'Ajustes' },
        ];
      case Role.DIRECTOR:
        return [
          { id: 'dashboard', icon: LayoutDashboard, label: 'Panel' },
          { id: 'attendance', icon: ClipboardCheck, label: 'Asistencia' },
          { id: 'leaderboard', icon: Trophy, label: 'Ranking' },
          { id: 'settings', icon: Settings, label: 'Ajustes' },
        ];
      case Role.STUDENT:
        return [
          { id: 'dashboard', icon: LayoutDashboard, label: 'Panel' },
          { id: 'submissions', icon: Send, label: 'Entregas' },
          { id: 'evaluations', icon: ShieldCheck, label: 'Evaluación' },
          { id: 'badges', icon: Award, label: 'Insignias' },
          { id: 'leaderboard', icon: Trophy, label: 'Ranking' },
          { id: 'settings', icon: Settings, label: 'Ajustes' },
        ];
      case Role.FAMILY:
        return [
          { id: 'dashboard', icon: LayoutDashboard, label: 'Panel' },
          { id: 'attendance', icon: ClipboardCheck, label: 'Asistencia' },
          { id: 'leaderboard', icon: Trophy, label: 'Ranking' },
          { id: 'settings', icon: Settings, label: 'Ajustes' },
        ];
      default:
        return [];
    }
  };

  const tabs = getTabs();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-auto max-w-[95vw]">
      <nav className="flex items-center gap-1 bg-black/80 backdrop-blur-xl px-2 py-2 rounded-[2rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-1 ring-black/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`relative flex flex-col items-center justify-center size-12 md:size-14 rounded-full transition-all duration-300 group ${
              currentTab === tab.id 
                ? 'bg-primary text-black shadow-lg shadow-primary/20' 
                : 'text-slate-400 hover:bg-white/10 hover:text-primary'
            }`}
          >
            <tab.icon className="size-5 md:size-6" />
            <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10 whitespace-nowrap hidden md:block">
              {tab.label}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
            </div>
          </button>
        ))}
        
        <div className="w-px h-8 bg-white/10 mx-1 hidden md:block" />
        
        <button 
          onClick={logout}
          className="flex items-center justify-center size-12 md:size-14 rounded-full text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all group relative"
        >
          <LogOut className="size-5 md:size-6" />
          <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-red-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10 whitespace-nowrap hidden md:block">
            Cerrar Sesión
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-red-900" />
          </div>
        </button>
      </nav>
    </div>
  );
};

export default Navigation;
