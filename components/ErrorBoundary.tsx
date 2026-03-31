
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
          <div className="w-full max-w-2xl bg-red-500/5 border border-red-500/20 rounded-[2.5rem] p-10 text-center">
            <div className="size-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-red-500 text-4xl">error</span>
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Algo salió mal</h1>
            <p className="text-slate-400 text-sm mb-8">La aplicación encontró un error inesperado. Por favor, intenta recargar la página.</p>
            
            <div className="bg-black/40 rounded-2xl p-6 text-left mb-8 overflow-auto max-h-60 border border-white/5">
              <p className="text-red-400 font-mono text-xs mb-2">{this.state.error?.toString()}</p>
              {this.state.errorInfo && (
                <pre className="text-slate-500 font-mono text-[10px] leading-relaxed">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-primary text-black font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[0.98] active:scale-95 transition-all uppercase tracking-widest text-xs"
            >
              Recargar Aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
