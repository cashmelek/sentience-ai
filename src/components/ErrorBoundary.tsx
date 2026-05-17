import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uygulama hatası:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-8 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
            <AlertTriangle className="w-10 h-10 text-red-500 animate-pulse" />
          </div>
          
          <h1 className="text-3xl font-black text-white tracking-tighter mb-4 uppercase">BİR ŞEYLER TERS GİTTİ</h1>
          
          <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl mb-8 max-w-lg w-full">
            <p className="text-red-400 font-mono text-xs break-words overflow-auto max-h-32 text-left p-2 bg-black/40 rounded-lg border border-white/5">
              {this.state.error?.toString() || 'Bilinmeyen bir çalışma zamanı hatası oluştu.'}
            </p>
          </div>

          <p className="text-gray-400 max-w-md leading-relaxed font-medium mb-8">
            Uygulama beklenmedik bir şekilde durdu. Bu durum geçici bir tarayıcı hatası veya sistem güncellemesi kaynaklı olabilir.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-8 py-3 bg-emerald-500 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              <RefreshCw className="w-4 h-4" /> Sayfayı Yenile
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/';
              }}
              className="flex items-center gap-2 px-8 py-3 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:bg-white/10 transition-all"
            >
              <Home className="w-4 h-4" /> Önbelleği Temizle ve Dön
            </button>
          </div>
          
          <div className="mt-12 text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">
            Sentience AI - Resilience Protocol v1.0
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
