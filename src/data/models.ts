import { ModelDefinition, TiktokenEncoding } from '../types';
import tiktokenModelToEncoding from 'tiktoken/model_to_encoding.json';
import { SEED_HF_TRENDING_MODELS } from './hfTrendingModels';

export const TIKTOKEN_MODEL_TO_ENCODING: Record<string, string> = tiktokenModelToEncoding;

// Metadata lookup for common OpenAI models to enrich display info
interface ModelMetadataOverrides {
  name?: string;
  contextWindow?: number;
  costPer1MInput?: number;
  costPer1MOutput?: number;
  description?: string;
  isPopular?: boolean;
}

const MODEL_OVERRIDES: Record<string, ModelMetadataOverrides> = {
  'gpt-5-chat-latest': {
    name: 'GPT-5 Chat (Latest)',
    contextWindow: 200000,
    costPer1MInput: 1.25,
    costPer1MOutput: 5.00,
    description: 'Next-generation OpenAI frontier conversational model utilizing o200k_base tokenization.',
    isPopular: true,
  },
  'gpt-5': {
    name: 'GPT-5',
    contextWindow: 200000,
    costPer1MInput: 1.25,
    costPer1MOutput: 5.00,
    description: 'Next-generation OpenAI flagship intelligence model with o200k_base BPE.',
    isPopular: true,
  },
  'gpt-5-mini': {
    name: 'GPT-5 mini',
    contextWindow: 128000,
    costPer1MInput: 0.15,
    costPer1MOutput: 0.60,
    description: 'High-speed, cost-efficient GPT-5 variant utilizing o200k_base.',
    isPopular: true,
  },
  'gpt-4o': {
    name: 'GPT-4o (Flagship)',
    contextWindow: 128000,
    costPer1MInput: 2.50,
    costPer1MOutput: 10.00,
    description: 'Current flagship OpenAI multimodal model using o200k_base tokenizer. 2x more efficient on non-English text and code.',
    isPopular: true,
  },
  'gpt-4o-mini': {
    name: 'GPT-4o mini',
    contextWindow: 128000,
    costPer1MInput: 0.15,
    costPer1MOutput: 0.60,
    description: 'Fast, cost-efficient model using the identical o200k_base tokenizer.',
    isPopular: true,
  },
  'o1': {
    name: 'OpenAI o1',
    contextWindow: 200000,
    costPer1MInput: 15.00,
    costPer1MOutput: 60.00,
    description: 'Reasoning model designed for complex STEM problems, coding, and multi-step reasoning with o200k_base.',
    isPopular: true,
  },
  'o1-mini': {
    name: 'OpenAI o1-mini',
    contextWindow: 128000,
    costPer1MInput: 1.10,
    costPer1MOutput: 4.40,
    description: 'Fast reasoning model optimized for coding and math with o200k_base encoding.',
    isPopular: true,
  },
  'o3-mini': {
    name: 'OpenAI o3-mini',
    contextWindow: 200000,
    costPer1MInput: 1.10,
    costPer1MOutput: 4.40,
    description: 'High-intelligence, low-latency reasoning model utilizing o200k_base tokenization.',
    isPopular: true,
  },
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    contextWindow: 128000,
    costPer1MInput: 10.00,
    costPer1MOutput: 30.00,
    description: 'OpenAI GPT-4 Turbo model utilizing the industry-standard cl100k_base tokenizer.',
    isPopular: true,
  },
  'gpt-4': {
    name: 'GPT-4 (Original)',
    contextWindow: 8192,
    costPer1MInput: 30.00,
    costPer1MOutput: 60.00,
    description: 'Original GPT-4 release model utilizing cl100k_base BPE encoding.',
    isPopular: true,
  },
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    contextWindow: 16385,
    costPer1MInput: 0.50,
    costPer1MOutput: 1.50,
    description: 'Widely used lightweight model family utilizing cl100k_base BPE.',
    isPopular: true,
  },
  'text-embedding-3-small': {
    name: 'text-embedding-3-small',
    contextWindow: 8191,
    costPer1MInput: 0.02,
    costPer1MOutput: 0.00,
    description: 'High-efficiency embedding model with cl100k_base tokenization.',
    isPopular: true,
  },
  'text-embedding-3-large': {
    name: 'text-embedding-3-large',
    contextWindow: 8191,
    costPer1MInput: 0.13,
    costPer1MOutput: 0.00,
    description: 'Most capable embedding model with cl100k_base tokenization.',
    isPopular: true,
  },
  'text-davinci-003': {
    name: 'text-davinci-003',
    contextWindow: 4096,
    costPer1MInput: 20.00,
    costPer1MOutput: 20.00,
    description: 'OpenAI InstructGPT model utilizing legacy p50k_base tokenizer.',
    isPopular: true,
  },
  'gpt2': {
    name: 'GPT-2',
    contextWindow: 1024,
    costPer1MInput: 0.50,
    costPer1MOutput: 0.50,
    description: 'Foundational Byte Pair Encoding (gpt2 / 50k vocab) developed by OpenAI.',
    isPopular: true,
  },
  'davinci': {
    name: 'Davinci (GPT-3 Base)',
    contextWindow: 2048,
    costPer1MInput: 20.00,
    costPer1MOutput: 20.00,
    description: 'Original GPT-3 base model utilizing r50k_base tokenizer.',
  },
};

