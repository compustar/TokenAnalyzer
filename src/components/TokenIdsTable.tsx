import React, { useState } from 'react';
import { Search, Copy, Check, Download, Table as TableIcon } from 'lucide-react';
import { TokenItem, ModelDefinition } from '../types';
import { getTokenColor } from '../utils/tokenColors';

interface TokenIdsTableProps {
  tokens: TokenItem[];
  model: ModelDefinition;
  onSelectToken: (token: TokenItem) => void;
}

export const TokenIdsTable: React.FC<TokenIdsTableProps> = ({
  tokens,
  model,
  onSelectToken,
}) => {
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const filteredTokens = tokens.filter(
    (t) =>
      t.id.toString().includes(search) ||
      t.text.toLowerCase().includes(search.toLowerCase()) ||
      t.hex.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCsv = () => {
    const headers = ['Index', 'Token_ID', 'Decoded_Text', 'Bytes', 'Hex', 'Char_Start', 'Char_End'];
    const rows = tokens.map((t) => [
      t.index + 1,
      t.id,
      `"${t.text.replace(/"/g, '""')}"`,
      `"[${t.rawBytes.join(' ')}]"`,
      `"${t.hex}"`,
      t.charStart,
      t.charEnd,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `token_usage_${model.id}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyJson = () => {
    const exportData = tokens.map((t) => ({
      index: t.index + 1,
      id: t.id,
      text: t.text,
      bytes: t.rawBytes,
      hex: t.hex,
    }));
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <TableIcon className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Token Dictionary & Byte Breakdown
          </h3>
          <span className="text-xs font-mono text-slate-400">
            ({tokens.length} total)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ID or text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-36 sm:w-48"
            />
          </div>

          <button
            type="button"
            onClick={handleCopyJson}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>JSON</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Table Data */}
      <div className="max-h-96 overflow-y-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2.5 w-16">#</th>
              <th className="px-4 py-2.5 w-28">Token ID</th>
              <th className="px-4 py-2.5">Decoded Substring</th>
              <th className="px-4 py-2.5 hidden sm:table-cell">UTF-8 Bytes</th>
              <th className="px-4 py-2.5 hidden md:table-cell">Hex Code</th>
              <th className="px-4 py-2.5 w-24 text-right">Char Span</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {filteredTokens.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-sans">
                  {tokens.length === 0 ? 'No tokens available to display' : 'No matching tokens found'}
                </td>
              </tr>
            ) : (
              filteredTokens.map((token) => {
                const color = getTokenColor(token.colorIndex);
                return (
                  <tr
                    key={`${token.index}-${token.id}`}
                    onClick={() => onSelectToken(token)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-2 text-slate-400 font-normal">
                      #{token.index + 1}
                    </td>
                    <td className="px-4 py-2 font-bold text-slate-900">
                      {token.id}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-xs ${color.bg}`}>
                        {token.displayValue}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-600 text-[11px] hidden sm:table-cell truncate max-w-xs">
                      [{token.rawBytes.join(', ')}]
                    </td>
                    <td className="px-4 py-2 text-slate-500 text-[11px] hidden md:table-cell">
                      {token.hex}
                    </td>
                    <td className="px-4 py-2 text-right text-slate-400 text-[11px]">
                      {token.charStart}–{token.charEnd}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
