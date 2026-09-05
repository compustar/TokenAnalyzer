import { getEncoding, Tiktoken } from 'js-tiktoken';
import { AutoTokenizer, PreTrainedTokenizer, env } from '@xenova/transformers';
import { ModelDefinition, TokenItem, TokenizationStats, TokenDistribution, TiktokenEncoding } from '../types';

// Configure transformers.js for browser client
env.allowLocalModels = false;
env.useBrowserCache = typeof window !== 'undefined' && typeof caches !== 'undefined';

// Cache of initialized tiktoken encodings
const tiktokenCache = new Map<string, Tiktoken>();

// Cache of initialized Hugging Face tokenizers
const hfTokenizerCache = new Map<string, any>();

// Keep track of downloading models
const hfLoadingPromises = new Map<string, Promise<any>>();

/**
 * Sanitizes tokenizer.json for modern Hugging Face models (like GLM-5.3, GLM-5.3-Flash, Llama-3, etc.)
 * where merges are exported as arrays of string pairs [["Ġ", "Ġ"], ["i", "n"]]
 * instead of space-delimited strings "Ġ Ġ", handles missing model types (like facebook/bart-base),
 * and polyfills missing structural components.
 */
export function sanitizeTokenizerJSON(data: any, tokenizerConfig?: any): any {
  if (!data || typeof data !== 'object') return data;

  // 1. Normalize model type if omitted in older exports (e.g. facebook/bart-base)
  if (data.model && typeof data.model === 'object') {
    if (!data.model.type) {
      if (Array.isArray(data.model.merges) || Array.isArray(data.merges)) {
        data.model.type = 'BPE';
      } else if (data.model.vocab && typeof data.model.vocab === 'object') {
        data.model.type = 'WordPiece';
      }
    }

    // 2. Normalize merges: convert array of string pairs [["Ġ", "Ġ"]] to space-separated strings "Ġ Ġ"
    if (Array.isArray(data.model.merges)) {
      data.model.merges = data.model.merges
        .map((m: any) => (Array.isArray(m) ? m.join(' ') : String(m)))
        .filter(Boolean);
    }
  }

  if (Array.isArray(data.merges)) {
    data.merges = data.merges
      .map((m: any) => (Array.isArray(m) ? m.join(' ') : String(m)))
      .filter(Boolean);
  }

  // 3. Added tokens normalization (must be an iterable array)
  if (!Array.isArray(data.added_tokens)) {
    data.added_tokens = [];
  }

  // 4. Safe component polyfills for missing or malformed normalizers/pre-tokenizers/decoders
  if (data.pre_tokenizer === undefined) {
    data.pre_tokenizer = { type: 'ByteLevel', add_prefix_space: false, trim_offsets: true };
  }
  if (data.post_processor === undefined) {
    data.post_processor = { type: 'ByteLevel', add_prefix_space: false, trim_offsets: true };
  }
  if (data.decoder === undefined) {
    data.decoder = { type: 'ByteLevel', add_prefix_space: true, trim_offsets: true };
  }
  if (data.normalizer === undefined) {
    data.normalizer = null;
  }

  return data;
}

/**
 * Helper to fetch a file from Hugging Face Hub (with browser cache support and progress tracking)
 */