function getVocabSize(encoding: string): string {
  switch (encoding) {
    case 'o200k_base':
      return '200,000';
    case 'cl100k_base':
      return '100,277';
    case 'p50k_base':
    case 'p50k_edit':
      return '50,281';
    case 'r50k_base':
    case 'gpt2':
      return '50,257';
    default:
      return '100,000+';
  }
}

function getDefaultContextWindow(modelId: string, encoding: string): number {
  if (modelId.startsWith('o1') || modelId.startsWith('o3')) return 200000;
  if (modelId.startsWith('gpt-4o') || modelId.startsWith('gpt-4-turbo') || modelId.startsWith('gpt-5') || modelId.startsWith('gpt-4.1')) return 128000;
  if (modelId.includes('32k')) return 32768;
  if (modelId.includes('16k') || modelId.startsWith('gpt-3.5')) return 16385;
  if (modelId.startsWith('text-embedding')) return 8191;
  if (modelId.startsWith('gpt-4')) return 8192;
  if (encoding === 'r50k_base' || encoding === 'p50k_base' || encoding === 'p50k_edit') return 4096;
  if (encoding === 'gpt2') return 1024;
  return 4096;
}

function getDefaultCost(encoding: string): { input: number; output: number } {
  if (encoding === 'o200k_base') return { input: 2.50, output: 10.00 };
  if (encoding === 'cl100k_base') return { input: 0.50, output: 1.50 };
  return { input: 2.00, output: 2.00 };
}

export const DEFAULT_MODEL_ID = 'gpt-5-chat-latest';

// Generate all ModelDefinition entries directly from "tiktoken/model_to_encoding.json"
export const TIKTOKEN_MODELS: ModelDefinition[] = Object.entries(tiktokenModelToEncoding)
  .map(([modelId, enc]) => {
    const encoding = enc as TiktokenEncoding;
    const overrides = MODEL_OVERRIDES[modelId] || {};
    const defaultCosts = getDefaultCost(encoding);

    return {
      id: modelId,
      name: overrides.name || modelId,
      family: 'openai' as const,
      encoding,
      vocabSize: getVocabSize(encoding),
      contextWindow: overrides.contextWindow || getDefaultContextWindow(modelId, encoding),
      costPer1MInput: overrides.costPer1MInput ?? defaultCosts.input,
      costPer1MOutput: overrides.costPer1MOutput ?? defaultCosts.output,
      description: overrides.description || `OpenAI model registered in tiktoken mapped to the ${encoding} Byte Pair Encoding tokenizer.`,
      badge: encoding,
      isPopular: overrides.isPopular || false,
    };
  })
  .sort((a, b) => {
    if (a.id === DEFAULT_MODEL_ID) return -1;
    if (b.id === DEFAULT_MODEL_ID) return 1;
    if (a.isPopular && !b.isPopular) return -1;
    if (!a.isPopular && b.isPopular) return 1;
    return a.name.localeCompare(b.name);
  });

// Hugging Face Models dynamically generated from HF Hub models sorted by trending_score
export const HUGGINGFACE_MODELS: ModelDefinition[] = SEED_HF_TRENDING_MODELS.map((m, index) => ({
  id: `hf-${m.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
  name: m.name,
  family: 'huggingface' as const,
  hfModelId: m.id,
  vocabSize: m.pipelineTag || 'Transformers BPE',
  contextWindow: 8192,
  costPer1MInput: 0.20,
  costPer1MOutput: 0.20,
  description: `#${index + 1} Trending on HF Hub • Trending Score: ${m.trendingScore.toLocaleString()} • ${m.likes.toLocaleString()} likes by ${m.author}`,
  badge: `🔥 ${m.trendingScore}`,
  isPopular: index < 5,
  trendingScore: m.trendingScore,
  likes: m.likes,
  downloads: m.downloads,
  author: m.author,
  rank: index + 1,
}));

export const SUPPORTED_MODELS: ModelDefinition[] = [
  ...TIKTOKEN_MODELS,
  ...HUGGINGFACE_MODELS,
];

export const DEFAULT_MODEL: ModelDefinition =
  SUPPORTED_MODELS.find((m) => m.id === DEFAULT_MODEL_ID) || SUPPORTED_MODELS[0];

