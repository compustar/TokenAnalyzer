import { ColorTheme } from '../types';

export interface TokenColorStyle {
  bg: string;
  text: string;
  border: string;
  hover: string;
  active: string;
}

// OpenAI & Professional Polish Tokenizer 10-Color Rotating Palette
const OPENAI_COLORS: TokenColorStyle[] = [
  { bg: 'bg-blue-100 text-blue-900 border-b-2 border-blue-300', text: 'text-blue-900', border: 'border-blue-300', hover: 'hover:bg-blue-200', active: 'ring-2 ring-blue-500' },
  { bg: 'bg-emerald-100 text-emerald-900 border-b-2 border-emerald-300', text: 'text-emerald-900', border: 'border-emerald-300', hover: 'hover:bg-emerald-200', active: 'ring-2 ring-emerald-500' },
  { bg: 'bg-amber-100 text-amber-900 border-b-2 border-amber-300', text: 'text-amber-900', border: 'border-amber-300', hover: 'hover:bg-amber-200', active: 'ring-2 ring-amber-500' },
  { bg: 'bg-purple-100 text-purple-900 border-b-2 border-purple-300', text: 'text-purple-900', border: 'border-purple-300', hover: 'hover:bg-purple-200', active: 'ring-2 ring-purple-500' },
  { bg: 'bg-rose-100 text-rose-900 border-b-2 border-rose-300', text: 'text-rose-900', border: 'border-rose-300', hover: 'hover:bg-rose-200', active: 'ring-2 ring-rose-500' },
  { bg: 'bg-indigo-100 text-indigo-900 border-b-2 border-indigo-300', text: 'text-indigo-900', border: 'border-indigo-300', hover: 'hover:bg-indigo-200', active: 'ring-2 ring-indigo-500' },
  { bg: 'bg-sky-100 text-sky-900 border-b-2 border-sky-300', text: 'text-sky-900', border: 'border-sky-300', hover: 'hover:bg-sky-200', active: 'ring-2 ring-sky-500' },
  { bg: 'bg-lime-100 text-lime-900 border-b-2 border-lime-300', text: 'text-lime-900', border: 'border-lime-300', hover: 'hover:bg-lime-200', active: 'ring-2 ring-lime-500' },
  { bg: 'bg-orange-100 text-orange-900 border-b-2 border-orange-300', text: 'text-orange-900', border: 'border-orange-300', hover: 'hover:bg-orange-200', active: 'ring-2 ring-orange-500' },
  { bg: 'bg-teal-100 text-teal-900 border-b-2 border-teal-300', text: 'text-teal-900', border: 'border-teal-300', hover: 'hover:bg-teal-200', active: 'ring-2 ring-teal-500' },
];

const VIVID_COLORS: TokenColorStyle[] = [
  { bg: 'bg-cyan-200 text-cyan-950 border-b-2 border-cyan-400', text: 'text-cyan-950', border: 'border-cyan-400', hover: 'hover:bg-cyan-300', active: 'ring-2 ring-cyan-600' },
  { bg: 'bg-yellow-200 text-yellow-950 border-b-2 border-yellow-400', text: 'text-yellow-950', border: 'border-yellow-400', hover: 'hover:bg-yellow-300', active: 'ring-2 ring-yellow-600' },
  { bg: 'bg-pink-200 text-pink-950 border-b-2 border-pink-400', text: 'text-pink-950', border: 'border-pink-400', hover: 'hover:bg-pink-300', active: 'ring-2 ring-pink-600' },
  { bg: 'bg-green-200 text-green-950 border-b-2 border-green-400', text: 'text-green-950', border: 'border-green-400', hover: 'hover:bg-green-300', active: 'ring-2 ring-green-600' },
  { bg: 'bg-violet-200 text-violet-950 border-b-2 border-violet-400', text: 'text-violet-950', border: 'border-violet-400', hover: 'hover:bg-violet-300', active: 'ring-2 ring-violet-600' },
  { bg: 'bg-red-200 text-red-950 border-b-2 border-red-400', text: 'text-red-950', border: 'border-red-400', hover: 'hover:bg-red-300', active: 'ring-2 ring-red-600' },
  { bg: 'bg-blue-200 text-blue-950 border-b-2 border-blue-400', text: 'text-blue-950', border: 'border-blue-400', hover: 'hover:bg-blue-300', active: 'ring-2 ring-blue-600' },
  { bg: 'bg-amber-200 text-amber-950 border-b-2 border-amber-400', text: 'text-amber-950', border: 'border-amber-400', hover: 'hover:bg-amber-300', active: 'ring-2 ring-amber-600' },
  { bg: 'bg-emerald-200 text-emerald-950 border-b-2 border-emerald-400', text: 'text-emerald-950', border: 'border-emerald-400', hover: 'hover:bg-emerald-300', active: 'ring-2 ring-emerald-600' },
  { bg: 'bg-purple-200 text-purple-950 border-b-2 border-purple-400', text: 'text-purple-950', border: 'border-purple-400', hover: 'hover:bg-purple-300', active: 'ring-2 ring-purple-600' },
];

