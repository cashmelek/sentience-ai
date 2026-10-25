import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, isQuotaError, setQuotaExhausted } from '../lib/firebase';
import type { SystemSettings } from '../types';

/**
 * B20 Adım 5 (Core Refactor): sistem ayarları (settings/system) + denetçi hassasiyeti
 * yönetimi App.tsx'ten ayrıştırıldı. Davranış birebir korunmuştur.
 */

const DEFAULT_SETTINGS: SystemSettings = {
  sentinelEnabled: true,
  maintenanceMode: false,
  maintenanceMessage: 'Size daha iyi bir deneyim sunmak için sistemimizi güncelliyoruz. Lütfen kısa bir süre sonra tekrar deneyin.',
  auditorSensitivity: 70,
  auditorModel: 'gemini-2.0-flash',
  ghostWriterModel: 'gemini-2.0-flash',
  // İntihal tespiti ayarları
  sentinelSearchPhrasesCount: 10,
  sentinelMinWordCount: 8,
  sentinelUseDynamicSimilarity: true,
  sentinelTrustFilter: true,
  sentinelRegionFilter: true,
  showBlogOnLanding: true,
  // Akademik Protokol Eşikleri & Çapraz Doğrulama
  sentinelMaxPlagiarismRate: 15,
  sentinelPerSourceLimit: 3,
  sentinelAcademicCrossCheck: {
    crossref: true,
    semanticScholar: true,
    pubmed: true,
    core: true
  },
  // B22: kapılı özellikler varsayılan kapalı (yalnız admin + yetki verilenler görür)
  featureAccess: { promoSite: false, classroom: false, trainingData: false },
  // Model & Yapay Zeka Motoru Parametreleri
  modelTemperature: 0.7,
  modelTopP: 0.95,
  fallbackToCloudOnFailure: true,
  // Embedding & Semantik Doğrulama
  embeddingProvider: 'cloud',
  embeddingThreshold: 0.75
};

export function useSystemSettings(isAdmin: boolean) {
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [localAuditorSensitivity, setLocalAuditorSensitivity] = useState(() => {
    try {
      const saved = localStorage.getItem('sentience_auditor_sensitivity');
      return saved ? parseInt(saved, 10) : 70;
    } catch {
      return 70;
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'system'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          const normalizedData = {
            ...data,
            auditorModel: (data.auditorModel && data.auditorModel.includes('1.5')) ? 'gemini-2.0-flash' : (data.auditorModel || 'gemini-2.0-flash'),
            ghostWriterModel: (data.ghostWriterModel && data.ghostWriterModel.includes('1.5')) ? 'gemini-2.0-flash' : (data.ghostWriterModel || 'gemini-2.0-flash')
          };
          setSystemSettings(prev => ({ ...prev, ...normalizedData }));
          const savedLocal = localStorage.getItem('sentience_auditor_sensitivity');
          if (!savedLocal && (normalizedData as any).auditorSensitivity) {
            setLocalAuditorSensitivity((normalizedData as any).auditorSensitivity);
          }
        }
      } catch (error: any) {
        if (isQuotaError(error)) {
          setQuotaExhausted(true);
        }
      }
    };
    fetchSettings();
  }, []);

  const handleSensitivityChange = (val: number) => {
    setLocalAuditorSensitivity(val);
    try {
      localStorage.setItem('sentience_auditor_sensitivity', val.toString());
    } catch {}
    if (isAdmin) {
      updateDoc(doc(db, 'settings', 'system'), { auditorSensitivity: val }).catch(console.error);
    }
  };

  return { systemSettings, localAuditorSensitivity, setLocalAuditorSensitivity, handleSensitivityChange };
}
