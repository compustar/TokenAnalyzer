import React, { useState } from 'react';
import { X, Copy, Check, Hash, Code2, ArrowLeft, ArrowRight, Binary } from 'lucide-react';
import { TokenItem, ModelDefinition } from '../types';
import { getTokenColor } from '../utils/tokenColors';

interface TokenInspectorModalProps {
  token: TokenItem | null;
  totalTokens: number;
  model: ModelDefinition;
  onClose: () => void;
  onSelectTokenIndex: (index: number) => void;
}

export const TokenInspectorModal: React.FC<TokenInspectorModalProps> = ({
  token,
  totalTokens,
  model,
  onClose,
  onSelectTokenIndex,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!token) return null;

  const colorStyle = getTokenColor(token.colorIndex);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const hasPrev = token.index > 0;
  const hasNext = token.index < totalTokens - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <span className={`w-3 h-3 rounded-full ${colorStyle.bg.split(' ')[0]}`} />
            <h3 className="text-sm font-bold text-slate-900">
              Token #{token.index + 1} <span className="text-slate-400 font-normal">of {totalTokens}</span>
            </h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-200/70 text-slate-700">
              ID: {token.id}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={!hasPrev}
              onClick={() => hasPrev && onSelectTokenIndex(token.index - 1)}
              className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-30"
              title="Previous Token"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={!hasNext}
              onClick={() => hasNext && onSelectTokenIndex(token.index + 1)}
              className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-30"
              title="Next Token"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Token Preview Banner */}
        <div className="p-5 border-b border-slate-100 flex flex-col items-center justify-center bg-slate-50/30">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">
            Decoded Substring
          </div>
          <div className="px-5 py-3 rounded-xl border border-slate-200 bg-white shadow-xs max-w-full overflow-x-auto text-center">
            <span className="font-mono text-xl text-slate-900 whitespace-pre font-medium">
              {token.displayValue}
            </span>
          </div>
          {token.isWhitespace && (
            <span className="mt-2 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Whitespace character ({token.isNewline ? 'Newline' : 'Space / Tab'})
            </span>
          )}
        </div>

        {/* Detailed Inspection Grid */}
        <div className="p-5 space-y-3.5 text-xs">
          {/* Token ID */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 font-medium">Token ID (Integer)</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                {token.id}
              </code>
              <button
                type="button"
                onClick={() => copyToClipboard(token.id.toString(), 'id')}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-white rounded"
                title="Copy Token ID"
              >
                {copiedField === 'id' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Raw UTF-8 Bytes */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Binary className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600 font-medium">Raw UTF-8 Bytes</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(JSON.stringify(token.rawBytes), 'bytes')}
                className="p-1 text-slate-400 hover:text-slate-700 rounded flex items-center gap-1 text-[11px]"
              >
                {copiedField === 'bytes' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            </div>
            <div className="font-mono bg-white p-2 rounded-lg border border-slate-200 text-slate-800 break-all text-[11px]">
              [{token.rawBytes.join(', ')}]
            </div>
          </div>

          {/* Hex Representation */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 font-medium">Hex Representation</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="font-mono text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                {token.hex || '0x00'}
              </code>
              <button
                type="button"
                onClick={() => copyToClipboard(token.hex, 'hex')}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-white rounded"
              >
                {copiedField === 'hex' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Span offsets */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Character Range</span>
              <div className="font-mono font-medium text-slate-800 mt-0.5">
                [{token.charStart} → {token.charEnd}] ({token.text.length} chars)
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Active Model</span>
              <div className="font-medium text-slate-800 mt-0.5 truncate">
                {model.name}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Press Esc or click outside to close
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
