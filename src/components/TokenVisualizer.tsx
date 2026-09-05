import React, { useState, useRef, useMemo } from 'react';
import {
  Copy,
  Check,
  Trash2,
  Eye,
  Hash,
  Maximize2,
  Minimize2,
  Sparkles,
  Info,
  ListOrdered
} from 'lucide-react';
import { TokenItem, ModelDefinition, ColorTheme, TokenizationStats } from '../types';
import { getTokenColor } from '../utils/tokenColors';
import { PRESET_PROMPTS } from '../data/presets';
import { formatDisplayToken } from '../services/tokenizerEngine';

export interface LineTokenItem {
  token: TokenItem;
  text: string;
  endsInNewline: boolean;
  isNewlineOnly: boolean;
}

export function splitTokensIntoLines(tokens: TokenItem[]): LineTokenItem[][] {
  if (tokens.length === 0) return [];
  const lines: LineTokenItem[][] = [[]];

  for (const token of tokens) {
    const raw = token.text;
    const normalized = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    if (!normalized.includes('\n')) {
      lines[lines.length - 1].push({
        token,
        text: normalized,
        endsInNewline: false,
        isNewlineOnly: false,
      });
    } else {
      const parts = normalized.split('\n');
      for (let p = 0; p < parts.length; p++) {
        const part = parts[p];
        const hasNewlineAfter = p < parts.length - 1;

        if (hasNewlineAfter) {
          lines[lines.length - 1].push({
            token,
            text: part,
            endsInNewline: true,
            isNewlineOnly: part.length === 0,
          });
          lines.push([]);
        } else if (part.length > 0) {
          lines[lines.length - 1].push({
            token,
            text: part,
            endsInNewline: false,
            isNewlineOnly: false,
          });
        }
      }
    }
  }
  return lines;
}

interface TokenVisualizerProps {
  promptText: string;
  onChangePrompt: (newText: string) => void;
  tokens: TokenItem[];
  model: ModelDefinition;
  onSelectToken: (token: TokenItem) => void;
  selectedToken: TokenItem | null;
  theme: ColorTheme;
  onChangeTheme: (theme: ColorTheme) => void;
  showInvisibles: boolean;
  onToggleInvisibles: () => void;
  showInlineIds: boolean;
  onToggleInlineIds: () => void;
  stats: TokenizationStats;
}