async function fetchHfHubFile(
  hfModelId: string,
  fileName: string,
  revision: string = 'main',
  progressCallback?: (data: any) => void
): Promise<{ ok: boolean; status: number; text: string | null; data: any | null }> {
  const url = `https://huggingface.co/${hfModelId}/resolve/${revision}/${fileName}`;

  // 1. Check browser cache if available
  if (typeof caches !== 'undefined' && env.useBrowserCache) {
    try {
      const cache = await caches.open('transformers-cache');
      const cached = await cache.match(url);
      if (cached) {
        const text = await cached.text();
        let data = null;
        if (fileName.endsWith('.json')) {
          try {
            data = JSON.parse(text);
          } catch {
            /* ignore json parse error */
          }
        }
        return { ok: true, status: 200, text, data };
      }
    } catch {
      // cache read failure is non-blocking
    }
  }

  // 2. Network fetch
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return { ok: false, status: res.status, text: null, data: null };
    }

    const contentLength = res.headers.get('Content-Length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    let rawText = '';

    if (res.body && total > 0 && progressCallback) {
      const reader = res.body.getReader();
      let loaded = 0;
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          loaded += value.length;
          const pct = Math.min(100, Math.round((loaded / total) * 100));
          progressCallback({ status: 'progress', progress: pct, file: fileName });
        }
      }

      const combined = new Uint8Array(loaded);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      rawText = new TextDecoder('utf-8').decode(combined);
    } else {
      rawText = await res.text();
    }

    // Cache to browser cache
    if (typeof caches !== 'undefined' && env.useBrowserCache) {
      try {
        const cache = await caches.open('transformers-cache');
        await cache.put(
          url,
          new Response(rawText, {
            headers: {
              'Content-Type': fileName.endsWith('.json') ? 'application/json' : 'text/plain',
            },
          })
        );
      } catch {
        // ignore cache write error
      }
    }

    let data = null;
    if (fileName.endsWith('.json')) {
      try {
        data = JSON.parse(rawText);
      } catch {
        /* ignore json parse error */
      }
    }

    return { ok: true, status: res.status, text: rawText, data };
  } catch {
    return { ok: false, status: 0, text: null, data: null };
  }
}

/**
 * Method 1 (Cascade Loader) + Method 4 (Schema Normalization):
 * Robust multi-file cascade loader that transparently resolves:
 * 1. Modern Fast Tokenizer (tokenizer.json) with non-fatal tokenizer_config.json & config.json fallback
 * 2. Classic BPE (vocab.json + merges.txt) synthesized into fast BPE in-memory (e.g. legacy BART/RoBERTa/GPT2)
 * 3. WordPiece (vocab.txt) synthesized into fast WordPiece in-memory (e.g. classic BERT)
 * 4. Architecture detection & fallback for custom auto_map classes (e.g. TikTokenTokenizer)
 */
