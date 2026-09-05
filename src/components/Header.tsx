import React from 'react';
import { ExternalLink, Trash2 } from 'lucide-react';
import { ModelDefinition } from '../types';

interface HeaderProps {
  currentModel: ModelDefinition;
  onClearInput?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentModel, onClearInput }) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo and branding */}
        <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
          <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg text-white shadow-xs flex items-center justify-center shrink-0">
            <svg width="20" height="20" className="sm:w-[22px] sm:h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 truncate">
                TokenAnalyzer
              </h1>
              <span className="text-slate-400 font-normal text-[10px] sm:text-xs">v2.4</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 truncate hidden sm:block">
              Professional LLM Token Inspector • <span className="font-mono font-medium text-slate-700">tiktoken</span> & <span className="font-mono font-medium text-slate-700">tokenizers</span>
            </p>
          </div>
        </div>

        {/* Model quick stats & references */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          {/* Active Engine pill on larger screens */}
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Active Engine</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              <span className="max-w-[140px] truncate">{currentModel.name}</span>
              <span className="text-slate-400 font-normal text-[11px]">({currentModel.encoding || currentModel.hfModelId || 'BPE'})</span>
            </div>
          </div>

          <div className="h-6 sm:h-8 w-px bg-slate-200 hidden md:block"></div>

          <div className="hidden sm:flex items-center gap-1 text-xs">
            <a
              href="https://github.com/openai/tiktoken"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <span>tiktoken</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
            <a
              href="https://github.com/huggingface/tokenizers.js"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <span>tokenizers</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>

          {onClearInput && (
            <button
              type="button"
              id="clear-input-header-btn"
              onClick={onClearInput}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-slate-900 text-white text-[11px] sm:text-xs font-bold rounded-lg hover:bg-slate-800 active:scale-95 transition-all shadow-xs tracking-wider cursor-pointer"
              title="Clear input text"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CLEAR</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

