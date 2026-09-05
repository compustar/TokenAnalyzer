import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  Heart,
  Download,
  ExternalLink,
  Search,
  RefreshCw,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Layers,
  Code2
} from 'lucide-react';
import { HFTrendingModel, ModelDefinition } from '../types';
import { SEED_HF_TRENDING_MODELS } from '../data/hfTrendingModels';

interface HFTrendingViewerProps {
  onSelectHfModel: (model: ModelDefinition) => void;
  onNavigateToTokenizer: () => void;
}

export const HFTrendingViewer: React.FC<HFTrendingViewerProps> = ({
  onSelectHfModel,
  onNavigateToTokenizer,
}) => {
  const [models, setModels] = useState<HFTrendingModel[]>(SEED_HF_TRENDING_MODELS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Live HF API');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPipeline, setSelectedPipeline] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // Fetch live from Hugging Face Hub API
  const fetchTrendingModels = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        'https://huggingface.co/api/models?sort=trendingScore&direction=-1&limit=50'
      );
      if (!response.ok) {
        throw new Error(`HF API HTTP ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const parsed: HFTrendingModel[] = data.map((m: any) => ({
          id: m.id,
          name: m.id.includes('/') ? m.id.split('/')[1] : m.id,
          author: m.id.includes('/') ? m.id.split('/')[0] : 'community',
          trendingScore: m.trendingScore || 0,
          likes: m.likes || 0,
          downloads: m.downloads || 0,
          pipelineTag: m.pipeline_tag || 'text-generation',
          createdAt: m.createdAt,
          tags: (m.tags || []).slice(0, 6),
        }));
        setModels(parsed);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn('Could not fetch live trending models from HF Hub, using seed snapshot:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingModels();
  }, []);

  // Compute maximum trending score for proportional bar
  const maxTrendingScore = useMemo(() => {
    return Math.max(...models.map((m) => m.trendingScore), 1);
  }, [models]);

  // Unique pipeline tags
  const pipelineTags = useMemo(() => {
    const set = new Set<string>();
    models.forEach((m) => {
      if (m.pipelineTag) set.add(m.pipelineTag);
    });
    return Array.from(set).sort();
  }, [models]);

  // Filtered models
  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      const matchesPipeline = selectedPipeline === 'all' || m.pipelineTag === selectedPipeline;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        m.id.toLowerCase().includes(q) ||
        m.author.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        (m.tags && m.tags.some((t) => t.toLowerCase().includes(q)));
      return matchesPipeline && matchesSearch;
    });
  }, [models, selectedPipeline, searchQuery]);

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(filteredModels, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleLoadIntoVisualizer = (m: HFTrendingModel) => {
    const customModel: ModelDefinition = {
      id: m.id,
      name: m.name,
      family: 'huggingface',
      hfModelId: m.id,
      vocabSize: 'Transformers BPE',
      contextWindow: 8192,
      costPer1MInput: 0,
      costPer1MOutput: 0,
      description: `Trending #${models.findIndex((x) => x.id === m.id) + 1} model on Hugging Face Hub (Trending Score: ${m.trendingScore}, ${m.likes.toLocaleString()} likes).`,
      badge: `Trending: ${m.trendingScore}`,
    };
    onSelectHfModel(customModel);
    onNavigateToTokenizer();
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                <Flame className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Hugging Face Hub · Trending Models
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                sort=trendingScore
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-3xl">
              Real-time models from Hugging Face Hub ordered strictly by <strong>trending_score</strong>.
              This metric factors recent community adoption, rapid bookmarking, and 7-day like velocity.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchTrendingModels}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors border border-slate-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Fetching Hub...' : 'Refresh Feed'}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors border border-slate-200"
            >
              {copiedJson ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
              <span>{copiedJson ? 'Copied' : 'Export JSON'}</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Top Trending #1</span>
            <span className="text-base font-extrabold text-rose-600 font-mono mt-0.5 block truncate">
              {models[0]?.name || 'GLM-5.3'}
            </span>
            <span className="text-[10px] text-slate-400">Score: {models[0]?.trendingScore || 1228}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Models Listed</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">
              {models.length}
            </span>
            <span className="text-[10px] text-slate-400">Sorted descending by score</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Top Pipeline</span>
            <span className="text-base font-extrabold text-blue-700 font-mono mt-0.5 block truncate">
              {models[0]?.pipelineTag || 'text-generation'}
            </span>
            <span className="text-[10px] text-slate-400">Conversational / multimodal</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Feed Status</span>
            <span className="text-base font-bold text-emerald-700 mt-0.5 block truncate flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live HF Hub API</span>
            </span>
            <span className="text-[10px] text-slate-400">Updated: {lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by model name, author (e.g. zai-org, Qwen, deepseek, unsloth)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:bg-white"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Showing <strong className="text-slate-900 font-mono">{filteredModels.length}</strong> of{' '}
            <span className="font-mono">{models.length}</span> trending models
          </div>
        </div>

        {/* Pipeline Task Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Pipeline:
          </span>

          <button
            type="button"
            onClick={() => setSelectedPipeline('all')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
              selectedPipeline === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All Tasks ({models.length})
          </button>

          {pipelineTags.map((tag) => {
            const count = models.filter((m) => m.pipelineTag === tag).length;
            const isSelected = selectedPipeline === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedPipeline(tag)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all whitespace-nowrap border ${
                  isSelected
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {tag} <span className="opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Trending Models Ranked Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-14 text-center">Rank</th>
                <th className="py-3 px-4">Model & Creator</th>
                <th className="py-3 px-4">Trending Score</th>
                <th className="py-3 px-4">Community Activity</th>
                <th className="py-3 px-4">Pipeline Tag</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredModels.map((model, idx) => {
                const rank = idx + 1;
                const scoreRatio = Math.min(100, Math.round((model.trendingScore / maxTrendingScore) * 100));

                let rankBadge = (
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-mono text-[11px] font-bold inline-flex items-center justify-center">
                    {rank}
                  </span>
                );
                if (rank === 1) {
                  rankBadge = (
                    <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-mono text-[11px] font-extrabold inline-flex items-center justify-center shadow-xs">
                      1
                    </span>
                  );
                } else if (rank === 2) {
                  rankBadge = (
                    <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-mono text-[11px] font-extrabold inline-flex items-center justify-center shadow-xs">
                      2
                    </span>
                  );
                } else if (rank === 3) {
                  rankBadge = (
                    <span className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-800 font-mono text-[11px] font-extrabold inline-flex items-center justify-center">
                      3
                    </span>
                  );
                }

                return (
                  <tr
                    key={model.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Rank */}
                    <td className="py-3 px-4 text-center">{rankBadge}</td>

                    {/* Model ID */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 font-mono text-[13px]">
                              {model.name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-normal">
                              by {model.author}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[11px] font-mono text-slate-500 truncate max-w-[260px]">
                              {model.id}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyId(model.id, e)}
                              title="Copy full model ID"
                              className="p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                            >
                              {copiedId === model.id ? (
                                <Check className="w-3 h-3 text-rose-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Trending Score Bar */}
                    <td className="py-3 px-4">
                      <div className="space-y-1 min-w-[130px]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-rose-600 flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                            {model.trendingScore}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{scoreRatio}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full"
                            style={{ width: `${Math.max(scoreRatio, 5)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Likes & Downloads */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 text-xs text-slate-600 font-mono">
                        <span className="flex items-center gap-1" title="Likes">
                          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-100" />
                          <span>{model.likes.toLocaleString()}</span>
                        </span>
                        <span className="flex items-center gap-1 text-slate-500" title="Downloads">
                          <Download className="w-3.5 h-3.5 text-slate-400" />
                          <span>{model.downloads ? model.downloads.toLocaleString() : '0'}</span>
                        </span>
                      </div>
                    </td>

                    {/* Pipeline Tag */}
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {model.pipelineTag}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <a
                          href={`https://huggingface.co/${model.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          title="Open Model Card on Hugging Face"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleLoadIntoVisualizer(model)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white transition-colors border border-rose-200 hover:border-rose-600"
                        >
                          <span>Tokenize</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredModels.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    No trending models found matching "{searchQuery}". Try clearing the search query or pipeline filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
