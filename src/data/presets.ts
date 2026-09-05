export interface PresetPrompt {
  id: string;
  name: string;
  category: string;
  description: string;
  text: string;
}

export const PRESET_PROMPTS: PresetPrompt[] = [
  {
    id: 'openai-default',
    name: 'Tokenizer Intro',
    category: 'General',
    description: 'The standard text from OpenAI tokenizer documentation',
    text: `Tokenizing text is the process of breaking down a stream of text into smaller chunks, known as tokens. Tokens can be words, characters, or subwords.

In modern LLMs, models don't see text like humans do. Instead, they process sequences of numbers corresponding to entries in a vocabulary table.

Try pasting your prompt here to see how your chosen model slices it!`,
  },
  {
    id: 'python-code',
    name: 'Python Code',
    category: 'Programming',
    description: 'Code with keywords, indentation, variables, and docstrings',
    text: `def quick_sort(arr: list[int]) -> list[int]:
    """Sort an array of integers using the divide-and-conquer strategy."""
    if len(arr) <= 1:
        return arr
    
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    return quick_sort(left) + middle + quick_sort(right)

# Test execution:
sample_data = [64, 34, 25, 12, 22, 11, 90]
sorted_result = quick_sort(sample_data)
print(f"Sorted output: {sorted_result}")`,
  },
  {
    id: 'json-api',
    name: 'JSON Payload',
    category: 'Structured Data',
    description: 'JSON object with nested arrays, booleans, and keys',
    text: `{
  "status": "success",
  "meta": {
    "timestamp": "2026-09-03T10:00:00Z",
    "request_id": "req_8849f2b1a",
    "cached": false
  },
  "data": {
    "user_id": 104928,
    "username": "alex_developer",
    "roles": ["admin", "editor"],
    "preferences": {
      "theme": "dark",
      "notifications_enabled": true,
      "preferred_model": "gpt-4o"
    },
    "token_limit": 128000
  }
}`,
  },
  {
    id: 'multilingual',
    name: 'Multilingual Test',
    category: 'International',
    description: 'Comparison across Japanese, Arabic, German, and Spanish',
    text: `English: Language models process text into subword token units.
Japanese (日本語): 人工知能は自然言語をトークンと呼ばれる最小単位に分割して処理します。
Arabic (العربية): تقوم نماذج الذكاء الاصطناعي بمعالجة النصوص وتقسيمها إلى وحدات نصية.
German (Deutsch): Große Sprachmodelle zerlegen Eingabetexte in Teilwort-Token zur Berechnung.
Spanish (Español): Los modelos de lenguaje convierten el texto en secuencias de tokens.`,
  },
  {
    id: 'math-equations',
    name: 'Math & Formulas',
    category: 'Science',
    description: 'LaTeX expressions, Greek letters, and formulas',
    text: `The normal Gaussian distribution probability density function is given by:

f(x) = (1 / (σ * √(2π))) * exp(- (x - μ)² / (2σ²))

Where:
- μ is the mean / expectation of the distribution
- σ is the standard deviation
- σ² is the variance

Euler's identity: e^(i * π) + 1 = 0`,
  },
  {
    id: 'emojis-unicode',
    name: 'Emojis & Symbols',
    category: 'Unicode',
    description: 'Multi-byte codepoints, compound emojis, and accents',
    text: `Testing multi-byte characters and compound emojis:
🚀 Spaceship
👨‍💻 Technologist (Man + Zero-Width-Joiner + Laptop)
🏳️‍🌈 Rainbow Flag (Flag + ZWJ + Rainbow)
❤️‍🔥 Heart on Fire
Complex scripts: 𝄞 (Musical G Clef), ∑ (Summation), ∞ (Infinity), ⚡️ (High Voltage).
Café, naïve, façade, résumé with combining diacritics.`,
  },
  {
    id: 'system-prompt',
    name: 'AI System Prompt',
    category: 'Prompt Engineering',
    description: 'XML tagged instructions for an LLM agent',
    text: `<system_instructions>
You are an expert AI software architect and technical reviewer.
Follow these strict principles:
1. Prioritize clean, idiomatic, type-safe code.
2. Optimize for readability and algorithmic efficiency.
3. When providing responses, enclose executable code blocks within appropriate triple-backtick markdown fences.

Output format:
<analysis>
Identify performance bottlenecks or edge-case anomalies.
</analysis>

<solution>
Present the refactored architecture with comments explaining key optimizations.
</solution>
</system_instructions>`,
  }
];
