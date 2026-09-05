import React, { useState, useEffect } from 'react';
import { ChevronDown, Check, Download, Search, Sparkles, Flame, RefreshCw } from 'lucide-react';
import { ModelDefinition } from '../types';
import { SUPPORTED_MODELS, HUGGINGFACE_MODELS } from '../data/models';
import { isHfModelCached } from '../services/tokenizerEngine';
import { isDisallowedPipelineTag, isDisallowedHfModel, isDisallowedModelId } from '../data/hfTrendingModels';

interface ModelSelectorProps {
  selectedModel: ModelDefinition;
  onSelectModel: (model: ModelDefinition) => void;
  isLoading?: boolean;
  downloadProgress?: { progress: number; file: string } | null;
  onOpenRegistry?: () => void;
  onOpenHfTrending?: () => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onSelectModel,
  isLoading,
  downloadProgress,
  onOpenRegistry,
  onOpenHfTrending,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customModelId, setCustomModelId] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const openaiModels = SUPPORTED_MODELS.filter(m => m.family === 'openai');
  const [hfModels, setHfModels] = useState<ModelDefinition[]>(HUGGINGFACE_MODELS);
  const [isSyncingHf, setIsSyncingHf] = useState(false);

  // Fetch live trending models directly from Hugging Face Hub API
  const fetchLiveHfTrending = async () => {
    try {
      setIsSyncingHf(true);
      const res = await fetch('https://huggingface.co/api/models?sort=trendingScore&direction=-1&limit=50');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const liveModels: ModelDefinition[] = data
          .filter((m: any) => !isDisallowedHfModel(m))
          .map((m: any, index: number) => {
            const author = m.id.includes('/') ? m.id.split('/')[0] : 'community';
          const name = m.id.includes('/') ? m.id.split('/')[1] : m.id;
          const score = typeof m.trendingScore === 'number' ? m.trendingScore : 0;
          return {
            id: `hf-${m.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
            name,
            family: 'huggingface' as const,
            hfModelId: m.id,
            vocabSize: m.pipeline_tag || 'Transformers',
            contextWindow: 8192,
            costPer1MInput: 0.20,
            costPer1MOutput: 0.20,
            description: `#${index + 1} Trending on HF Hub • Score: ${score.toLocaleString()} • ${(m.likes || 0).toLocaleString()} likes by ${author}`,
            badge: `🔥 ${score}`,
            isPopular: index < 5,
            trendingScore: score,
            likes: m.likes || 0,
            downloads: m.downloads || 0,
            author,
            rank: index + 1,
          };
        });
        setHfModels(liveModels);
      }
    } catch (e) {
      console.warn('Failed to refresh HF trending models from API, keeping current list:', e);
    } finally {
      setIsSyncingHf(false);
    }
  };

  useEffect(() => {
    fetchLiveHfTrending();
  }, []);

  const filteredOpenAI = openaiModels.filter(m => {
    const matchesCategory = selectedCategory === 'all' || selectedCategory === 'openai' || m.encoding === selectedCategory;
    const matchesSearch =
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.encoding && m.encoding.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const filteredHf = hfModels.filter(m => {
    if (m.hfModelId && isDisallowedModelId(m.hfModelId)) return false;
    const matchesCategory = selectedCategory === 'all' || selectedCategory === 'hf';
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      m.name.toLowerCase().includes(q) ||
      (m.hfModelId && m.hfModelId.toLowerCase().includes(q)) ||
      (m.author && m.author.toLowerCase().includes(q)) ||
      (typeof m.vocabSize === 'string' && m.vocabSize.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const handleApplyCustomHf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customModelId.trim()) return;

    const trimmed = customModelId.trim();
    const customModel: ModelDefinition = {
      id: `custom-${trimmed.replace(/[^a-zA-Z0-9_-]/g, '-')}`,
      name: trimmed,
      family: 'huggingface',
      hfModelId: trimmed,
      vocabSize: 'Dynamic',
      contextWindow: 8192,
      costPer1MInput: 0.20,
      costPer1MOutput: 0.20,
      description: `Custom Hugging Face hub tokenizer (${trimmed}) loaded dynamically via tokenizers.js.`,
      badge: 'Custom HF',
    };

    onSelectModel(customModel);
    setShowCustomInput(false);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
          Model Library
        </span>
        {/* Current Model Trigger Button */}
        <button
          type="button"
          id="model-selector-button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-800 text-sm font-medium shadow-xs transition-all w-full sm:w-auto min-w-[270px] focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
        >
          <div className="flex items-center gap-2.5 text-left">
            <span className={`w-2 h-2 rounded-full ${selectedModel.family === 'openai' ? 'bg-blue-600' : 'bg-amber-500'}`} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900">{selectedModel.name}</span>
                {selectedModel.badge && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {selectedModel.badge}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-blue-600 font-semibold font-mono">
                {selectedModel.family === 'openai'
                  ? `OpenAI (${selectedModel.encoding})`
                  : `HuggingFace (${selectedModel.hfModelId})`}
              </p>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Loading bar for downloading Hugging Face models */}
      {isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 shadow-md z-40">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="flex items-center gap-1.5 font-semibold">
              <Download className="w-3.5 h-3.5 animate-bounce text-amber-700" />
              Downloading HF Tokenizer...
            </span>
            {downloadProgress && <span className="font-mono">{downloadProgress.progress}%</span>}
          </div>
          <div className="w-full bg-amber-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress ? downloadProgress.progress : 50}%` }}
            />
          </div>
          {downloadProgress?.file && (
            <p className="text-[10px] text-amber-700 mt-1 truncate font-mono">
              {downloadProgress.file}
            </p>
          )}
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => {
              setIsOpen(false);
              setShowCustomInput(false);
            }}
          />
          <div className="absolute left-0 mt-1.5 w-full sm:w-[460px] max-h-[520px] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-xl z-40 p-2 text-slate-900 divide-y divide-slate-100">
            {/* Search and quick filter */}
            <div className="p-2 pb-2.5 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search 130+ models by name, encoding, or HF repo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              {/* Encoding filter chips */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-2 py-0.5 rounded-md font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({openaiModels.length + hfModels.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('o200k_base')}
                  className={`px-2 py-0.5 rounded-md font-mono whitespace-nowrap transition-colors ${
                    selectedCategory === 'o200k_base'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  o200k
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('cl100k_base')}
                  className={`px-2 py-0.5 rounded-md font-mono whitespace-nowrap transition-colors ${
                    selectedCategory === 'cl100k_base'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  cl100k
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('p50k_base')}
                  className={`px-2 py-0.5 rounded-md font-mono whitespace-nowrap transition-colors ${
                    selectedCategory === 'p50k_base'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  p50k
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('r50k_base')}
                  className={`px-2 py-0.5 rounded-md font-mono whitespace-nowrap transition-colors ${
                    selectedCategory === 'r50k_base'
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  r50k
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('hf')}
                  className={`px-2 py-0.5 rounded-md whitespace-nowrap flex items-center gap-1 transition-colors ${
                    selectedCategory === 'hf'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  <Flame className="w-3 h-3 text-rose-500 fill-rose-500" />
                  <span>HF Trending ({hfModels.length})</span>
                </button>
              </div>

              {onOpenRegistry && (
                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                  <span>From <code className="font-mono text-[10px]">tiktoken/model_to_encoding.json</code></span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenRegistry();
                    }}
                    className="text-blue-600 hover:text-blue-800 font-semibold underline decoration-blue-200"
                  >
                    View All {openaiModels.length} in Registry →
                  </button>
                </div>
              )}
            </div>

            {/* Custom Hugging Face Model Input at Top */}
            <div className="p-2 pt-2.5">
              {!showCustomInput ? (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="w-full text-center py-2 px-3 rounded-lg border border-dashed border-slate-300 text-xs font-medium text-slate-600 hover:text-slate-900 hover:border-slate-400 bg-slate-50/50 hover:bg-blue-50/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Load Custom Hugging Face Tokenizer (Repo ID)...
                </button>
              ) : (
                <form onSubmit={handleApplyCustomHf} className="space-y-2 p-1 bg-slate-50/80 rounded-xl border border-slate-200">
                  <div className="text-[11px] font-medium text-slate-700">Enter Hugging Face Model Repo ID:</div>
                  <input
                    type="text"
                    placeholder="e.g. Xenova/all-MiniLM-L6-v2 or Xenova/claude-tokenizer"
                    value={customModelId}
                    onChange={(e) => setCustomModelId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(false)}
                      className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!customModelId.trim()}
                      className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                    >
                      Load Model
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* OpenAI Group */}
            <div className="py-2">
              <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>OpenAI Models (tiktoken)</span>
                <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Instant</span>
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredOpenAI.map((m) => {
                  const isSelected = selectedModel.id === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        onSelectModel(m);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        isSelected ? 'bg-blue-50 text-blue-950 font-medium' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{m.name}</span>
                          {m.badge && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                              {m.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{m.description}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                          <span>Vocab: {m.vocabSize}</span>
                          <span>•</span>
                          <span>Context: {(m.contextWindow / 1000).toFixed(0)}k</span>
                          <span>•</span>
                          <span>${m.costPer1MInput}/1M tokens</span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hugging Face Hub Models Group (Sorted by trending_score) */}
            <div className="py-2">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span className="text-slate-800 font-bold">Hugging Face Hub (Sorted by Trending Score)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchLiveHfTrending();
                    }}
                    disabled={isSyncingHf}
                    title="Refresh live trending scores from Hugging Face Hub API"
                    className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-rose-600 font-semibold transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-2.5 h-2.5 ${isSyncingHf ? 'animate-spin text-rose-500' : ''}`} />
                    <span>{isSyncingHf ? 'Syncing...' : 'Live Sync'}</span>
                  </button>
                </div>
              </div>

              {onOpenHfTrending && (
                <div className="px-3 pt-1 pb-1.5 flex items-center justify-between text-[11px] bg-rose-50/50 rounded-lg mx-2 my-1 border border-rose-100/60">
                  <span className="text-slate-600 text-[10px]">
                    {hfModels.length} models sorted by <code className="font-mono text-rose-700 font-semibold">trending_score</code>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenHfTrending();
                    }}
                    className="text-rose-600 hover:text-rose-800 font-bold underline decoration-rose-300 text-[10px]"
                  >
                    Leaderboard View →
                  </button>
                </div>
              )}

              <div className="space-y-0.5 mt-1">
                {filteredHf.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-slate-400">
                    No matching Hugging Face models found.
                  </div>
                ) : (
                  filteredHf.map((m, idx) => {
                    const isSelected = selectedModel.id === m.id || selectedModel.hfModelId === m.hfModelId;
                    const isCached = m.hfModelId ? isHfModelCached(m.hfModelId) : false;
                    const rank = m.rank || (idx + 1);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          onSelectModel(m);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          isSelected ? 'bg-rose-50/80 text-rose-950 font-medium border border-rose-200' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                              rank === 1 ? 'bg-amber-100 text-amber-800' :
                              rank === 2 ? 'bg-slate-200 text-slate-700' :
                              rank === 3 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              #{rank}
                            </span>
                            <span className="font-bold text-slate-900 truncate max-w-[220px]">{m.name}</span>
                            {m.trendingScore !== undefined && (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                <Flame className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
                                {m.trendingScore.toLocaleString()}
                              </span>
                            )}
                            {isCached && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-blue-50 text-blue-700 font-medium">
                                cached
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{m.description}</p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono flex-wrap">
                            <span className="text-slate-600 truncate">{m.hfModelId}</span>
                            {m.likes !== undefined && (
                              <>
                                <span>•</span>
                                <span>{m.likes.toLocaleString()} likes</span>
                              </>
                            )}
                            {m.downloads !== undefined && m.downloads > 0 && (
                              <>
                                <span>•</span>
                                <span>{m.downloads.toLocaleString()} dl</span>
                              </>
                            )}
                            {m.vocabSize && (
                              <>
                                <span>•</span>
                                <span className="text-slate-400">{m.vocabSize}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-rose-600 shrink-0 ml-2" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
