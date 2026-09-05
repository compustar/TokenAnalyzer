export type ModelFamily = 'openai' | 'huggingface';

export type TiktokenEncoding = 'o200k_base' | 'cl100k_base' | 'p50k_base' | 'r50k_base' | 'p50k_edit' | 'gpt2';

export interface ModelDefinition {
  id: string;
  name: string;
  family: ModelFamily;
  encoding?: TiktokenEncoding;
  hfModelId?: string;
  vocabSize: string | number;
  contextWindow: number;
  costPer1MInput: number; // USD per 1M tokens
  costPer1MOutput: number; // USD per 1M tokens
  description: string;
  badge?: string;
  isPopular?: boolean;
  trendingScore?: number;
  likes?: number;
  downloads?: number;
  author?: string;
  rank?: number;
}

export interface TokenItem {
  index: number;
  id: number;
  text: string;
  displayValue: string;
  rawBytes: number[];
  hex: string;
  charStart: number;
  charEnd: number;
  colorIndex: number;
  isWhitespace: boolean;
  isNewline: boolean;
  isSpecial?: boolean;
}

export interface TokenDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface TokenizationStats {
  tokenCount: number;
  characterCount: number;
  wordCount: number;
  tokensPerWord: number;
  charactersPerToken: number;
  bytesCount: number;
  estimatedCost1x: number;
  estimatedCost1k: number;
  estimatedCost1M: number;
  contextPercentage: number;
  distribution: TokenDistribution[];
}

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type ActiveTab = 'text' | 'tokenIds' | 'chat' | 'compare' | 'table' | 'registry' | 'hfTrending';
export type ColorTheme = 'openai' | 'vivid' | 'terminal' | 'subtle';

export interface HFTrendingModel {
  id: string;
  name: string;
  author: string;
  trendingScore: number;
  likes: number;
  downloads: number;
  pipelineTag: string;
  createdAt?: string;
  tags?: string[];
}

export interface ModelComparisonResult {
  model: ModelDefinition;
  tokenCount: number;
  tokensPerWord: number;
  costPer1M: number;
  status: 'ready' | 'loading' | 'error';
  error?: string;
}
