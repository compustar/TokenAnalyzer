import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Layers,
  Award,
  Cpu,
  RefreshCw,
  ChevronDown,
  Search,
  Check,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ModelDefinition, TokenDistribution } from '../types';
import { SUPPORTED_MODELS } from '../data/models';
import { tokenizeTiktoken, tokenizeHf, calculateTokenStats } from '../services/tokenizerEngine';

interface ModelComparatorProps {
  promptText: string;
  currentModel: ModelDefinition;
  onSelectModel: (model: ModelDefinition) => void;
}

interface ComparisonItem {
  slotIndex: number; // 0 = Chosen Model, 1 = Model 2, 2 = Model 3
  slotLabel: string;
  model: ModelDefinition;
  tokenCount: number;
  tokensPerWord: number;
  distribution: TokenDistribution[];
  efficiencyVsMax: number;
  deltaVsChosen: { diff: number; pct: number } | null;
  isLowestTokens: boolean;
  status: 'ready' | 'loading' | 'error';
  errorMessage?: string;
}

// Consistent high-contrast color palette for subword length buckets
const SUBWORD_BUCKET_CONFIG: Record<
  string,
  { barColor: string; dotColor: string; label: string }
> = {
  '1 char': {
    barColor: 'bg-blue-600',
    dotColor: 'bg-blue-600',
    label: '1 char',
  },
  '2 chars': {
    barColor: 'bg-amber-500',
    dotColor: 'bg-amber-500',
    label: '2 chars',
  },
  '3-4 chars': {
    barColor: 'bg-violet-600',
    dotColor: 'bg-violet-600',
    label: '3-4 chars',
  },
  '5-8 chars': {
    barColor: 'bg-emerald-500',
    dotColor: 'bg-emerald-500',
    label: '5-8 chars',
  },
  '9+ chars': {
    barColor: 'bg-rose-500',
    dotColor: 'bg-rose-500',
    label: '9+ chars',
  },
  'Whitespace': {
    barColor: 'bg-slate-400',
    dotColor: 'bg-slate-400',
    label: 'Whitespace',
  },
};

