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
 * instead of space-delimited strings "Ġ Ġ".
 */
export function sanitizeTokenizerJSON(data: any): any {
  if (!data || typeof data !== 'object') return data;

  if (data.model && Array.isArray(data.model.merges)) {
    data.model.merges = data.model.merges.map((m: any) =>
      Array.isArray(m) ? m.join(' ') : String(m)
    );
  }

  if (Array.isArray(data.merges)) {
    data.merges = data.merges.map((m: any) =>
      Array.isArray(m) ? m.join(' ') : String(m)
    );
  }

  return data;
}

/**
 * Fallback loader for modern Hugging Face tokenizers that have modern merges format
 * or custom architectures not directly supported by default @xenova/transformers loaders.
 */
export async function loadModernHfTokenizerWithAdapter(
  hfModelId: string,
  options: any = {}
): Promise<any> {
  const revision = options.revision || 'main';
  const baseUrl = `https://huggingface.co/${hfModelId}/resolve/${revision}/`;
  const tokUrl = `${baseUrl}tokenizer.json`;
  const cfgUrl = `${baseUrl}tokenizer_config.json`;

  let tokenizerJSON: any = null;
  let tokenizerConfig: any = null;

  // 1. Check browser cache if enabled
  if (typeof caches !== 'undefined' && env.useBrowserCache) {
    try {
      const cache = await caches.open('transformers-cache');
      const cachedTok = await cache.match(tokUrl);
      if (cachedTok) {
        tokenizerJSON = await cachedTok.json();
      }
      const cachedCfg = await cache.match(cfgUrl);
      if (cachedCfg) {
        tokenizerConfig = await cachedCfg.json();
      }
    } catch {
      // Ignore cache match failure, fall back to network fetch
    }
  }

  // 2. Fetch tokenizer.json if not cached
  if (!tokenizerJSON) {
    const tokRes = await fetch(tokUrl);
    if (!tokRes.ok) {
      throw new Error(`Failed to fetch tokenizer.json for "${hfModelId}" (HTTP ${tokRes.status})`);
    }

    const contentLength = tokRes.headers.get('Content-Length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    let rawText = '';
    if (tokRes.body && total > 0 && options.progress_callback) {
      const reader = tokRes.body.getReader();
      let loaded = 0;
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          loaded += value.length;
          const pct = Math.min(100, Math.round((loaded / total) * 100));
          options.progress_callback({ status: 'progress', progress: pct, file: 'tokenizer.json' });
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
      rawText = await tokRes.text();
    }

    tokenizerJSON = JSON.parse(rawText);

    // Save to cache if possible
    if (typeof caches !== 'undefined' && env.useBrowserCache) {
      try {
        const cache = await caches.open('transformers-cache');
        await cache.put(
          tokUrl,
          new Response(rawText, { headers: { 'Content-Type': 'application/json' } })
        );
      } catch {
        // Cache save failure is non-blocking
      }
    }
  }

  // 3. Fetch tokenizer_config.json if not yet loaded
  if (!tokenizerConfig) {
    try {
      const cfgRes = await fetch(cfgUrl);
      if (cfgRes.ok) {
        const cfgText = await cfgRes.text();
        tokenizerConfig = JSON.parse(cfgText);
        if (typeof caches !== 'undefined' && env.useBrowserCache) {
          const cache = await caches.open('transformers-cache');
          await cache.put(
            cfgUrl,
            new Response(cfgText, { headers: { 'Content-Type': 'application/json' } })
          );
        }
      }
    } catch {
      tokenizerConfig = {};
    }
  }

  // 4. Sanitize merges array so that BPE model constructor receives space-delimited string merges
  sanitizeTokenizerJSON(tokenizerJSON);

  // 5. Instantiate tokenizer with matching class or PreTrainedTokenizer fallback
  const rawClassName = tokenizerConfig?.tokenizer_class?.replace(/Fast$/, '') || 'PreTrainedTokenizer';
  const mapping = (AutoTokenizer as any).TOKENIZER_CLASS_MAPPING || {};
  const TargetClass = mapping[rawClassName] || PreTrainedTokenizer;

  return new TargetClass(tokenizerJSON, tokenizerConfig || {});
}

// Global monkey-patch on AutoTokenizer.from_pretrained to intercept modern tokenizer format errors
const originalFromPretrained = AutoTokenizer.from_pretrained.bind(AutoTokenizer);
(AutoTokenizer as any).from_pretrained = async function (
  pretrained_model_name_or_path: string,
  options: any = {}
): Promise<any> {
  try {
    return await originalFromPretrained(pretrained_model_name_or_path, options);
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (msg.includes('split') || msg.includes('x.split') || msg.includes('is not a function')) {
      return await loadModernHfTokenizerWithAdapter(pretrained_model_name_or_path, options);
    }
    throw err;
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

      let tokenizer: any;
      try {
        tokenizer = await AutoTokenizer.from_pretrained(hfModelId, {
          progress_callback: progressCallback,
        });
      } catch (innerErr: any) {
        const msg = String(innerErr?.message || innerErr);
        if (msg.includes('split') || msg.includes('x.split') || msg.includes('is not a function')) {
          tokenizer = await loadModernHfTokenizerWithAdapter(hfModelId, {
            progress_callback: progressCallback,
          });
        } else {
          throw innerErr;
        }
      }

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
