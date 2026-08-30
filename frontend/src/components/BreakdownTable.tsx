import React from 'react';
import { Table } from 'lucide-react';
import type { TableWidget } from '../types';

interface BreakdownTableProps {
  table: TableWidget;
}

export const BreakdownTable: React.FC<BreakdownTableProps> = ({ table }) => {
  if (!table || !table.headers || table.headers.length === 0) return null;

  return (
    <div className="my-4 border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      {/* Table Header Bar */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-gray-700" />
          <h4 className="text-[16px] font-normal leading-[1.4] tracking-[-0.02em] uppercase text-gray-800">
            {table.title}
          </h4>
        </div>
        <span className="text-[16px] text-gray-500 font-normal leading-[1.4] tracking-[-0.02em] bg-white px-2.5 py-0.5 rounded-md border border-gray-200">
          {table.rows.length} records
        </span>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[16px] font-normal leading-[1.4] tracking-[-0.02em] text-gray-900">
          <thead className="bg-gray-50/60 border-b border-gray-200 text-gray-600">
            <tr>
              {table.headers.map((h: string, idx: number) => (
                <th key={idx} className="px-4 py-3 font-normal tracking-[-0.02em]">
                  <span>{h}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {table.rows.map((row: (string | number)[], rIdx: number) => (
              <tr key={rIdx} className="hover:bg-gray-50/80 transition-colors duration-150">
                {row.map((cell: string | number, cIdx: number) => (
                  <td
                    key={cIdx}
                    className="px-4 py-3 text-gray-800 font-normal leading-[1.4] tracking-[-0.02em]"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
