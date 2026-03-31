
import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { Role, User } from '../types';
import { CheckCircle2, XCircle, Clock, Calendar } from 'lucide-react';
import { db } from '../src/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  setDoc, 
  doc,
  serverTimestamp
} from 'firebase/firestore';

import { handleFirestoreError, OperationType } from '../services/errorService';

const AttendanceView: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    // Fetch students
    const qStudents = query(collection(db, 'users'), where('role', 'in', [Role.STUDENT, Role.ESTUDIANTE]));
    const unsubscribeStudents = onSnapshot(qStudents, (snapshot) => {
      const studentsList = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
      setStudents(studentsList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    // Fetch attendance
    const qAttendance = collection(db, 'attendance');
    const unsubscribeAttendance = onSnapshot(qAttendance, (snapshot) => {
      const attendanceList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAttendance(attendanceList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'attendance');
      setLoading(false);
    });

    return () => {
      unsubscribeStudents();
      unsubscribeAttendance();
    };
  }, []);

  const handleMarkAttendance = async (studentId: string, present: boolean) => {
    setMarking(studentId);
    try {
      const attendanceId = `${selectedDate}_${studentId}`;
      await setDoc(doc(db, 'attendance', attendanceId), {
        student_id: studentId,
        date: selectedDate,
        present,
        updated_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Error al registrar asistencia');
    } finally {
      setMarking(null);
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Cargando asistencia...</div>;

  const today = new Date().toISOString().split('T')[0];
  const isFutureDate = selectedDate > today;
  const targetStudentId = user?.role === Role.FAMILY ? user?.student_id : user?.uid;
  const myAttendance = attendance.filter(a => a.student_id === targetStudentId);

  return (
    <div className="flex flex-col gap-8 py-8 px-6 md:px-10">
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 px-2">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Presentismo</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Control de Asistencia</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white/5 p-2 rounded-3xl border border-white/10">
          <button 
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="p-2 hover:bg-white/10 rounded-xl text-slate-400 transition-all"
            title="Día anterior"
          >
            <Clock className="size-5 rotate-180" />
          </button>
          
          <div className="relative flex items-center group">
            <Calendar className="absolute left-4 size-4 text-emerald-500 pointer-events-none group-hover:scale-110 transition-transform" />
            <input 
              type="date" 
              value={selectedDate}
              max={today}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-emerald-500/10 text-emerald-500 pl-11 pr-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border border-emerald-500/20 outline-none cursor-pointer hover:bg-emerald-500/20 transition-all"
            />
          </div>

          <button 
            disabled={selectedDate >= today}
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="p-2 hover:bg-white/10 rounded-xl text-slate-400 transition-all disabled:opacity-20"
            title="Día siguiente"
          >
            <Clock className="size-5" />
          </button>
        </div>
      </section>

      {(user?.role === Role.STUDENT || user?.role === Role.FAMILY) && (
        <section className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-center">
            <h2 className="text-lg font-black text-white uppercase tracking-tight mb-2">
              {user?.role === Role.FAMILY ? 'Asistencia del Alumno' : 'Mi Asistencia'}
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-6">Resumen del Curso</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20">
                <p className="text-2xl font-black text-emerald-500">{myAttendance.filter(a => a.present).length}</p>
                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-1">Presente</p>
              </div>
              <div className="bg-red-500/10 p-6 rounded-3xl border border-red-500/20">
                <p className="text-2xl font-black text-red-500">{myAttendance.filter(a => !a.present).length}</p>
                <p className="text-[8px] font-black text-red-500 uppercase tracking-widest mt-1">Ausente</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-white uppercase tracking-tight px-2">Historial Reciente</h2>
            {myAttendance.length > 0 ? (
              [...myAttendance].sort((a, b) => b.date.localeCompare(a.date)).map((a, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${a.present ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {a.present ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{a.date}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{a.present ? 'Asistió' : 'Faltó'}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-xs font-bold uppercase text-center py-8">No hay registros de asistencia.</p>
            )}
          </div>
        </section>
      )}

      {(user?.role === Role.TEACHER || user?.role === Role.DIRECTOR || user?.role === Role.ADMIN) && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Pasar Lista</h2>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded-lg">Fecha: {selectedDate}</span>
              {selectedDate === today && <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Hoy</span>}
              {isFutureDate && <span className="text-[8px] font-bold text-amber-500 uppercase tracking-widest mt-1">Fecha Futura (Solo Lectura)</span>}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
            {students.map((student) => {
              const todayAttendance = attendance.find(a => a.student_id === student.uid && a.date === selectedDate);
              return (
                <div key={student.uid} className="p-6 border-b border-white/5 last:border-0 flex items-center justify-between hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-4">
                    <img src={student.avatar} className="size-10 rounded-xl border border-white/10" alt={student.name} />
                    <div>
                      <p className="text-sm font-bold text-white">{student.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Estudiante</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={marking === student.uid || isFutureDate}
                      onClick={() => handleMarkAttendance(student.uid, true)}
                      className={`p-3 rounded-xl transition-all disabled:opacity-30 ${
                        todayAttendance?.present 
                          ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
                          : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                      }`}
                    >
                      <CheckCircle2 className="size-5" />
                    </button>
                    <button
                      disabled={marking === student.uid || isFutureDate}
                      onClick={() => handleMarkAttendance(student.uid, false)}
                      className={`p-3 rounded-xl transition-all disabled:opacity-30 ${
                        todayAttendance && !todayAttendance.present
                          ? 'bg-red-500 text-black shadow-lg shadow-red-500/20' 
                          : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                      }`}
                    >
                      <XCircle className="size-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default AttendanceView;
