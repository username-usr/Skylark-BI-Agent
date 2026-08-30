import React from 'react';
import { Table as TableIcon } from 'lucide-react';
import type { BreakdownTableData } from '../types';

interface BreakdownTableProps {
  table: BreakdownTableData;
}

export const BreakdownTable: React.FC<BreakdownTableProps> = ({ table }) => {
  if (!table || !table.rows || table.rows.length === 0) return null;

  return (
    <div className="my-5 rounded-2xl border border-gray-200/90 bg-white overflow-hidden shadow-2xs">
      <div className="bg-gray-50/80 px-5 py-3 border-b border-gray-200/80 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <TableIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm md:text-[15px] font-bold text-gray-800 tracking-tight">
            {table.title}
          </span>
        </div>
        <span className="text-xs md:text-[13px] font-mono text-gray-400 font-medium">
          {table.rows.length} records
        </span>
      </div>

      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full text-left text-sm md:text-[14.5px] border-collapse">
          <thead>
            <tr className="bg-gray-50/50 text-gray-500 border-b border-gray-100 text-xs md:text-[13px] uppercase font-semibold tracking-wider">
              {table.headers.map((h, i) => (
                <th key={i} className="px-5 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {table.rows.map((row, rIdx) => (
              <tr 
                key={rIdx} 
                className="hover:bg-gray-50/60 transition-colors"
              >
                {row.map((cell, cIdx) => (
                  <td 
                    key={cIdx} 
                    className={`px-5 py-3 font-medium ${
                      cIdx === 0 ? 'text-gray-900 font-semibold' : 'text-gray-600'
                    }`}
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
