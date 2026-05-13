import React from 'react';
import { Info } from 'lucide-react';
import { cn } from '../lib/utils';

interface InfoTooltipProps {
  text: string;
  className?: string;
  position?: 'top' | 'bottom';
}

export const InfoTooltip = ({ text, className, position = 'top' }: InfoTooltipProps) => (
  <div className={cn("group relative inline-block ml-2 align-middle", className)}>
    <div className="p-1.5 rounded-full bg-emerald-500/5 hover:bg-emerald-500/20 transition-all cursor-help border border-emerald-500/10 hover:border-emerald-500/30 group-hover:scale-110">
      <Info className="w-3.5 h-3.5 text-emerald-500/70 group-hover:text-emerald-400 transition-colors" />
    </div>
    <div className={cn(
      "absolute left-1/2 -translate-x-1/2 px-3 py-2.5 bg-[#0a0a0a]/98 border border-emerald-500/20 rounded-xl text-[11px] font-medium text-gray-300 w-56 max-w-[80vw] opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[9999] shadow-[0_15px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(16,185,129,0.05)] backdrop-blur-xl leading-snug text-left scale-95 group-hover:scale-100 origin-bottom",
      position === 'top' ? "bottom-full mb-2.5" : "top-full mt-2.5 origin-top"
    )}>
      <div className="text-emerald-500/80 mb-1.5 text-[8px] font-bold uppercase tracking-widest border-b border-white/5 pb-1 flex items-center gap-2">
        <div className="w-1 h-1 rounded-full bg-emerald-500/40" />
        Sistem bilgisi
      </div>
      <div className="text-gray-300/90 font-medium">
        {text}
      </div>
      <div className={cn(
        "absolute left-1/2 -translate-x-1/2 border-[5px] border-transparent",
        position === 'top' ? "top-full border-t-[#0a0a0a]/98" : "bottom-full border-b-[#0a0a0a]/98"
      )} />
    </div>
  </div>
);
