import { useState } from 'react';
import {
  Plus,
  Trash2,
  LogOut,
  Fingerprint,
  FileText,
  User as UserIcon,
  Settings2,
  HelpCircle,
  ExternalLink,
  Database,
  GraduationCap,
  Sparkles,
  RefreshCw,
  Users,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';
import { OnboardingChecklist } from './OnboardingChecklist';
import type { AppUser, Project } from '../types';

export interface ProjectSidebarProps {
  isOpen: boolean;
  appUser: AppUser | null;
  userEmail: string | undefined;
  isAdmin: boolean;
  projects: Project[];
  sidebarTab: 'history' | 'drafts';
  onSidebarTabChange: (tab: 'history' | 'drafts') => void;
  hasMoreProjects: boolean;
  onLoadMore: () => void;
  onSelectProject: (project: Project) => void;
  onDeleteProject: (id: string, title: string) => void;
  onNewProject: () => void;
  onShowGuide: () => void;
  onOpenAdmin: () => void;
  onOpenClassroom: () => void;
  onDownloadTrainingData: () => void;
  onOpenAccountSettings: () => void;
  onSeedDemoProjects?: () => Promise<void>;
  // B22: kapılı özelliklerin bu kullanıcı için görünürlüğü (admin/yetki verilmiş/Global açık)
  featureVisibility: { promoSite: boolean; classroom: boolean; trainingData: boolean };
}

export function ProjectSidebar({
  isOpen,
  appUser,
  userEmail,
  isAdmin,
  projects,
  sidebarTab,
  onSidebarTabChange,
  hasMoreProjects,
  onLoadMore,
  onSelectProject,
  onDeleteProject,
  onNewProject,
  onShowGuide,
  onOpenAdmin,
  onOpenClassroom,
  onDownloadTrainingData,
  onOpenAccountSettings,
  onSeedDemoProjects,
  featureVisibility,
}: ProjectSidebarProps) {
  const [isSeeding, setIsSeeding] = useState(false);
  const drafts = projects.filter((p) => p.isDraft);
  const historyItems = projects.filter((p) => !p.isDraft);
  const list = sidebarTab === 'history' ? historyItems : drafts;

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 w-80 border-r border-brand-border bg-brand-card flex flex-col z-[70] transition-transform duration-300 lg:relative lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="p-6 border-b border-brand-border flex items-center justify-between">
        <div className="flex items-center gap-2 font-black tracking-tighter text-xl text-emerald-500">
          <Fingerprint className="w-6 h-6" /> <span lang="en">SENTIENCE</span>
        </div>
        <div className="flex items-center">
          <button onClick={onShowGuide} className="p-1.5 hover:bg-white/5 rounded-lg mr-2">
            <HelpCircle className="w-4 h-4" />
          </button>
          <button onClick={onNewProject} className="p-1.5 hover:bg-white/5 rounded-lg">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {appUser && <OnboardingChecklist user={appUser} />}

      <div className="px-4 py-3 flex gap-2 border-b border-brand-border bg-black/10">
        <button
          onClick={() => onSidebarTabChange('history')}
          className={cn(
            'flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all',
            sidebarTab === 'history'
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
              : 'text-gray-600'
          )}
        >
          GEÇMİŞ
        </button>
        <button
          onClick={() => onSidebarTabChange('drafts')}
          className={cn(
            'flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all',
            sidebarTab === 'drafts'
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
              : 'text-gray-600'
          )}
        >
          TASLAKLAR ({drafts.length})
        </button>
      </div>

      <div className="px-4 py-2 border-b border-brand-border/40 flex items-center justify-between bg-black/5">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          {sidebarTab === 'history' ? `Kayıtlı (${historyItems.length})` : `Taslak (${drafts.length})`}
        </span>
        {isAdmin && onSeedDemoProjects && (
          <button
            onClick={async () => {
              if (!window.confirm("Mevcut taslaklar temizlenip yerine 4 farklı anlatımda gerçekçi test projeleri yüklensin mi?")) return;
              setIsSeeding(true);
              try {
                await onSeedDemoProjects();
              } finally {
                setIsSeeding(false);
              }
            }}
            disabled={isSeeding}
            className="text-[9px] font-black uppercase text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline transition-all disabled:opacity-50"
            title="Eski taslakları temizle ve örnek projeleri yükle"
          >
            {isSeeding ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
            {isSeeding ? 'Yükleniyor...' : 'Örnekleri Sıfırla & Yükle'}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
        {list.map((p) => (
          <div
            key={p.id}
            onClick={() => onSelectProject(p)}
            className="p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all flex justify-between items-center group"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-400 truncate w-28">{p.title}</span>
              {p.isShared && (
                <span className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[8px] font-mono" title="Paylaşılan Proje">
                  <Users className="w-2.5 h-2.5" /> Ortak
                </span>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteProject(p.id, p.title);
              }}
              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {hasMoreProjects && (
          <button
            onClick={onLoadMore}
            className="w-full py-2.5 my-1 text-[10px] font-bold text-gray-500 hover:text-emerald-400 uppercase tracking-wider text-center bg-white/[0.02] hover:bg-white/[0.05] rounded-xl border border-white/5 transition-all"
          >
            Daha Fazla Yükle
          </button>
        )}
      </div>

      <div className="p-4 border-t border-brand-border space-y-2 bg-black/20">
        <div className="grid grid-cols-2 gap-2">
          {featureVisibility.promoSite && (
            <a
              href="/?preview=landing"
              target="_blank"
              rel="noreferrer"
              className="py-2 px-2.5 bg-white/[0.03] hover:bg-white/[0.06] text-gray-400 hover:text-white rounded-xl text-[10px] font-bold tracking-tight transition-all flex items-center justify-center gap-1.5 border border-white/5 truncate"
              title="Tanıtım Sitesini Görüntüle"
            >
              <ExternalLink className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">Tanıtım</span>
            </a>
          )}
          {featureVisibility.classroom && (
            <button
              onClick={onOpenClassroom}
              className="py-2 px-2.5 bg-sky-500/10 text-sky-400 rounded-xl text-[10px] font-bold tracking-tight hover:bg-sky-500/20 transition-all flex items-center justify-center gap-1.5 border border-sky-500/20 truncate"
              title="Sınıflarım"
            >
              <GraduationCap className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Sınıflarım</span>
            </button>
          )}
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="py-2 px-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl text-[10px] font-bold tracking-tight hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-1.5 border border-emerald-500/20 truncate"
              title="Admin Paneli"
            >
              <Settings2 className="w-3 h-3 shrink-0" />
              <span className="truncate">Yönetim</span>
            </button>
          )}
          {featureVisibility.trainingData && (
            <button
              onClick={onDownloadTrainingData}
              className="py-2 px-2.5 bg-blue-500/10 text-blue-400 rounded-xl text-[10px] font-bold tracking-tight hover:bg-blue-500/20 transition-all flex items-center justify-center gap-1.5 border border-blue-500/20 truncate"
              title="Eğitim Verisi İndir"
            >
              <Database className="w-3 h-3 shrink-0" />
              <span className="truncate">Veri İndir</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 flex-shrink-0">
            <UserIcon className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex-1 truncate">
            <div className="text-[10px] font-bold truncate opacity-80">{userEmail}</div>
            <div className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">
              {appUser?.plan?.toUpperCase() || 'FREE'} Planı
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenAccountSettings}
              className="p-1.5 hover:text-emerald-500 text-gray-600"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            <button onClick={() => signOut(auth)} className="p-1.5 hover:text-white text-gray-600">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
