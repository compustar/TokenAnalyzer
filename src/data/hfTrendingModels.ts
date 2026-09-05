import { HFTrendingModel } from '../types';

/**
 * Checks if a pipeline tag matches any of the excluded categories:
 * - *-to-speech (e.g. text-to-speech, speech-to-speech)
 * - *-to-video (e.g. text-to-video, image-to-video, image-text-to-video)
 * - *-to-image (e.g. text-to-image, image-to-image)
 * - time-series-forecasting
 * - zero-shot-image-classification
 * - automatic-speech-recognition
 */
export function isDisallowedPipelineTag(pipelineTag?: string | null): boolean {
  if (!pipelineTag) return false;
  const tag = pipelineTag.trim().toLowerCase();
  if (tag.endsWith('-to-speech')) return true;
  if (tag.endsWith('-to-video')) return true;
  if (tag.endsWith('-to-image')) return true;
  if (tag === 'time-series-forecasting') return true;
  if (tag === 'zero-shot-image-classification') return true;
  if (tag === 'automatic-speech-recognition') return true;
  return false;
}

/**
 * Checks if a model ID contains 'GGUF' (case-insensitive).
 */
export function isDisallowedModelId(modelId?: string | null): boolean {
  if (!modelId) return false;
  return modelId.toLowerCase().includes('gguf');
}

/**
 * Combined validator for Hugging Face models checking pipeline tag and model ID.
 */
export function isDisallowedHfModel(model: { id?: string; pipelineTag?: string; pipeline_tag?: string }): boolean {
  if (isDisallowedModelId(model.id)) return true;
  if (isDisallowedPipelineTag(model.pipelineTag || model.pipeline_tag)) return true;
  return false;
}

