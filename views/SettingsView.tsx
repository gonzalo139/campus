
import React, { useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { Lock, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

const SettingsView: React.FC = () => {
  const { user, changePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await changePassword(newPassword);
      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError('Error al cambiar la contraseña. Es posible que deba volver a iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 py-8 px-6 md:px-10">
      <section className="mb-4 px-2">
        <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Configuración</h1>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Gestión de Perfil y Seguridad</p>
      </section>

      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
        <div className="flex items-center gap-6 mb-8">
          <img 
            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
            className="size-20 rounded-3xl border-2 border-primary/20 shadow-xl shadow-primary/5" 
            alt="Avatar" 
          />
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">{user?.name}</h2>
            <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">{user?.role}</p>
            <p className="text-[10px] text-slate-500 font-medium mt-1">
              {user?.email.endsWith('@campus48.local') ? user?.email.split('@')[0] : user?.email}
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5">
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
            <Lock className="size-4 text-primary" />
            Cambiar Contraseña
          </h3>

          <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold">
                <AlertCircle className="size-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 text-emerald-500 text-xs font-bold">
                <CheckCircle2 className="size-4 shrink-0" />
                <p>¡Contraseña actualizada con éxito!</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nueva Contraseña</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Confirmar Contraseña</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita la contraseña"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-black font-black py-4 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[0.98] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-black"></div>
              ) : (
                <>
                  <Save className="size-5" />
                  GUARDAR CAMBIOS
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
