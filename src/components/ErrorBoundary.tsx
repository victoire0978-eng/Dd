import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Home } from 'lucide-react';
import { SESSIONS_KEY, STORAGE_KEY } from '../utils/memory';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('DAKIS AI caught an error in ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleResetChat = () => {
    try {
      localStorage.removeItem(SESSIONS_KEY);
    } catch (e) {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleFullReset = () => {
    try {
      localStorage.removeItem(SESSIONS_KEY);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('dakis_queen_mode');
    } catch (e) {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#050505] text-zinc-100 flex items-center justify-center p-4 select-none relative overflow-hidden font-sans">
          {/* Ambient Glow */}
          <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-rose-950/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-950/20 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 mx-auto flex items-center justify-center text-rose-400 mb-4 shadow-inner">
              <AlertTriangle className="w-8 h-8 animate-pulse" />
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Oups, un petit problème d'affichage !
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-2 leading-relaxed">
              DAKIS AI a rencontré une erreur inattendue lors du rendu. Vos données ont été protégées.
            </p>

            {this.state.error && (
              <div className="mt-4 p-3 bg-black/40 border border-white/5 rounded-xl text-left overflow-auto max-h-24 text-[11px] font-mono text-rose-300/80">
                {this.state.error.message || 'Erreur inconnue'}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold text-xs tracking-wide shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Recharger l'application
              </button>

              <button
                type="button"
                onClick={this.handleResetChat}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-medium text-xs active:scale-95 transition-all"
              >
                <Home className="w-3.5 h-3.5" />
                Réinitialiser la discussion
              </button>

              <button
                type="button"
                onClick={this.handleFullReset}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-white/40 hover:text-rose-400 font-medium text-[11px] hover:bg-rose-500/5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Nettoyer le cache local corrompu
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
