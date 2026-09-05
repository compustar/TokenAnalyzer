import React, { useState, useMemo } from 'react';
import { Search, Copy, Check, ArrowRight, Code2, Database, Layers, Sparkles } from 'lucide-react';
import { ModelDefinition, TiktokenEncoding } from '../types';
import { TIKTOKEN_MODELS, TIKTOKEN_MODEL_TO_ENCODING } from '../data/models';

interface ModelRegistryViewerProps {
  selectedModel: ModelDefinition;
  onSelectModel: (model: ModelDefinition) => void;
  onNavigateToTokenizer: () => void;
}

export const ModelRegistryViewer: React.FC<ModelRegistryViewerProps> = ({
  selectedModel,
  onSelectModel,
  onNavigateToTokenizer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEncoding, setSelectedEncoding] = useState<string>('all');
  const [showRawJson, setShowRawJson] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  // Group counts by encoding
  const encodingCounts = useMemo(() => {
    const counts: Record<string, number> = { all: TIKTOKEN_MODELS.length };
    for (const model of TIKTOKEN_MODELS) {
      const enc = model.encoding || 'unknown';
      counts[enc] = (counts[enc] || 0) + 1;
    }
    return counts;
  }, []);

  // Filtered models list
  const filteredModels = useMemo(() => {
    return TIKTOKEN_MODELS.filter((m) => {
      const matchesEncoding = selectedEncoding === 'all' || m.encoding === selectedEncoding;
      const matchesSearch =
        m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.encoding && m.encoding.toLowerCase().includes(searchQuery.toLowerCase())) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesEncoding && matchesSearch;
    });
  }, [selectedEncoding, searchQuery]);

  const handleCopyModelId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(TIKTOKEN_MODEL_TO_ENCODING, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleSelectAndTokenize = (model: ModelDefinition) => {
    onSelectModel(model);
    onNavigateToTokenizer();
  };

  const encodingBadgeStyles: Record<string, string> = {
    o200k_base: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cl100k_base: 'bg-blue-50 text-blue-700 border-blue-200',
    p50k_base: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    r50k_base: 'bg-purple-50 text-purple-700 border-purple-200',
    p50k_edit: 'bg-amber-50 text-amber-700 border-amber-200',
    gpt2: 'bg-slate-100 text-slate-700 border-slate-300',
  };

  return (
    <div className="space-y-5">
      {/* Registry Hero Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <Database className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                tiktoken Model Registry
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                tiktoken/model_to_encoding.json
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-3xl">
              Complete registry of all <strong>{TIKTOKEN_MODELS.length} OpenAI models</strong> loaded directly from{' '}
              <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-800 border border-slate-200">
                tiktoken/model_to_encoding.json
              </code>
              . Each model maps to an official OpenAI Byte Pair Encoding (BPE) tokenizer scheme.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRawJson(!showRawJson)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors border border-slate-200"
            >
              <Code2 className="w-3.5 h-3.5 text-slate-600" />
              <span>{showRawJson ? 'Hide Raw JSON' : 'Inspect Raw JSON'}</span>
            </button>
          </div>
        </div>

        {/* Statistical Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Models</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">{TIKTOKEN_MODELS.length}</span>
            <span className="text-[10px] text-slate-400">Registered in tiktoken</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">BPE Encodings</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">6</span>
            <span className="text-[10px] text-slate-400">o200k, cl100k, p50k, r50k, gpt2</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">o200k_base Models</span>
            <span className="text-xl font-extrabold text-emerald-700 font-mono mt-0.5 block">{encodingCounts['o200k_base'] || 0}</span>
            <span className="text-[10px] text-slate-400">GPT-4o, o1, o3, GPT-5 series</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">cl100k_base Models</span>
            <span className="text-xl font-extrabold text-blue-700 font-mono mt-0.5 block">{encodingCounts['cl100k_base'] || 0}</span>
            <span className="text-[10px] text-slate-400">GPT-4, GPT-3.5 Turbo series</span>
          </div>
        </div>
      </div>

      {/* Raw JSON View (Collapsible) */}
      {showRawJson && (
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                Source: tiktoken/model_to_encoding.json (Exact content)
              </h3>
            </div>
            <button
              type="button"
              onClick={handleCopyJson}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
            >
              {copiedJson ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedJson ? 'Copied JSON' : 'Copy Entire JSON'}</span>
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto p-4 bg-slate-900 rounded-xl font-mono text-xs text-emerald-400 leading-relaxed">
            <pre>{JSON.stringify(TIKTOKEN_MODEL_TO_ENCODING, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by model name, ID, or description (e.g. o1, gpt-4o, search, davinci)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Showing <strong className="text-slate-900 font-mono">{filteredModels.length}</strong> of{' '}
            <span className="font-mono">{TIKTOKEN_MODELS.length}</span> models
          </div>
        </div>

        {/* Encoding Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Encodings:
          </span>

          <button
            type="button"
            onClick={() => setSelectedEncoding('all')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
              selectedEncoding === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All ({encodingCounts['all']})
          </button>

          {(['o200k_base', 'cl100k_base', 'r50k_base', 'p50k_base', 'p50k_edit', 'gpt2'] as TiktokenEncoding[]).map((enc) => {
            const count = encodingCounts[enc] || 0;
            const isSelected = selectedEncoding === enc;
            return (
              <button
                key={enc}
                type="button"
                onClick={() => setSelectedEncoding(enc)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all whitespace-nowrap border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {enc} <span className="opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Models Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Model Identifier (tiktoken key)</th>
                <th className="py-3 px-4">Tokenizer Encoding</th>
                <th className="py-3 px-4">Vocabulary Size</th>
                <th className="py-3 px-4">Context Window</th>
                <th className="py-3 px-4">Pricing (/ 1M tokens)</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredModels.map((model) => {
                const isSelected = selectedModel.id === model.id;
                const badgeClass =
                  encodingBadgeStyles[model.encoding || ''] || 'bg-slate-100 text-slate-700 border-slate-200';

                return (
                  <tr
                    key={model.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-blue-50/60 font-medium' : ''
                    }`}
                  >
                    {/* Model ID */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 font-mono text-[12px]">{model.id}</span>
                            {model.isPopular && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                Popular
                              </span>
                            )}
                            {isSelected && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-600 text-white">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{model.name !== model.id ? model.name : model.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleCopyModelId(model.id, e)}
                          title="Copy model identifier"
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors ml-auto shrink-0"
                        >
                          {copiedId === model.id ? (
                            <Check className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Encoding */}
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold border ${badgeClass}`}>
                        {model.encoding}
                      </span>
                    </td>

                    {/* Vocabulary */}
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {model.vocabSize}
                    </td>

                    {/* Context Window */}
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {model.contextWindow.toLocaleString()} tokens
                    </td>

                    {/* Cost */}
                    <td className="py-3 px-4 font-mono text-slate-700">
                      <div>
                        <span>In: ${model.costPer1MInput.toFixed(2)}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span>Out: ${model.costPer1MOutput.toFixed(2)}</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleSelectAndTokenize(model)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700'
                        }`}
                      >
                        <span>{isSelected ? 'Active in Tokenizer' : 'Select & Tokenize'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredModels.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    No models found matching "{searchQuery}". Try a different search query or clear the filter.
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
