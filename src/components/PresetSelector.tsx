import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bookmark,
  Sparkles,
  BookOpen,
  GraduationCap,
  FileSpreadsheet,
  PenTool,
  ChevronDown,
  Plus,
  Trash2,
  Check
} from 'lucide-react';
import { cn } from '../lib/utils';

export interface PresetItem {
  id: string;
  name: string;
  tone: string;
  intensity: number;
  description?: string;
  isCustom?: boolean;
}

export const DEFAULT_PRESETS: PresetItem[] = [
  {
    id: 'academic_paper',
    name: 'Akademik Makale',
    tone: 'Akademik',
    intensity: 85,
    description: 'Turnitin ve hakemli dergiler için yüksek insanlaştırma'
  },
  {
    id: 'thesis_chapter',
    name: 'Tez Bölümü',
    tone: 'Akademik',
    intensity: 75,
    description: 'Akademik akıcılık ve literatür uyumu'
  },
  {
    id: 'official_report',
    name: 'Resmi Rapor',
    tone: 'Resmi',
    intensity: 70,
    description: 'Kurumsal yazışmalar ve bürokratik raporlar'
  },
  {
    id: 'creative_blog',
    name: 'Yaratıcı & Blog',
    tone: 'Yaratıcı',
    intensity: 85,
    description: 'Özgün anlatım ve akıcı edebi üslup'
  },
  {
    id: 'light_touch',
    name: 'Hafif Rötuş',
    tone: 'Profesyonel',
    intensity: 45,
    description: 'Metni değiştirmeden robotik tınıyı kırma'
  }
];

const STORAGE_KEY = 'sentience_user_presets';

interface PresetSelectorProps {
  currentTone: string;
  currentIntensity: number;
  onApplyPreset: (tone: string, intensity: number) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  currentTone,
  currentIntensity,
  onApplyPreset
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customPresets, setCustomPresets] = useState<PresetItem[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setCustomPresets(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveCustomPresets = (items: PresetItem[]) => {
    setCustomPresets(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  const handleSaveCurrent = () => {
    if (!newPresetName.trim()) return;
    const newPreset: PresetItem = {
      id: 'custom_' + Date.now(),
      name: newPresetName.trim(),
      tone: currentTone,
      intensity: currentIntensity,
      description: `%${currentIntensity} Yoğunluk • ${currentTone} Tonu`,
      isCustom: true
    };
    saveCustomPresets([...customPresets, newPreset]);
    setNewPresetName('');
    setIsAddingCustom(false);
  };

  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveCustomPresets(customPresets.filter(p => p.id !== id));
  };

  const allPresets = [...DEFAULT_PRESETS, ...customPresets];

  const matchedPreset = allPresets.find(
    p => p.tone.toLowerCase() === currentTone.toLowerCase() && p.intensity === currentIntensity
  );

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Bookmark className="w-3.5 h-3.5 text-emerald-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
          HAZIR ŞABLON
        </span>
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white text-xs font-bold transition-all"
      >
        <span className="truncate max-w-[130px] text-emerald-400">
          {matchedPreset ? matchedPreset.name : 'Özel Ayar'}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 mt-2 w-80 bg-[#0e1615] border border-emerald-500/20 rounded-2xl shadow-2xl overflow-hidden z-50 p-2 space-y-2 backdrop-blur-xl"
            >
              <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  ŞABLON SEÇİN
                </span>
                <span className="text-[9px] text-gray-500 font-mono">
                  {allPresets.length} Şablon
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                <div className="text-[9px] font-bold text-gray-500 uppercase px-2 pt-1">
                  Önerilen Akademik Şablonlar
                </div>
                {DEFAULT_PRESETS.map(preset => {
                  const isActive = matchedPreset?.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        onApplyPreset(preset.tone, preset.intensity);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 group',
                        isActive
                          ? 'bg-emerald-500/20 border border-emerald-500/30'
                          : 'hover:bg-white/5 border border-transparent'
                      )}
                    >
                      <div className="p-1.5 rounded-lg bg-white/5 text-emerald-400 mt-0.5 shrink-0">
                        {preset.id.includes('academic') || preset.id.includes('thesis') ? (
                          <GraduationCap className="w-3.5 h-3.5" />
                        ) : preset.id.includes('creative') ? (
                          <PenTool className="w-3.5 h-3.5" />
                        ) : (
                          <BookOpen className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {preset.name}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400/80">
                            %{preset.intensity} • {preset.tone}
                          </span>
                        </div>
                        {preset.description && (
                          <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
                            {preset.description}
                          </p>
                        )}
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-1" />}
                    </button>
                  );
                })}

                {customPresets.length > 0 && (
                  <>
                    <div className="text-[9px] font-bold text-gray-500 uppercase px-2 pt-2 border-t border-white/5">
                      Kullanıcı Şablonlarım
                    </div>
                    {customPresets.map(preset => {
                      const isActive = matchedPreset?.id === preset.id;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => {
                            onApplyPreset(preset.tone, preset.intensity);
                            setIsOpen(false);
                          }}
                          className={cn(
                            'w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer',
                            isActive
                              ? 'bg-emerald-500/20 border border-emerald-500/30'
                              : 'hover:bg-white/5 border border-transparent'
                          )}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Bookmark className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <div className="truncate">
                              <span className="text-xs font-bold text-white block truncate">
                                {preset.name}
                              </span>
                              <span className="text-[9px] font-mono text-gray-400">
                                %{preset.intensity} • {preset.tone}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={e => handleDeleteCustom(preset.id, e)}
                            className="p-1 hover:text-red-400 text-gray-600 transition-colors shrink-0"
                            title="Şablonu Sil"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              <div className="pt-2 border-t border-white/5">
                {isAddingCustom ? (
                  <div className="space-y-2 p-1">
                    <input
                      type="text"
                      placeholder="Şablon Adı (Örn: Makale Ayarım)..."
                      value={newPresetName}
                      onChange={e => setNewPresetName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveCurrent();
                        if (e.key === 'Escape') setIsAddingCustom(false);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveCurrent}
                        disabled={!newPresetName.trim()}
                        className="flex-1 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-wider disabled:opacity-50 transition-all"
                      >
                        Kaydet
                      </button>
                      <button
                        onClick={() => setIsAddingCustom(false)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] font-bold"
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingCustom(true)}
                    className="w-full py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3 h-3" /> Mevcut Ayarları Şablon Kaydet
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
