import { cn } from '../lib/utils';

export interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subValue?: string;
  colorClass?: string;
}

export const MetricCard = ({ icon: Icon, label, value, subValue, colorClass = "text-emerald-500" }: MetricCardProps) => (
  <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 flex flex-col gap-1 hover:bg-white/[0.06] transition-all group shadow-lg">
    <div className="flex items-center gap-2 mb-2">
      <div className={cn("p-2 rounded-xl bg-white/5 group-hover:scale-110 transition-transform", colorClass)}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-xs font-black uppercase tracking-widest text-gray-500">{label}</span>
    </div>
    <div className="text-3xl font-black text-white">{value}</div>
    {subValue && <div className="text-[10px] text-gray-500 font-bold mt-1">{subValue}</div>}
  </div>
);