// Popular quick selection shortcuts
const QUICK_PRESETS = [
  { id: 'gpt-4o', label: 'GPT-4o' },
  { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
  { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { id: 'hf-deepseek-ai_DeepSeek-V4-Flash-Vision-Exp', label: 'DeepSeek-V4' },
  { id: 'hf-meta-llama_Meta-Llama-3-8B', label: 'Llama 3' },
  { id: 'hf-mistralai_Mistral-7B-v0-1', label: 'Mistral 7B' },
  { id: 'gpt2', label: 'GPT-2' },
];

/**
 * Interactive model selector dropdown for comparison slots
 */
const ModelPickerDropdown: React.FC<{
  selectedModel: ModelDefinition;
  onSelect: (model: ModelDefinition) => void;
  allModels: ModelDefinition[];
  disabledId?: string;
  slotNumber: 2 | 3;
}> = ({ selectedModel, onSelect, allModels, disabledId, slotNumber }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | 'openai' | 'huggingface'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredModels = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allModels.filter((m) => {
      if (category !== 'all' && m.family !== category) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        (m.hfModelId && m.hfModelId.toLowerCase().includes(q)) ||
        (m.encoding && m.encoding.toLowerCase().includes(q))
      );
    });
  }, [allModels, search, category]);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 shadow-2xs hover:border-slate-400 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
        title={`Change Model ${slotNumber}`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            selectedModel.family === 'openai' ? 'bg-blue-600' : 'bg-amber-500'
          }`}
        />
        <span className="font-bold text-slate-900 max-w-[160px] sm:max-w-[220px] truncate">
          {selectedModel.name}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 max-w-[90vw] bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Header / Search */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search models or tokenizers..."
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 mt-2 text-[10px] font-semibold">
              <button
                type="button"
                onClick={() => setCategory('all')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  category === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({allModels.length})
              </button>
              <button
                type="button"
                onClick={() => setCategory('openai')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  category === 'openai'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                OpenAI
              </button>
              <button
                type="button"
                onClick={() => setCategory('huggingface')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  category === 'huggingface'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Hugging Face
              </button>
            </div>
          </div>

          {/* List of models */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 p-1">
            {filteredModels.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching models found.
              </div>
            ) : (
              filteredModels.map((m) => {
                const isSelected = m.id === selectedModel.id;
                const isDisabled = m.id === disabledId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      onSelect(m);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900 font-semibold'
                        : isDisabled
                        ? 'opacity-40 cursor-not-allowed bg-slate-50'
                        : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            m.family === 'openai' ? 'bg-blue-600' : 'bg-amber-500'
                          }`}
                        />
                        <span className="truncate font-medium">{m.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono pl-3 truncate">
                        {m.family === 'openai'
                          ? `tiktoken (${m.encoding})`
                          : m.hfModelId || 'Hugging Face'}
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const ModelComparator: React.FC<ModelComparatorProps> = ({
  promptText,
  currentModel,
  onSelectModel,
}) => {
  // Build unified available models list including currentModel
  const allModels = useMemo(() => {
    const list = [...SUPPORTED_MODELS];
    if (!list.some((m) => m.id === currentModel.id)) {
      list.unshift(currentModel);
    }
    return list;
  }, [currentModel]);

  // Model 2 selection state
  const [model2, setModel2] = useState<ModelDefinition>(() => {
    if (currentModel.id === 'gpt-4o') {
      return allModels.find((m) => m.id === 'gpt-4o-mini') || allModels[1] || allModels[0];
    }
    return allModels.find((m) => m.id === 'gpt-4o') || allModels[1] || allModels[0];
  });

  // Model 3 selection state
  const [model3, setModel3] = useState<ModelDefinition>(() => {
    const exclude = new Set([currentModel.id, 'gpt-4o']);
    const candidates = ['gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt2'];
    for (const cid of candidates) {
      const found = allModels.find((m) => m.id === cid && !exclude.has(m.id));
      if (found) return found;
    }
    return allModels.find((m) => !exclude.has(m.id)) || allModels[2] || allModels[0];
  });

  // If currentModel happens to be identical to model2 or model3, automatically advance to an alternative
  useEffect(() => {
    if (model2.id === currentModel.id) {
      const alternative = allModels.find(
        (m) => m.id !== currentModel.id && m.id !== model3.id
      );
      if (alternative) setModel2(alternative);
    } else if (model3.id === currentModel.id) {
      const alternative = allModels.find(
        (m) => m.id !== currentModel.id && m.id !== model2.id
      );
      if (alternative) setModel3(alternative);
    }
  }, [currentModel.id, allModels, model2.id, model3.id]);

  const [results, setResults] = useState<ComparisonItem[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  // Compute comparison across the 3 models:
  // Slot 0: Chosen Model (currentModel)
  // Slot 1: Model 2 (selectable)
  // Slot 2: Model 3 (selectable)
  useEffect(() => {
    let isCancelled = false;

    async function runComparison() {
      if (!promptText.trim()) {
        setResults([]);
        return;
      }

      setIsComparing(true);
      const wordCount = promptText.trim().split(/\s+/).filter(Boolean).length;
      const slotConfigs = [
        { slotIndex: 0, slotLabel: 'Chosen Model', model: currentModel },
        { slotIndex: 1, slotLabel: 'Model 2', model: model2 },
        { slotIndex: 2, slotLabel: 'Model 3', model: model3 },
      ];

      const items: ComparisonItem[] = [];

      for (const config of slotConfigs) {
        try {
          let count = 0;
          let dist: TokenDistribution[] = [];
          let tpw = 0;

          if (config.model.family === 'openai') {
            const tokens = tokenizeTiktoken(promptText, config.model);
            count = tokens.length;
            const stats = calculateTokenStats(promptText, tokens, config.model);
            dist = stats.distribution;
            tpw = stats.tokensPerWord;
          } else {
            const tokens = await tokenizeHf(promptText, config.model);
            count = tokens.length;
            const stats = calculateTokenStats(promptText, tokens, config.model);
            dist = stats.distribution;
            tpw = stats.tokensPerWord;
          }

          items.push({
            slotIndex: config.slotIndex,
            slotLabel: config.slotLabel,
            model: config.model,
            tokenCount: count,
            tokensPerWord: tpw,
            distribution: dist,
            efficiencyVsMax: 0,
            deltaVsChosen: null,
            isLowestTokens: false,
            status: 'ready',
          });
        } catch (err: any) {
          items.push({
            slotIndex: config.slotIndex,
            slotLabel: config.slotLabel,
            model: config.model,
            tokenCount: 0,
            tokensPerWord: 0,
            distribution: [],
            efficiencyVsMax: 0,
            deltaVsChosen: null,
            isLowestTokens: false,
            status: 'error',
            errorMessage: err?.message || 'Failed to tokenize with model',
          });
        }
      }

      if (isCancelled) return;

      const validItems = items.filter((i) => i.status === 'ready' && i.tokenCount > 0);
      if (validItems.length > 0) {
        const minTokens = Math.min(...validItems.map((i) => i.tokenCount));
        const maxTokens = Math.max(...validItems.map((i) => i.tokenCount));
        const chosenTokenCount = items[0]?.tokenCount || 0;

        for (const item of items) {
          if (item.status === 'ready') {
            item.isLowestTokens = item.tokenCount === minTokens;
            item.efficiencyVsMax =
              maxTokens > 0
                ? Number(((item.tokenCount / maxTokens) * 100).toFixed(0))
                : 100;

            if (item.slotIndex !== 0 && chosenTokenCount > 0) {
              const diff = item.tokenCount - chosenTokenCount;
              const pct = Number(((diff / chosenTokenCount) * 100).toFixed(1));
              item.deltaVsChosen = { diff, pct };
            }
          }
        }
      }

      setResults(items);
      setIsComparing(false);
    }

    runComparison();

    return () => {
      isCancelled = true;
    };
  }, [promptText, currentModel, model2, model3]);

  if (!promptText.trim()) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
        <Cpu className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-slate-800">No Prompt to Compare</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          Enter text in the prompt input box above to compare token usage of your chosen model against any selectable models in real time.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Cross-Model Tokenizer Comparison
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Comparing your chosen model against two selectable models for token compactness, subword length distribution, and efficiency.
          </p>
        </div>
        {isComparing && (
          <div className="inline-flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 self-start sm:self-auto">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Tokenizing models...</span>
          </div>
        )}
      </div>

      {/* Subword length distribution global legend */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
          Subwords:
        </span>
        {Object.entries(SUBWORD_BUCKET_CONFIG).map(([key, cfg]) => (
          <span
            key={key}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700 font-medium"
          >
            <span className={`w-2 h-2 rounded-full ${cfg.dotColor} shrink-0`} />
            <span>{cfg.label}</span>
          </span>
        ))}
      </div>

      {/* Comparison Cards: Slot 1 (Chosen Model), Slot 2 (Selectable), Slot 3 (Selectable) */}
      <div className="space-y-3">
        {results.map((item) => {
          const isChosen = item.slotIndex === 0;
          const isSlot2 = item.slotIndex === 1;
          const isSlot3 = item.slotIndex === 2;

          return (
            <div
              key={`slot-${item.slotIndex}-${item.model.id}`}
              className={`p-4 rounded-xl border transition-all ${
                isChosen
                  ? 'border-blue-500 bg-blue-50/20 ring-1 ring-blue-500 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
              }`}
            >
              {/* Card Top Row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Left side: Slot identifier + Model details */}
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${
                      item.model.family === 'openai' ? 'bg-blue-600' : 'bg-amber-500'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    {/* Slot Label & Picker */}
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {isChosen ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
                          <Sparkles className="w-2.5 h-2.5" />
                          Chosen Model (Active)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {item.slotLabel} (Selectable):
                        </span>
                      )}

                      {/* If Slot 1: Static chosen model name. If Slot 2 or 3: Interactive dropdown picker */}
                      {isChosen ? (
                        <span className="font-bold text-sm text-slate-900 truncate">
                          {item.model.name}
                        </span>
                      ) : isSlot2 ? (
                        <ModelPickerDropdown
                          selectedModel={model2}
                          onSelect={setModel2}
                          allModels={allModels}
                          disabledId={currentModel.id}
                          slotNumber={2}
                        />
                      ) : (
                        <ModelPickerDropdown
                          selectedModel={model3}
                          onSelect={setModel3}
                          allModels={allModels}
                          disabledId={currentModel.id}
                          slotNumber={3}
                        />
                      )}

                      {/* Performance badge (Most Compact only, Lowest Cost removed) */}
                      {item.isLowestTokens && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                          <Award className="w-3 h-3 text-blue-600" />
                          Most Compact
                        </span>
                      )}
                    </div>

                    {/* Subtitle info */}
                    <div className="text-[11px] text-slate-500 font-mono truncate">
                      {item.model.family === 'openai'
                        ? `tiktoken (${item.model.encoding}) • Vocab: ${item.model.vocabSize}`
                        : `Hugging Face (${item.model.hfModelId || item.model.id})`}
                    </div>

                    {/* Quick presets for selectable slots 2 & 3 */}
                    {!isChosen && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[10px] text-slate-400 font-medium">Quick Pick:</span>
                        {QUICK_PRESETS.map((preset) => {
                          const targetModel = allModels.find(
                            (m) =>
                              m.id === preset.id ||
                              m.name.toLowerCase().includes(preset.label.toLowerCase())
                          );
                          if (!targetModel) return null;
                          const isCurrentlySelected = targetModel.id === item.model.id;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => {
                                if (isSlot2) setModel2(targetModel);
                                if (isSlot3) setModel3(targetModel);
                              }}
                              className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors ${
                                isCurrentlySelected
                                  ? 'bg-slate-800 text-white font-semibold'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Numbers and Action button */}
                <div className="flex items-center justify-between md:justify-end gap-4 text-right pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div>
                    <div className="flex items-baseline md:justify-end gap-1.5">
                      <span className="text-lg sm:text-xl font-bold font-mono text-slate-900">
                        {item.status === 'ready' ? item.tokenCount.toLocaleString() : '—'}
                      </span>
                      <span className="text-xs font-normal text-slate-500">tokens</span>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono">
                      {item.tokensPerWord > 0 ? `${item.tokensPerWord} tok/word` : ''}
                    </div>

                    {/* Delta comparison vs chosen model */}
                    {!isChosen && item.deltaVsChosen && (
                      <div
                        className={`text-[10px] font-mono font-semibold mt-0.5 ${
                          item.deltaVsChosen.diff > 0
                            ? 'text-amber-600'
                            : item.deltaVsChosen.diff < 0
                            ? 'text-emerald-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {item.deltaVsChosen.diff > 0
                          ? `+${item.deltaVsChosen.diff} tokens (+${item.deltaVsChosen.pct}% vs chosen)`
                          : item.deltaVsChosen.diff < 0
                          ? `${item.deltaVsChosen.diff} tokens (${item.deltaVsChosen.pct}% vs chosen)`
                          : 'Identical tokens to chosen'}
                      </div>
                    )}
                  </div>

                  {/* Button */}
                  <div>
                    {isChosen ? (
                      <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-2xs">
                        Active
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelectModel(item.model)}
                        className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg shadow-2xs transition-colors hover:border-slate-400 focus:ring-2 focus:ring-blue-500/20"
                        title="Set this model as the active chosen model in Tokenizer"
                      >
                        Inspect
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Subword length distribution stacked bar */}
              <div className="mt-3.5 space-y-1.5">
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200 shadow-inner flex">
                  <div
                    className="h-full flex divide-x divide-white/60 transition-all duration-300 rounded-full overflow-hidden"
                    style={{ width: `${Math.max(8, item.efficiencyVsMax)}%` }}
                  >
                    {item.distribution && item.distribution.length > 0 ? (
                      item.distribution.map((bucket) => {
                        if (bucket.percentage === 0) return null;
                        const config = SUBWORD_BUCKET_CONFIG[bucket.range] || {
                          barColor: 'bg-slate-400',
                        };
                        return (
                          <div
                            key={bucket.range}
                            className={`${config.barColor} h-full transition-all hover:opacity-90 cursor-pointer`}
                            style={{ width: `${bucket.percentage}%` }}
                            title={`${item.model.name} • ${bucket.range}: ${bucket.count.toLocaleString()} tokens (${bucket.percentage}%)`}
                          />
                        );
                      })
                    ) : (
                      <div
                        className={`h-full ${item.isLowestTokens ? 'bg-blue-600' : 'bg-slate-400'}`}
                        style={{ width: '100%' }}
                      />
                    )}
                  </div>
                </div>

                {/* Subword breakdown percentages */}
                {item.distribution && item.distribution.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[10px] font-mono text-slate-500">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                      {item.distribution.map((b) => {
                        if (b.percentage === 0) return null;
                        const config = SUBWORD_BUCKET_CONFIG[b.range] || {
                          dotColor: 'bg-slate-400',
                        };
                        const shortLabel = b.range
                          .replace(' chars', 'ch')
                          .replace(' char', 'ch')
                          .replace('Whitespace', 'Space');
                        return (
                          <span
                            key={b.range}
                            className="inline-flex items-center gap-1 text-slate-600"
                            title={`${b.range}: ${b.count.toLocaleString()} tokens (${b.percentage}%)`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} shrink-0`} />
                            <span>
                              {shortLabel}: <strong className="text-slate-800 font-semibold">{b.percentage}%</strong>
                            </span>
                          </span>
                        );
                      })}
                    </div>
                    <span className="text-slate-400 text-[9px] shrink-0">
                      {item.efficiencyVsMax}% relative length
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