export const TokenVisualizer: React.FC<TokenVisualizerProps> = ({
  promptText,
  onChangePrompt,
  tokens,
  model,
  onSelectToken,
  selectedToken,
  theme,
  onChangeTheme,
  showInvisibles,
  onToggleInvisibles,
  showInlineIds,
  onToggleInlineIds,
  stats,
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedTokens, setCopiedTokens] = useState(false);
  const [hoveredToken, setHoveredToken] = useState<TokenItem | null>(null);
  const [activePresetMenu, setActivePresetMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const tokenLines = useMemo(() => splitTokensIntoLines(tokens), [tokens]);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyTokens = () => {
    const ids = tokens.map(t => t.id);
    navigator.clipboard.writeText(JSON.stringify(ids));
    setCopiedTokens(true);
    setTimeout(() => setCopiedTokens(false), 2000);
  };

  const handleSelectPreset = (text: string) => {
    onChangePrompt(text);
    setActivePresetMenu(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className={`space-y-4 ${isExpanded ? 'fixed inset-4 z-50 bg-slate-100 p-6 rounded-2xl shadow-2xl overflow-y-auto' : ''}`}>
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-xs">
        {/* Preset selector */}
        <div className="flex items-center gap-2 relative">
          <button
            type="button"
            id="preset-prompt-button"
            onClick={() => setActivePresetMenu(!activePresetMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Sample Prompts</span>
          </button>

          {activePresetMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setActivePresetMenu(false)} />
              <div className="absolute left-0 top-full mt-2 w-72 rounded-xl bg-white border border-slate-200 shadow-xl z-40 p-2 text-slate-800 space-y-1 max-h-96 overflow-y-auto">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select a Benchmark Sample
                </div>
                {PRESET_PROMPTS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.text)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-xs transition-colors group"
                  >
                    <div className="font-bold text-slate-800 group-hover:text-blue-600">
                      {preset.name}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">
                      {preset.description}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Quick presets pills */}
          <div className="hidden md:flex items-center gap-1">
            {PRESET_PROMPTS.slice(0, 3).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p.text)}
                className="px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* View and display toggles */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Theme switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => onChangeTheme('openai')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                theme === 'openai' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Professional Polish Palette"
            >
              Default
            </button>
            <button
              type="button"
              onClick={() => onChangeTheme('vivid')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                theme === 'vivid' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="High Contrast Vivid Theme"
            >
              Vivid
            </button>
            <button
              type="button"
              onClick={() => onChangeTheme('terminal')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                theme === 'terminal' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Terminal Dark Accent Theme"
            >
              Terminal
            </button>
          </div>

          {/* Show Invisibles Toggle */}
          <button
            type="button"
            onClick={onToggleInvisibles}
            className={`px-2.5 py-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1.5 ${
              showInvisibles
                ? 'bg-blue-50 text-blue-800 border-blue-300 font-bold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 font-medium'
            }`}
            title="Toggle visible whitespace characters (␣ and ↵)"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Spaces</span>
          </button>

          {/* Show Inline Token IDs */}
          <button
            type="button"
            onClick={onToggleInlineIds}
            className={`px-2.5 py-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1.5 ${
              showInlineIds
                ? 'bg-blue-50 text-blue-800 border-blue-300 font-bold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 font-medium'
            }`}
            title="Display Token ID integers inline with tokens"
          >
            <Hash className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Token IDs</span>
          </button>

          {/* Expand Fullscreen */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs"
            title={isExpanded ? 'Collapse' : 'Expand View'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Layout: Input Text | Token Visualization | Stats (Side-by-side) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_175px] xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px] rounded-xl border border-slate-200 shadow-xs overflow-hidden bg-white">
        {/* Left Pane: Prompt Input */}
        <section className="min-w-0 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 bg-white">
          {/* Input Header */}
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Input Text
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-400 font-mono">
                UTF-8 Encoding
              </span>
              <div className="h-3 w-px bg-slate-200"></div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
                  title="Copy prompt text"
                >
                  {copiedPrompt ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPrompt ? 'Copied' : 'Copy'}</span>
                </button>
                {promptText && (
                  <button
                    type="button"
                    onClick={() => onChangePrompt('')}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-rose-600 hover:text-rose-800 rounded hover:bg-rose-50 transition-colors"
                    title="Clear prompt"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Textarea */}
          <div className="relative flex-1 p-6 min-h-[320px] lg:min-h-[440px]">
            <textarea
              ref={textareaRef}
              id="prompt-input-textarea"
              value={promptText}
              onChange={(e) => onChangePrompt(e.target.value)}
              placeholder="Paste your prompt or text here to analyze token distribution..."
              className="w-full h-full min-h-[300px] lg:min-h-[420px] text-base font-mono leading-relaxed text-slate-900 bg-transparent resize-none border-none focus:outline-hidden placeholder-slate-300"
              spellCheck={false}
            />
          </div>
        </section>

        {/* Center Pane: Visual Tokenized Output */}
        <section className="min-w-0 flex flex-col bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200">
          {/* Visualizer Header */}
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Token Visualization
            </span>
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Line Numbers Toggle */}
              <button
                type="button"
                onClick={() => setShowLineNumbers(!showLineNumbers)}
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                  showLineNumbers
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Toggle line numbers gutter"
              >
                <ListOrdered className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] hidden sm:inline">Line #</span>
              </button>

              <div className="h-3 w-px bg-slate-200"></div>

              {/* ID Indexing Toggle */}
              <button
                type="button"
                onClick={onToggleInlineIds}
                className="inline-flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                title="Toggle inline token IDs"
              >
                <div
                  className={`w-3.5 h-3.5 rounded-xs border transition-colors flex items-center justify-center ${
                    showInlineIds ? 'bg-blue-500 border-blue-600 text-white' : 'bg-white border-slate-300'
                  }`}
                >
                  {showInlineIds && <Check className="w-2.5 h-2.5" />}
                </div>
                <span className="text-[10px] font-medium">ID Indexing</span>
              </button>

              <div className="h-3 w-px bg-slate-200"></div>

              <button
                type="button"
                onClick={handleCopyTokens}
                disabled={tokens.length === 0}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100 disabled:opacity-40 transition-colors"
                title="Copy token IDs array [15339, ...]"
              >
                {copiedTokens ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTokens ? 'Copied' : 'Copy IDs'}</span>
              </button>
            </div>
          </div>

          {/* Tokens Flow Area with Proper Newline & Indentation Handling */}
          <div className="flex-1 p-6 overflow-y-auto font-mono text-sm min-h-[320px] lg:min-h-[440px] max-h-[580px] bg-slate-50/50">
            {tokens.length === 0 ? (
              <div className="h-full w-full min-h-[260px] flex flex-col items-center justify-center text-center p-6">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">
                  Ready to Tokenize
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mb-4">
                  Paste your prompt or text on the left, or select a benchmark sample above to analyze token breakdown.
                </p>
                <button
                  type="button"
                  onClick={() => handleSelectPreset(PRESET_PROMPTS[0].text)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition-colors shadow-xs"
                >
                  Load Benchmark Sample
                </button>
              </div>
            ) : (
              <div className="space-y-0.5">
                {tokenLines.map((lineTokens, lineIdx) => (
                  <div
                    key={lineIdx}
                    className="flex items-start group hover:bg-blue-50/20 rounded transition-colors"
                  >
                    {/* Optional Line Number Gutter */}
                    {showLineNumbers && (
                      <div className="w-8 shrink-0 select-none text-[11px] font-mono text-slate-300 group-hover:text-slate-500 text-right pr-3 pt-0.5">
                        {lineIdx + 1}
                      </div>
                    )}

                    {/* Tokens on this specific line */}
                    <div className="flex-1 min-w-0 flex flex-wrap items-center min-h-[1.75rem] py-0.5">
                      {lineTokens.length === 0 ? (
                        <span className="inline-block w-2 text-transparent select-none">&nbsp;</span>
                      ) : (
                        lineTokens.map((item, itemIdx) => {
                          const color = getTokenColor(item.token.colorIndex, theme);
                          const isSelected = selectedToken?.index === item.token.index;
                          const isHovered = hoveredToken?.index === item.token.index;

                          return (
                            <span
                              key={`${item.token.index}-${lineIdx}-${itemIdx}`}
                              id={`token-${item.token.index}`}
                              onClick={() => onSelectToken(item.token)}
                              onMouseEnter={() => setHoveredToken(item.token)}
                              onMouseLeave={() => setHoveredToken(null)}
                              title={`Token #${item.token.index + 1} | ID: ${item.token.id} | Bytes: [${item.token.rawBytes.join(', ')}]`}
                              className={`inline-flex items-center px-1 my-0.5 rounded cursor-pointer transition-all duration-100 ${color.bg} ${color.hover} ${
                                isSelected
                                  ? 'ring-2 ring-blue-600 ring-offset-1 z-10 font-bold scale-105 shadow-xs'
                                  : ''
                              } ${isHovered && !isSelected ? 'scale-102 ring-1 ring-slate-400 z-10' : ''}`}
                            >
                              {item.isNewlineOnly ? (
                                <span
                                  className="opacity-70 font-mono text-xs select-none px-0.5 inline-flex items-center"
                                  title="Newline (\n)"
                                >
                                  ↵
                                </span>
                              ) : (
                                <>
                                  <span className="whitespace-pre">
                                    {showInvisibles ? formatDisplayToken(item.text) : item.text}
                                  </span>
                                  {item.endsInNewline && (
                                    <span
                                      className="opacity-60 text-[11px] font-mono select-none ml-0.5 inline-block"
                                      title="Line break (\n)"
                                    >
                                      ↵
                                    </span>
                                  )}
                                </>
                              )}

                              {showInlineIds && (
                                <span className="ml-1 text-[9px] font-sans opacity-70 px-1 py-0.2 bg-black/10 rounded font-mono">
                                  {item.token.id}
                                </span>
                              )}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom quick inspector info ribbon */}
          <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 min-w-0">
            <div className="min-w-0 flex-1 flex items-center gap-2 mr-2">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {hoveredToken ? (
                <span className="truncate">
                  Hovered: <strong className="text-slate-800 font-mono">#{hoveredToken.index + 1}</strong> (ID: <strong className="text-slate-800 font-mono">{hoveredToken.id}</strong>) • "{hoveredToken.displayValue}" • [{hoveredToken.rawBytes.join(', ')}]
                </span>
              ) : selectedToken ? (
                <span className="truncate">
                  Selected: <strong className="text-slate-800 font-mono">#{selectedToken.index + 1}</strong> (ID: <strong className="text-slate-800 font-mono">{selectedToken.id}</strong>) • Click for inspector breakdown
                </span>
              ) : (
                <span className="truncate">
                  Click or hover on any token to inspect its integer ID, UTF-8 bytes, and hex encoding.
                </span>
              )}
            </div>
            <div className="text-[10px] font-mono font-bold uppercase text-slate-400 shrink-0">
              {model.family === 'openai' ? 'OpenAI BPE' : 'HF Subword'}
            </div>
          </div>
        </section>

        {/* Right Pane: Live Stats Column (Snug fit without empty right space) */}
        <section className="min-w-0 flex flex-col bg-white">
          {/* Stats Header */}
          <div className="px-3.5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Stats
            </span>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Live
            </div>
          </div>

          {/* 3 Stats Blocks: Total Tokens, Characters, Efficiency Ratio */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 divide-y sm:divide-y-0 sm:divide-x lg:divide-x-0 lg:divide-y divide-slate-100 bg-white">
            {/* Stat 1: Total Tokens */}
            <div className="flex-1 flex flex-col justify-center px-3.5 py-3.5 sm:px-4 sm:py-4 bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Total Tokens
              </span>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                  {stats.tokenCount.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-blue-600 font-mono">
                  {stats.bytesCount} B
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                UTF-8 raw byte stream
              </span>
            </div>

            {/* Stat 2: Characters */}
            <div className="flex-1 flex flex-col justify-center px-3.5 py-3.5 sm:px-4 sm:py-4 bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Characters
              </span>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                  {stats.characterCount.toLocaleString()}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 truncate">
                <strong className="text-slate-700 font-mono">{stats.wordCount.toLocaleString()}</strong> words in text
              </span>
            </div>

            {/* Stat 3: Efficiency Ratio */}
            <div className="flex-1 flex flex-col justify-center px-3.5 py-3.5 sm:px-4 sm:py-4 bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Efficiency Ratio
              </span>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                  {stats.charactersPerToken > 0 ? stats.charactersPerToken : '0.00'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">chars/tok</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 truncate">
                {stats.tokensPerWord > 0 ? `~${stats.tokensPerWord} tok/word` : 'No text parsed'}
              </span>
            </div>
          </div>

          {/* Stats Footer Ribbon */}
          <div className="px-3.5 py-2.5 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span className="text-[10px] font-mono text-slate-400 uppercase truncate max-w-[95px]" title={model.name}>
              {model.name}
            </span>
            <span className="text-[10px] font-mono text-blue-600 font-semibold shrink-0">
              {stats.contextPercentage}% cap
            </span>
          </div>
        </section>
      </div>
    </div>
  );
};