export async function loadHfTokenizerWithCascade(
  hfModelId: string,
  options: any = {}
): Promise<any> {
  const revision = options.revision || 'main';
  const progressCallback = options.progress_callback;

  // --- STRATEGY 1: Modern Fast Tokenizer (tokenizer.json) ---
  const tokFile = await fetchHfHubFile(hfModelId, 'tokenizer.json', revision, progressCallback);
  if (tokFile.ok && tokFile.data) {
    const tokenizerJSON = tokFile.data;

    // Fetch companion configuration (non-fatal if missing, as with facebook/bart-base)
    let tokenizerConfig: any = {};
    const cfgFile = await fetchHfHubFile(hfModelId, 'tokenizer_config.json', revision);
    if (cfgFile.ok && cfgFile.data) {
      tokenizerConfig = cfgFile.data;
    } else {
      // Fallback: inspect config.json for special tokens and model type
      const modelCfgFile = await fetchHfHubFile(hfModelId, 'config.json', revision);
      if (modelCfgFile.ok && modelCfgFile.data) {
        tokenizerConfig = modelCfgFile.data;
      }
    }

    // Method 4: Sanitize & normalize schema (merges, model.type, added_tokens, components)
    sanitizeTokenizerJSON(tokenizerJSON, tokenizerConfig);

    // Resolve tokenizer class safely (avoid crashing on custom auto_map classes like TikTokenTokenizer)
    const rawClassName =
      tokenizerConfig?.tokenizer_class?.replace(/Fast$/, '') || 'PreTrainedTokenizer';
    const mapping = (AutoTokenizer as any).TOKENIZER_CLASS_MAPPING || {};
    const TargetClass = mapping[rawClassName] || PreTrainedTokenizer;

    return new TargetClass(tokenizerJSON, tokenizerConfig);
  }

  // --- STRATEGY 2: Classic BPE (vocab.json + merges.txt) ---
  const [vocabFile, mergesFile] = await Promise.all([
    fetchHfHubFile(hfModelId, 'vocab.json', revision, progressCallback),
    fetchHfHubFile(hfModelId, 'merges.txt', revision, progressCallback),
  ]);

  if (vocabFile.ok && vocabFile.data && mergesFile.ok && mergesFile.text) {
    const vocab = vocabFile.data;
    const merges = mergesFile.text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'));

    // Optional companion config
    let companionConfig: any = {};
    const cfgFile = await fetchHfHubFile(hfModelId, 'tokenizer_config.json', revision);
    if (cfgFile.ok && cfgFile.data) {
      companionConfig = cfgFile.data;
    } else {
      const modelCfgFile = await fetchHfHubFile(hfModelId, 'config.json', revision);
      if (modelCfgFile.ok && modelCfgFile.data) {
        companionConfig = modelCfgFile.data;
      }
    }

    // In-memory synthesis of standard Fast Tokenizer JSON with Method 4 schema compliance
    const syntheticBPEJSON = sanitizeTokenizerJSON(
      {
        version: '1.0',
        added_tokens: [],
        normalizer: null,
        pre_tokenizer: {
          type: 'ByteLevel',
          add_prefix_space: false,
          trim_offsets: true,
          use_regex: true,
        },
        post_processor: {
          type: 'ByteLevel',
          add_prefix_space: false,
          trim_offsets: true,
          use_regex: true,
        },
        decoder: {
          type: 'ByteLevel',
          add_prefix_space: true,
          trim_offsets: true,
          use_regex: true,
        },
        model: {
          type: 'BPE',
          vocab,
          merges,
        },
      },
      companionConfig
    );

    const rawClassName =
      companionConfig?.tokenizer_class?.replace(/Fast$/, '') || 'PreTrainedTokenizer';
    const mapping = (AutoTokenizer as any).TOKENIZER_CLASS_MAPPING || {};
    const TargetClass = mapping[rawClassName] || PreTrainedTokenizer;

    return new TargetClass(syntheticBPEJSON, companionConfig);
  }

  // --- STRATEGY 3: Classic WordPiece (vocab.txt) ---
  const vocabTxtFile = await fetchHfHubFile(hfModelId, 'vocab.txt', revision, progressCallback);
  if (vocabTxtFile.ok && vocabTxtFile.text) {
    const vocabLines = vocabTxtFile.text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const vocab: Record<string, number> = {};
    for (let i = 0; i < vocabLines.length; i++) {
      vocab[vocabLines[i]] = i;
    }

    const syntheticWordPieceJSON = sanitizeTokenizerJSON({
      version: '1.0',
      added_tokens: [],
      normalizer: null,
      pre_tokenizer: { type: 'BertPreTokenizer' },
      post_processor: null,
      decoder: { type: 'WordPiece' },
      model: {
        type: 'WordPiece',
        vocab,
        unk_token: '[UNK]',
      },
    });

    return new PreTrainedTokenizer(syntheticWordPieceJSON, {});
  }

  // --- STRATEGY 4: Native @xenova/transformers Fallback (e.g. SentencePiece spiece.model) ---
  return await originalFromPretrained(hfModelId, { ...options, legacy: true });
}

export const loadModernHfTokenizerWithAdapter = loadHfTokenizerWithCascade;

// Global monkey-patch on AutoTokenizer.from_pretrained to intercept and cascade
const originalFromPretrained = AutoTokenizer.from_pretrained.bind(AutoTokenizer);
(AutoTokenizer as any).from_pretrained = async function (
  pretrained_model_name_or_path: string,
  options: any = {}
): Promise<any> {
  try {
    return await loadHfTokenizerWithCascade(pretrained_model_name_or_path, options);
  } catch (err: any) {
    // If cascade loader throws, attempt legacy native load as last resort
    return await originalFromPretrained(pretrained_model_name_or_path, { ...options, legacy: true });
  }
};

export function getTiktokenInstance(encodingName: TiktokenEncoding): Tiktoken {
  if (!tiktokenCache.has(encodingName)) {
    const enc = getEncoding(encodingName);
    tiktokenCache.set(encodingName, enc);
  }
  return tiktokenCache.get(encodingName)!;
}

