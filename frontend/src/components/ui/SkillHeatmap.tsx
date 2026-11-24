import React from 'react';
import { cn } from '@/lib/utils';

interface SkillHeatmapProps {
  skills: string[];
  data: Record<string, number[]>; // Department -> skill deficiency percentages
  className?: string;
}

export default function SkillHeatmap({
  skills,
  data,
  className,
}: SkillHeatmapProps) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className="min-w-[520px] grid grid-cols-[90px_repeat(5,1fr)] gap-2 text-center text-xs">
        <div className="p-2" />
        {skills.map((s) => (
          <div key={s} className="font-bold text-mut p-2 uppercase tracking-wide">
            {s}
          </div>
        ))}

        {Object.entries(data).map(([dept, values]) => (
          <React.Fragment key={dept}>
            <div className="font-bold text-ink text-left p-2.5 flex items-center">
              {dept}
            </div>
            {values.map((val, idx) => {
              const isHigh = val > 55;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: `rgba(220, 38, 38, ${val / 100})`,
                    color: isHigh ? '#ffffff' : 'var(--ink)',
                  }}
                  className="font-bold p-2.5 rounded-xl transition-all flex items-center justify-center shadow-xs"
                >
                  {val}%
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
