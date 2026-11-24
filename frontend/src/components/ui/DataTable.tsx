import React from 'react';
import { cn } from '@/lib/utils';
import EmptyState from './EmptyState';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  className?: string;
}

export default function DataTable<T>({
  columns,
  data,
  emptyMessage = 'No records found.',
  className,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return <EmptyState title="No Records" description={emptyMessage} />;
  }

  return (
    <div className={cn('overflow-x-auto rounded-xl border border-line bg-card shadow-sm', className)}>
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr className="border-b border-line bg-bg/50 text-mut text-xs uppercase tracking-wider font-semibold">
            {columns.map((col, i) => (
              <th key={i} className={cn('py-3.5 px-4', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {data.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-bg/40 transition-colors">
              {columns.map((col, colIdx) => (
                <td key={colIdx} className={cn('py-3 px-4 text-ink', col.className)}>
                  {col.cell
                    ? col.cell(row)
                    : col.accessorKey
                    ? String(row[col.accessorKey] ?? '')
                    : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
