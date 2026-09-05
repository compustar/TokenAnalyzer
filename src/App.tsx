/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { ModelSelector } from './components/ModelSelector';
import { TokenVisualizer } from './components/TokenVisualizer';
import { TokenInspectorModal } from './components/TokenInspectorModal';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { ModelComparator } from './components/ModelComparator';
import { TokenIdsTable } from './components/TokenIdsTable';
import { ChatPromptMode } from './components/ChatPromptMode';
import { TokenIdDecoder } from './components/TokenIdDecoder';
import { ModelRegistryViewer } from './components/ModelRegistryViewer';
import { HFTrendingViewer } from './components/HFTrendingViewer';
import { SUPPORTED_MODELS, TIKTOKEN_MODELS, DEFAULT_MODEL } from './data/models';
import { PRESET_PROMPTS } from './data/presets';
import { ModelDefinition, TokenItem, ActiveTab, ColorTheme, TokenizationStats } from './types';
import { tokenizeTiktoken, tokenizeHf, calculateTokenStats } from './services/tokenizerEngine';
import { Eye, Layers, Table, MessageSquare, Binary, AlertCircle, Database, Flame } from 'lucide-react';

export default function App() {
  const [selectedModel, setSelectedModel] = useState<ModelDefinition>(DEFAULT_MODEL);
  const [promptText, setPromptText] = useState<string>(PRESET_PROMPTS[0].text);
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenItem | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('text');
  const [theme, setTheme] = useState<ColorTheme>('openai');
  const [showInvisibles, setShowInvisibles] = useState<boolean>(false);
  const [showInlineIds, setShowInlineIds] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<{ progress: number; file: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute stats for current tokens and prompt
  const stats: TokenizationStats = useMemo(() => {
    return calculateTokenStats(promptText, tokens, selectedModel);
  }, [promptText, tokens, selectedModel]);

  // Execute tokenization whenever prompt or model changes
  const runTokenization = useCallback(async (text: string, model: ModelDefinition) => {
    setErrorMessage(null);

    if (!text) {
      setTokens([]);
      return;
    }

    if (model.family === 'openai') {
      try {
        const result = tokenizeTiktoken(text, model);
        setTokens(result);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Tiktoken error:', err);
        setErrorMessage(err.message || 'Error executing tiktoken encoding.');
        setTokens([]);
        setIsLoading(false);
      }
    } else {
      // Hugging Face model
      setIsLoading(true);
      setDownloadProgress(null);
      try {
        const result = await tokenizeHf(text, model, (progress, file) => {
          setDownloadProgress({ progress, file });
        });
        setTokens(result);
        setErrorMessage(null);
      } catch (err: any) {
        console.error('Hugging Face tokenizer error:', err);
        setErrorMessage(
          err.message ||
          `Failed to load Hugging Face tokenizer "${model.hfModelId}". Check network connection or try another model.`
        );
      } finally {
        setIsLoading(false);
        setDownloadProgress(null);
      }
    }
  }, []);

  // Trigger tokenization on input changes (with slight debounce for typing responsiveness)
  useEffect(() => {
    const timer = setTimeout(() => {
      runTokenization(promptText, selectedModel);
    }, 60);

    return () => clearTimeout(timer);
  }, [promptText, selectedModel, runTokenization]);

  const handleSelectToken = (token: TokenItem) => {
    setSelectedToken(token);
  };

  const handleSelectTokenIndex = (index: number) => {
    if (index >= 0 && index < tokens.length) {
      setSelectedToken(tokens[index]);
    }
  };

  const handleClearInput = () => {
    setPromptText('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-950">
      {/* Sticky Header with Clear Input Button */}
      <Header currentModel={selectedModel} onClearInput={promptText ? handleClearInput : undefined} />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Model Bar and Mode Tabs */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <ModelSelector
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            isLoading={isLoading}
            downloadProgress={downloadProgress}
            onOpenRegistry={() => setActiveTab('registry')}
            onOpenHfTrending={() => setActiveTab('hfTrending')}
          />

          {/* Navigation View Switcher */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs overflow-x-auto max-w-full">
            <button
              type="button"
              id="tab-visualizer"
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeTab === 'text'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Tokenizer</span>
            </button>

            <button
              type="button"
              id="tab-registry"
              onClick={() => setActiveTab('registry')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeTab === 'registry'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-blue-500" />
              <span>tiktoken Models</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                activeTab === 'registry' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {TIKTOKEN_MODELS.length}
              </span>
            </button>

            <button
              type="button"
              id="tab-hf-trending"
              onClick={() => setActiveTab('hfTrending')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeTab === 'hfTrending'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>HF Hub Trending</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                activeTab === 'hfTrending' ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-700'
              }`}>
                Hot
              </span>
            </button>

            <button
              type="button"
              id="tab-compare"
              onClick={() => setActiveTab('compare')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeTab === 'compare'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Model Comparison</span>
            </button>

            <button
              type="button"
              id="tab-table"
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeTab === 'table'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Token Table</span>
            </button>

            <button
              type="button"
              id="tab-chat"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeTab === 'chat'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>ChatML Mode</span>
            </button>

            <button
              type="button"
              id="tab-token-ids"
              onClick={() => setActiveTab('tokenIds')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeTab === 'tokenIds'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Binary className="w-3.5 h-3.5" />
              <span>ID Decoder</span>
            </button>
          </div>
        </div>

        {/* Error notification banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedModel(DEFAULT_MODEL)}
              className="px-2.5 py-1 bg-rose-600 text-white rounded font-medium hover:bg-rose-700 transition-colors shrink-0"
            >
              Switch to {DEFAULT_MODEL.name}
            </button>
          </div>
        )}

        {/* Tab 1: Primary Visual Tokenizer */}
        {activeTab === 'text' && (
          <div className="space-y-6">
            <TokenVisualizer
              promptText={promptText}
              onChangePrompt={setPromptText}
              tokens={tokens}
              model={selectedModel}
              onSelectToken={handleSelectToken}
              selectedToken={selectedToken}
              theme={theme}
              onChangeTheme={setTheme}
              showInvisibles={showInvisibles}
              onToggleInvisibles={() => setShowInvisibles(!showInvisibles)}
              showInlineIds={showInlineIds}
              onToggleInlineIds={() => setShowInlineIds(!showInlineIds)}
              stats={stats}
            />

            {/* Real-time Visual Analytics */}
            <AnalyticsPanel stats={stats} model={selectedModel} />
          </div>
        )}

        {/* Tab 2: Tiktoken Model Registry (All models from tiktoken/model_to_encoding.json) */}
        {activeTab === 'registry' && (
          <ModelRegistryViewer
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            onNavigateToTokenizer={() => setActiveTab('text')}
          />
        )}

        {/* Tab 3: Hugging Face Hub Trending Models */}
        {activeTab === 'hfTrending' && (
          <HFTrendingViewer
            onSelectHfModel={(newModel) => {
              setSelectedModel(newModel);
            }}
            onNavigateToTokenizer={() => setActiveTab('text')}
          />
        )}

        {/* Tab 2: Cross-Model Comparison */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            <ModelComparator
              promptText={promptText}
              currentModel={selectedModel}
              onSelectModel={(newModel) => {
                setSelectedModel(newModel);
                setActiveTab('text');
              }}
            />
            {/* Real-time Visual Analytics */}
            <AnalyticsPanel stats={stats} model={selectedModel} />
          </div>
        )}

        {/* Tab 3: Detailed Token Table */}
        {activeTab === 'table' && (
          <div className="space-y-6">
            <TokenIdsTable
              tokens={tokens}
              model={selectedModel}
              onSelectToken={handleSelectToken}
            />
            <AnalyticsPanel stats={stats} model={selectedModel} />
          </div>
        )}

        {/* Tab 4: ChatML Formatter */}
        {activeTab === 'chat' && (
          <div className="space-y-6">
            <ChatPromptMode
              model={selectedModel}
              onApplyChatPrompt={(chatPrompt) => {
                setPromptText(chatPrompt);
                setActiveTab('text');
              }}
            />
            <AnalyticsPanel stats={stats} model={selectedModel} />
          </div>
        )}

        {/* Tab 5: Token IDs Decoder */}
        {activeTab === 'tokenIds' && (
          <div className="space-y-6">
            <TokenIdDecoder
              model={selectedModel}
              onApplyDecodedText={(text) => {
                setPromptText(text);
                setActiveTab('text');
              }}
            />
            <AnalyticsPanel stats={stats} model={selectedModel} />
          </div>
        )}
      </main>

      {/* Token Inspector Modal */}
      {selectedToken && (
        <TokenInspectorModal
          token={selectedToken}
          totalTokens={tokens.length}
          model={selectedModel}
          onClose={() => setSelectedToken(null)}
          onSelectTokenIndex={handleSelectTokenIndex}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">TokenAnalyzer</span>
            <span>•</span>
            <span>Professional LLM Token Architecture & Distribution Analysis</span>
          </div>
          <div className="flex items-center gap-4 text-slate-600 font-mono text-[11px]">
            <span>OpenAI tiktoken ({selectedModel.encoding || 'o200k_base'})</span>
            <span>•</span>
            <span>Hugging Face tokenizers.js</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