export async function getHfTokenizerInstance(
  hfModelId: string,
  onProgress?: (progress: number, file: string) => void
): Promise<any> {
  if (hfTokenizerCache.has(hfModelId)) {
    return hfTokenizerCache.get(hfModelId);
  }

  if (hfLoadingPromises.has(hfModelId)) {
    return hfLoadingPromises.get(hfModelId);
  }

  const promise = (async () => {
    try {
      const progressCallback = (data: any) => {
        if (data && data.status === 'progress' && onProgress) {
          onProgress(Math.round(data.progress || 0), data.file || '');
        }
      };

      const tokenizer = await loadHfTokenizerWithCascade(hfModelId, {
        progress_callback: progressCallback,
      });

      hfTokenizerCache.set(hfModelId, tokenizer);
      return tokenizer;
    } finally {
      hfLoadingPromises.delete(hfModelId);
    }
  })();

  hfLoadingPromises.set(hfModelId, promise);
  return promise;
}

export function isHfModelCached(hfModelId: string): boolean {
  return hfTokenizerCache.has(hfModelId);
}

/**
 * Formats a display-safe version of a token string showing whitespace visibly
 */
export function formatDisplayToken(str: string): string {
  if (!str) return '';
  return str
    .replace(/\r\n/g, '↵')
    .replace(/\r/g, '␍')
    .replace(/\n/g, '↵')
    .replace(/\t/g, '⇥')
    .replace(/ /g, '·');
}

/**
 * Converts byte array to hex string (e.g. 0x68 0x65)
 */
