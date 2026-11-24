import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: string;
  isPositive?: boolean;
  trendPositive?: boolean;
  icon?: React.ReactNode;
  subtitle?: string;
}

export default function StatCard({
  label,
  value,
  change,
  trend,
  isPositive,
  trendPositive,
  icon,
  subtitle,
}: StatCardProps) {
  const displayTrend = change ?? trend;
  const positive = isPositive !== undefined ? isPositive : (trendPositive !== undefined ? trendPositive : true);

  return (
    <div className="group bg-card border border-line/80 hover:border-line rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-pri/3 rounded-full blur-2xl group-hover:bg-pri/6 transition-colors pointer-events-none" />

      <div className="flex items-start justify-between gap-3 mb-3 relative z-10">
        <span className="text-xs font-semibold text-mut tracking-tight">{label}</span>
        {icon && (
          <div className="p-2 rounded-xl bg-bg border border-line text-pri group-hover:scale-105 group-hover:border-pri/30 transition-all shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-1.5 relative z-10">
        <b className="text-2xl sm:text-3xl font-extrabold text-ink block tracking-tight">{value}</b>
        
        <div className="flex items-center gap-2 flex-wrap">
          {displayTrend && (
            <span
              className={`inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full not-italic transition-transform group-hover:scale-102 ${
                positive
                  ? 'bg-okt text-ok border border-ok/20'
                  : 'bg-bt text-bad border border-bad/20'
              }`}
            >
              {positive ? '↑ ' : '↓ '}
              {displayTrend}
            </span>
          )}
          {subtitle && (
            <span className="text-[11px] text-mut font-medium">{subtitle}</span>
          )}
        </div>
      </div>
    </div>
  );
}