const TERMINAL_COLORS: TokenColorStyle[] = [
  { bg: 'bg-slate-900 text-blue-300 border-b-2 border-blue-500', text: 'text-blue-300', border: 'border-blue-500', hover: 'hover:bg-slate-800', active: 'ring-2 ring-blue-400' },
  { bg: 'bg-slate-900 text-emerald-300 border-b-2 border-emerald-500', text: 'text-emerald-300', border: 'border-emerald-500', hover: 'hover:bg-slate-800', active: 'ring-2 ring-emerald-400' },
  { bg: 'bg-slate-900 text-amber-300 border-b-2 border-amber-500', text: 'text-amber-300', border: 'border-amber-500', hover: 'hover:bg-slate-800', active: 'ring-2 ring-amber-400' },
  { bg: 'bg-slate-900 text-purple-300 border-b-2 border-purple-500', text: 'text-purple-300', border: 'border-purple-500', hover: 'hover:bg-slate-800', active: 'ring-2 ring-purple-400' },
  { bg: 'bg-slate-900 text-sky-300 border-b-2 border-sky-500', text: 'text-sky-300', border: 'border-sky-500', hover: 'hover:bg-slate-800', active: 'ring-2 ring-sky-400' },
  { bg: 'bg-slate-900 text-teal-300 border-b-2 border-teal-500', text: 'text-teal-300', border: 'border-teal-500', hover: 'hover:bg-slate-800', active: 'ring-2 ring-teal-400' },
  { bg: 'bg-slate-900 text-indigo-300 border-b-2 border-indigo-500', text: 'text-indigo-300', border: 'border-indigo-500', hover: 'hover:bg-slate-800', active: 'ring-2 ring-indigo-400' },
  { bg: 'bg-slate-900 text-rose-300 border-b-2 border-rose-500', text: 'text-rose-300', border: 'border-rose-500', hover: 'hover:bg-slate-800', active: 'ring-2 ring-rose-400' },
  { bg: 'bg-slate-900 text-lime-300 border-b-2 border-lime-500', text: 'text-lime-300', border: 'border-lime-500', hover: 'hover:bg-slate-800', active: 'ring-2 ring-lime-400' },
  { bg: 'bg-slate-900 text-orange-300 border-b-2 border-orange-500', text: 'text-orange-300', border: 'border-orange-500', hover: 'hover:bg-slate-800', active: 'ring-2 ring-orange-400' },
];

const SUBTLE_COLORS: TokenColorStyle[] = [
  { bg: 'bg-slate-100 text-slate-900 border-b-2 border-slate-300', text: 'text-slate-900', border: 'border-slate-300', hover: 'hover:bg-slate-200', active: 'ring-2 ring-slate-500' },
  { bg: 'bg-gray-100 text-gray-900 border-b-2 border-gray-300', text: 'text-gray-900', border: 'border-gray-300', hover: 'hover:bg-gray-200', active: 'ring-2 ring-gray-500' },
  { bg: 'bg-zinc-100 text-zinc-900 border-b-2 border-zinc-300', text: 'text-zinc-900', border: 'border-zinc-300', hover: 'hover:bg-zinc-200', active: 'ring-2 ring-zinc-500' },
  { bg: 'bg-neutral-100 text-neutral-900 border-b-2 border-neutral-300', text: 'text-neutral-900', border: 'border-neutral-300', hover: 'hover:bg-neutral-200', active: 'ring-2 ring-neutral-500' },
  { bg: 'bg-stone-100 text-stone-900 border-b-2 border-stone-300', text: 'text-stone-900', border: 'border-stone-300', hover: 'hover:bg-stone-200', active: 'ring-2 ring-stone-500' },
];

export function getTokenColor(index: number, theme: ColorTheme = 'openai'): TokenColorStyle {
  let palette = OPENAI_COLORS;
  if (theme === 'vivid') palette = VIVID_COLORS;
  if (theme === 'terminal') palette = TERMINAL_COLORS;
  if (theme === 'subtle') palette = SUBTLE_COLORS;

  return palette[index % palette.length];
}