export function bytesToHex(bytes: number[]): string {
  return bytes.map(b => '0x' + b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
}

/**
 * Tokenizes text using OpenAI tiktoken
 */
export function tokenizeTiktoken(text: string, model: ModelDefinition): TokenItem[] {
  if (!text) return [];
  const encoding = model.encoding || 'o200k_base';
  const enc = getTiktokenInstance(encoding);
  
  const tokenIds = enc.encode(text);
  const items: TokenItem[] = [];
  const encoder = new TextEncoder();

  let charOffset = 0;

  for (let i = 0; i < tokenIds.length; i++) {
    const id = tokenIds[i];
    let pieceText = '';
    try {
      pieceText = enc.decode([id]);
    } catch {
      pieceText = '';
    }

    const rawBytesUint8 = encoder.encode(pieceText);
    const rawBytes: number[] = Array.from(rawBytesUint8);
    
    const isWhitespace = /^\s+$/.test(pieceText);
    const isNewline = pieceText.includes('\n');
    const hex = bytesToHex(rawBytes);

    const charStart = charOffset;
    const charEnd = charOffset + pieceText.length;
    charOffset = charEnd;

    items.push({
      index: i,
      id,
      text: pieceText,
      displayValue: formatDisplayToken(pieceText),
      rawBytes,
      hex,
      charStart,
      charEnd,
      colorIndex: i % 10,
      isWhitespace,
      isNewline,
    });
  }

  return items;
}

/**
 * Tokenizes text using Hugging Face AutoTokenizer
 */
export async function tokenizeHf(
  text: string,
  model: ModelDefinition,
  onProgress?: (progress: number, file: string) => void
): Promise<TokenItem[]> {
  if (!text) return [];
  const hfModelId = model.hfModelId || 'Xenova/bert-base-uncased';
  const tokenizer = await getHfTokenizerInstance(hfModelId, onProgress);

  const encoded = await tokenizer(text, { return_tensor: false });
  const rawIds = Array.isArray(encoded.input_ids)
    ? encoded.input_ids
    : Array.from(encoded.input_ids?.data || []);
  const inputIds: number[] = rawIds.map((id: any) => Number(id));

  const items: TokenItem[] = [];
  const encoder = new TextEncoder();
  let charOffset = 0;

  for (let i = 0; i < inputIds.length; i++) {
    const id = inputIds[i];
    let pieceText = '';
    try {
      pieceText = tokenizer.decode([Number(id)], { skip_special_tokens: false }) || '';
    } catch {
      pieceText = `[Token ${id}]`;
    }

    const rawBytes = Array.from(encoder.encode(pieceText));
    const isWhitespace = /^\s+$/.test(pieceText);
    const isNewline = pieceText.includes('\n');
    const hex = bytesToHex(rawBytes);

    const charStart = charOffset;
    const charEnd = charOffset + pieceText.length;
    charOffset = charEnd;

    items.push({
      index: i,
      id,
      text: pieceText,
      displayValue: formatDisplayToken(pieceText),
      rawBytes,
      hex,
      charStart,
      charEnd,
      colorIndex: i % 10,
      isWhitespace,
      isNewline,
    });
  }

  return items;
}

/**
 * Decodes an array of token IDs back into string
 */
export async function decodeTokenIds(tokenIds: number[], model: ModelDefinition): Promise<string> {
  if (!tokenIds || tokenIds.length === 0) return '';

  if (model.family === 'openai') {
    const enc = getTiktokenInstance(model.encoding || 'o200k_base');
    return enc.decode(tokenIds);
  } else {
    const hfModelId = model.hfModelId || 'Xenova/bert-base-uncased';
    const tokenizer = await getHfTokenizerInstance(hfModelId);
    return tokenizer.decode(tokenIds.map(Number), { skip_special_tokens: false });
  }
}

/**
 * Computes deep analytics and metrics for the given tokens and text
 */
export function calculateTokenStats(
  text: string,
  tokens: TokenItem[],
  model: ModelDefinition
): TokenizationStats {
  const tokenCount = tokens.length;
  const characterCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const bytesCount = new TextEncoder().encode(text).length;

  const tokensPerWord = wordCount > 0 ? Number((tokenCount / wordCount).toFixed(2)) : 0;
  const charactersPerToken = tokenCount > 0 ? Number((characterCount / tokenCount).toFixed(2)) : 0;

  const estimatedCost1x = (tokenCount / 1_000_000) * model.costPer1MInput;
  const estimatedCost1k = estimatedCost1x * 1_000;
  const estimatedCost1M = estimatedCost1x * 1_000_000;

  const contextPercentage = model.contextWindow > 0
    ? Math.min(100, Number(((tokenCount / model.contextWindow) * 100).toFixed(3)))
    : 0;

  // Compute length distribution
  const buckets: Record<string, number> = {
    '1 char': 0,
    '2 chars': 0,
    '3-4 chars': 0,
    '5-8 chars': 0,
    '9+ chars': 0,
    'Whitespace': 0,
  };

  for (const token of tokens) {
    if (token.isWhitespace) {
      buckets['Whitespace']++;
    } else {
      const len = token.text.length;
      if (len === 1) buckets['1 char']++;
      else if (len === 2) buckets['2 chars']++;
      else if (len >= 3 && len <= 4) buckets['3-4 chars']++;
      else if (len >= 5 && len <= 8) buckets['5-8 chars']++;
      else buckets['9+ chars']++;
    }
  }

  const distribution: TokenDistribution[] = Object.entries(buckets).map(([range, count]) => ({
    range,
    count,
    percentage: tokenCount > 0 ? Number(((count / tokenCount) * 100).toFixed(1)) : 0,
  }));

  return {
    tokenCount,
    characterCount,
    wordCount,
    tokensPerWord,
    charactersPerToken,
    bytesCount,
    estimatedCost1x,
    estimatedCost1k,
    estimatedCost1M,
    contextPercentage,
    distribution,
  };
}

/**
 * Assembles ChatML format for OpenAI chat messages
 * Calculates exact tokens with wrapper overhead
 */
export function formatChatMessages(messages: { role: string; content: string }[]): string {
  let prompt = '';
  for (const message of messages) {
    prompt += `<|im_start|>${message.role}\n${message.content}\n<|im_end|>\n`;
  }
  prompt += '<|im_start|>assistant\n';
  return prompt;
}
