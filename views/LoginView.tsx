
import React, { useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { LogIn, AlertCircle, User as UserIcon, Lock } from 'lucide-react';

const LoginView: React.FC = () => {
  const { login, loginWithUsername } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showUsernameLogin, setShowUsernameLogin] = useState(false);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await login();
    } catch (err: any) {
      setError('Error al iniciar sesión con Google. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor, ingrese usuario y contraseña.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await loginWithUsername(username, password);
    } catch (err: any) {
      setError('Usuario o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f0b] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111812] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="size-16 bg-primary rounded-2xl flex items-center justify-center text-black font-black text-3xl shadow-lg shadow-primary/20 mb-4">C</div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Campus48</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Acceso al Sistema</p>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold">
              <AlertCircle className="size-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {!showUsernameLogin ? (
            <>
              <p className="text-center text-slate-400 text-sm font-medium px-4">
                Bienvenido al Campus48. Inicie sesión para acceder a su panel.
              </p>

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-white text-black font-black py-4 rounded-2xl shadow-lg hover:scale-[0.98] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-black"></div>
                ) : (
                  <>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="size-5" alt="Google" />
                    INICIAR SESIÓN CON GOOGLE
                  </>
                )}
              </button>

              <button
                onClick={() => setShowUsernameLogin(true)}
                className="w-full bg-transparent text-white border border-white/10 font-bold py-4 rounded-2xl hover:bg-white/5 transition-all flex items-center justify-center gap-3"
              >
                <UserIcon className="size-5" />
                USAR USUARIO Y CONTRASEÑA
              </button>
            </>
          ) : (
            <form onSubmit={handleUsernameLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-4">Usuario</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ingrese su usuario"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-4">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-black font-black py-4 rounded-2xl shadow-lg hover:scale-[0.98] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-black"></div>
                ) : (
                  <>
                    <LogIn className="size-5" />
                    INICIAR SESIÓN
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowUsernameLogin(false)}
                className="w-full text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-all"
              >
                Volver a opciones de inicio
              </button>
            </form>
          )}
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
            Al ingresar, aceptas las normas de convivencia y el sistema de evaluación entre pares del Campus48.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
