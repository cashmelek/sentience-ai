import React from 'react';
import { motion } from 'framer-motion';
import { Zap, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { InfoTooltip } from './InfoTooltip';

interface ScoreCircleProps {
  score: number;
  label: string;
  size?: number;
  color?: string;
  inverse?: boolean;
  type?: 'ai' | 'plagiarism';
}

export const ScoreCircle: React.FC<ScoreCircleProps> = ({
  score,
  label,
  size = 160,
  color: customColor,
  inverse = false,
  type = 'ai'
}) => {
  const normalizedScore = score > 1 ? score / 100 : Math.max(0, score);
  const displayScore = inverse ? Math.max(0, 1 - normalizedScore) : normalizedScore;
  const percentage = Math.round(displayScore * 100);
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - Math.min(1, Math.max(0, displayScore)) * circumference;

  const isHighRisk = type === 'ai' ? displayScore > 0.7 : displayScore < 0.5;
  const isSafe = type === 'ai' ? displayScore < 0.3 : displayScore > 0.85;

  const color = customColor || (isHighRisk ? '#ef4444' : isSafe ? '#10b981' : '#f59e0b');
  const glowColor = isHighRisk
    ? 'rgba(239, 68, 68, 0.3)'
    : isSafe
    ? 'rgba(16, 185, 129, 0.3)'
    : 'rgba(245, 158, 11, 0.3)';

  const getBadgeText = () => {
    if (type === 'ai') {
      if (displayScore > 0.7) return 'YÜKSEK YZ OLASILIĞI';
      if (displayScore < 0.3) return 'İNSAN YAZIMI DOĞRULANDI';
      return 'KARMA İÇERİK YAPISI';
    } else {
      if (displayScore > 0.85) return 'TAMAMEN ÖZGÜN';
      if (displayScore > 0.5) return 'KISMI BENZERLİK TESPİTİ';
      return 'KRİTİK İNTİHAL RİSKİ';
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-white/5"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 10px ${glowColor})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-white tracking-tighter">%{percentage}</span>
          <span className="text-sm font-black text-gray-500 uppercase tracking-widest mt-1">{label}</span>
        </div>
      </div>
      <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }} />
        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">
          {getBadgeText()}
        </span>
      </div>
    </div>
  );
};

interface AuditMetricCardProps {
  title: string;
  value: string;
  percentage: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  detail?: string;
  trend?: 'up' | 'down';
  tooltip?: string;
}

export const AuditMetricCard: React.FC<AuditMetricCardProps> = ({
  title,
  value,
  percentage,
  icon: Icon,
  color,
  detail,
  trend,
  tooltip
}) => {
  const normalizedPct = percentage > 1 ? percentage / 100 : Math.max(0, percentage);
  return (
  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.06] transition-all group relative">
    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
      <Icon className={cn('w-12 h-12', color)} />
    </div>
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-3">
        <div className={cn('p-2 rounded-xl bg-white/5 group-hover:scale-110 transition-transform flex items-center gap-2', color)}>
          <Icon className="w-4 h-4" />
          {tooltip && <InfoTooltip text={tooltip} position="bottom" />}
        </div>
        <div className="text-left">
          <div className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-500 mb-1">
            {title}
          </div>
          <div className="text-2xl font-black text-white">{value}</div>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(1, Math.max(0, normalizedPct)) * 100}%` }}
            className={cn(
              'h-full shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all duration-1000',
              normalizedPct > 0.7 ? 'bg-red-500' : normalizedPct > 0.3 ? 'bg-amber-500' : 'bg-emerald-500'
            )}
          />
        </div>
        <div className="flex justify-between items-center">
          {detail && <div className="text-[11px] text-gray-400 font-bold truncate max-w-[160px]">{detail}</div>}
          {trend && (
            <div
              className={cn(
                'text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1',
                trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
              )}
            >
              {trend === 'up' ? <Zap className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
              {trend === 'up' ? 'OPTİMAL' : 'DÜŞÜK'}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
};

interface MetricProgressProps {
  label: string;
  value: string;
  percentage: number;
  icon: React.ComponentType<{ className?: string }>;
}

export const MetricProgress: React.FC<MetricProgressProps> = ({
  label,
  value,
  percentage,
  icon: Icon
}) => {
  const normalized = percentage > 1 ? percentage / 100 : Math.max(0, Math.min(1, percentage));
  return (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center px-1">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3 h-3 text-emerald-500/70" />
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight">{label}</span>
      </div>
      <span className="text-[10px] font-black text-white">{value}</span>
    </div>
    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${normalized * 100}%` }}
        className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
      />
    </div>
  </div>
);
};