const RAW_SEED_HF_TRENDING_MODELS: HFTrendingModel[] = [
  {
    id: "zai-org/GLM-5.3",
    name: "GLM-5.3",
    author: "zai-org",
    trendingScore: 1228,
    likes: 1552,
    downloads: 151021,
    pipelineTag: "text-generation",
    createdAt: "2026-08-25T06:42:50.000Z",
    tags: ["transformers", "safetensors", "glm_moe_dsa", "text-generation", "conversational", "fp8"]
  },
  {
    id: "Qwen/Qwen3.8-Flash-Next",
    name: "Qwen3.8-Flash-Next",
    author: "Qwen",
    trendingScore: 767,
    likes: 4757,
    downloads: 263287,
    pipelineTag: "image-text-to-text",
    createdAt: "2026-08-24T08:24:59.000Z",
    tags: ["transformers", "safetensors", "image-text-to-text", "conversational", "endpoints_compatible"]
  },
  {
    id: "zai-org/GLM-5.3-Flash",
    name: "GLM-5.3-Flash",
    author: "zai-org",
    trendingScore: 747,
    likes: 1992,
    downloads: 517902,
    pipelineTag: "image-text-to-text",
    createdAt: "2026-08-25T06:43:14.000Z",
    tags: ["transformers", "safetensors", "glm5_next", "image-text-to-text", "conversational", "license:mit"]
  },
  {
    id: "Qwen/Qwen3.8-27B",
    name: "Qwen3.8-27B",
    author: "Qwen",
    trendingScore: 549,
    likes: 13744,
    downloads: 5254882,
    pipelineTag: "image-text-to-text",
    createdAt: "2026-08-20T10:15:30.000Z",
    tags: ["transformers", "safetensors", "qwen3.8", "multimodal", "image-text-to-text"]
  },
  {
    id: "deepseek-ai/DeepSeek-V4-Flash-Vision-Exp",
    name: "DeepSeek-V4-Flash-Vision-Exp",
    author: "deepseek-ai",
    trendingScore: 498,
    likes: 518,
    downloads: 54571,
    pipelineTag: "image-text-to-text",
    createdAt: "2026-08-26T12:00:00.000Z",
    tags: ["transformers", "deepseek", "vision", "image-text-to-text", "experimental"]
  },
  {
    id: "tencent/Hy4-preview",
    name: "Hy4-preview",
    author: "tencent",
    trendingScore: 396,
    likes: 404,
    downloads: 4449,
    pipelineTag: "text-generation",
    createdAt: "2026-08-27T04:18:22.000Z",
    tags: ["transformers", "safetensors", "text-generation", "preview", "moe"]
  },
  {
    id: "pipecat-ai/phonellm-alpha-1",
    name: "phonellm-alpha-1",
    author: "pipecat-ai",
    trendingScore: 198,
    likes: 201,
    downloads: 11526,
    pipelineTag: "text-generation",
    createdAt: "2026-08-24T18:47:20.000Z",
    tags: ["transformers", "safetensors", "nemotron", "voice-agent", "phone"]
  },
  {
    id: "OBLITERATUS/Qwen3.8-27B-OBLITERATED",
    name: "Qwen3.8-27B-OBLITERATED",
    author: "OBLITERATUS",
    trendingScore: 171,
    likes: 1037,
    downloads: 848781,
    pipelineTag: "text-generation",
    createdAt: "2026-08-19T14:53:08.000Z",
    tags: ["safetensors", "gguf", "qwen3.8", "uncensored"]
  },
  {
    id: "sentence-transformers/all-MiniLM-L6-v2",
    name: "all-MiniLM-L6-v2",
    author: "sentence-transformers",
    trendingScore: 141,
    likes: 5414,
    downloads: 246135287,
    pipelineTag: "sentence-similarity",
    createdAt: "2022-03-02T23:29:05.000Z",
    tags: ["sentence-transformers", "pytorch", "onnx", "safetensors", "bert"]
  },
  {
    id: "XHToken/Spark-X2.5-4B",
    name: "Spark-X2.5-4B",
    author: "XHToken",
    trendingScore: 141,
    likes: 146,
    downloads: 1514,
    pipelineTag: "text-generation",
    createdAt: "2026-08-24T06:34:34.000Z",
    tags: ["transformers", "safetensors", "spark2_5", "conversational"]
  },
  {
    id: "orcarouter/GLM-5.3-Flash-Uncensored-FP8",
    name: "GLM-5.3-Flash-Uncensored-FP8",
    author: "orcarouter",
    trendingScore: 138,
    likes: 156,
    downloads: 4477,
    pipelineTag: "text-generation",
    createdAt: "2026-08-29T07:13:27.000Z",
    tags: ["transformers", "safetensors", "glm5_next", "fp8"]
  },
  {
    id: "openai-community/gpt2",
    name: "gpt2",
    author: "openai-community",
    trendingScore: 130,
    likes: 3557,
    downloads: 14071683,
    pipelineTag: "text-generation",
    createdAt: "2022-03-02T23:29:04.000Z",
    tags: ["transformers", "pytorch", "onnx", "safetensors", "gpt2"]
  },
  {
    id: "google-bert/bert-base-uncased",
    name: "bert-base-uncased",
    author: "google-bert",
    trendingScore: 123,
    likes: 2870,
    downloads: 58556227,
    pipelineTag: "fill-mask",
    createdAt: "2022-03-02T23:29:04.000Z",
    tags: ["transformers", "pytorch", "bert", "safetensors", "onnx"]
  },
  {
    id: "facebook/bart-base",
    name: "bart-base",
    author: "facebook",
    trendingScore: 121,
    likes: 1350,
    downloads: 24500000,
    pipelineTag: "text2text-generation",
    createdAt: "2022-03-02T23:29:04.000Z",
    tags: ["transformers", "pytorch", "bart", "safetensors", "seq2seq"]
  }
];

export const SEED_HF_TRENDING_MODELS: HFTrendingModel[] = RAW_SEED_HF_TRENDING_MODELS.filter(
  (m) => !isDisallowedHfModel(m)
);
