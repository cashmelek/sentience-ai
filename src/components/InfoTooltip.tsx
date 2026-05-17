import React from 'react';
import { Info } from 'lucide-react';
import { cn } from '../lib/utils';

interface InfoTooltipProps {
  text: string;
  children?: React.ReactNode;
  className?: string;
  position?: 'top' | 'bottom';
  align?: 'left' | 'right' | 'center';
}

export const InfoTooltip = ({ text, children, className, position = 'top', align = 'center' }: InfoTooltipProps) => (
  <div className={cn("group relative inline-block align-middle select-none", className)}>
    {children ? (
      <div className="cursor-help">
        {children}
      </div>
    ) : (
      <div className="ml-1 p-1 rounded-full bg-emerald-500/5 hover:bg-emerald-500/20 transition-all cursor-help border border-emerald-500/10 hover:border-emerald-500/30 group-hover:scale-110">
        <Info className="w-3 h-3 text-emerald-500/70 group-hover:text-emerald-400 transition-colors" />
      </div>
    )}
    <div className={cn(
      "absolute px-3 py-2 bg-[#0a0a0a]/98 border border-white/10 rounded-xl text-[10px] font-medium text-gray-400 w-56 sm:w-64 max-w-[calc(100vw-2rem)] opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[9999] shadow-2xl backdrop-blur-2xl leading-relaxed text-left scale-95 group-hover:scale-100 select-none",
      position === 'top' ? "bottom-full mb-2 origin-bottom" : "top-full mt-2 origin-top",
      align === 'center' ? "left-1/2 -translate-x-1/2" : 
      align === 'left' ? "left-0" : "right-0"
    )}>
      <div className="text-emerald-500/80 mb-1 text-[8px] font-black uppercase tracking-[0.2em] border-b border-white/5 pb-1 flex items-center gap-2">
        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
        SİSTEM BİLGİSİ
      </div>
      <div className="break-words whitespace-normal leading-normal">
        {text}
      </div>
      <div className={cn(
        "absolute border-[4px] border-transparent",
        position === 'top' ? "top-full border-t-[#0a0a0a]/98" : "bottom-full border-b-[#0a0a0a]/98",
        align === 'center' ? "left-1/2 -translate-x-1/2" : 
        align === 'left' ? "left-4" : "right-4"
      )} />
    </div>
  </div>
);
