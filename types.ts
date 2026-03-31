
export enum Role {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  FAMILY = 'FAMILY',
  DIRECTOR = 'DIRECTOR',
  // Aliases for compatibility
  DOCENTE = 'DOCENTE',
  ESTUDIANTE = 'ESTUDIANTE',
  PROFESOR = 'PROFESOR'
}

export interface User {
  uid: string;
  id: string;
  email: string;
  role: Role;
  name?: string;
  avatar?: string;
  student_id?: string;
  total_points?: number;
  xp?: number;
  level?: number;
  course_id?: string;
  createdAt?: any;
  updated_at?: any;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  max_xp: number;
  year: number;
  is_active: boolean;
  created_at?: any;
  updated_at?: any;
}

export interface LeaderboardEntry {
  student_id: string;
  email: string;
  name?: string;
  avatar?: string;
  total_points: number;
}

export interface Alert {
  id: string;
  student_id: string;
  student_name: string;
  type: 'ATTENDANCE' | 'PERFORMANCE' | 'BEHAVIOR';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  date: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}
