import React from 'react';
import {
  Gauge,
  CheckCircle2,
  AlertTriangle,
  PieChart
} from 'lucide-react';
import { TokenizationStats, ModelDefinition } from '../types';

interface AnalyticsPanelProps {
  stats: TokenizationStats;
  model: ModelDefinition;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ stats, model }) => {
  const remainingContext = Math.max(0, model.contextWindow - stats.tokenCount);
  const isContextNearLimit = stats.contextPercentage > 85;

  return (
    <div className="space-y-4">
      {/* Context Window Capacity Gauge */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Context Window Headroom
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-slate-800">
              {stats.contextPercentage}% of {(model.contextWindow / 1000).toFixed(0)}k limit
            </span>
          </div>

          {/* Visual Bar */}
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200 mt-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isContextNearLimit
                  ? 'bg-rose-500'
                  : stats.contextPercentage > 50
                  ? 'bg-amber-500'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${Math.max(stats.tokenCount > 0 ? 1 : 0, Math.min(100, stats.contextPercentage))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono">
            <span>Used: {stats.tokenCount.toLocaleString()} tokens</span>
            <span>Remaining: {remainingContext.toLocaleString()} tokens</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
          {isContextNearLimit ? (
            <div className="flex items-center gap-1.5 text-rose-600 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Approaching model context limit. Consider truncating or summarizing.</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Plenty of context capacity remaining for prompt completion and multi-turn history.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Token Subword Length Distribution */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Subword Length Distribution
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {stats.tokenCount} tokens segmented
          </span>
        </div>

        {/* Multi-segment stacked distribution bar with crisp dividers */}
        <div className="w-full h-3.5 rounded-full overflow-hidden flex divide-x divide-white/60 bg-slate-100 border border-slate-200 mb-3 shadow-inner">
          {stats.distribution.map((bucket, idx) => {
            if (bucket.percentage === 0) return null;
            // Explicit high-contrast palette:
            // 1 char: Royal Blue (bg-blue-600)
            // 2 chars: Warm Amber (bg-amber-500) - high contrast against blue
            // 3-4 chars: Deep Violet (bg-violet-600) - high contrast against amber
            // 5-8 chars: Emerald Green (bg-emerald-500) - high contrast against violet
            // 9+ chars: Rose Crimson (bg-rose-500) - high contrast against green
            // Whitespace: Slate Gray (bg-slate-400) - neutral space indicator
            const distinctColors: Record<string, string> = {
              '1 char': 'bg-blue-600',
              '2 chars': 'bg-amber-500',
              '3-4 chars': 'bg-violet-600',
              '5-8 chars': 'bg-emerald-500',
              '9+ chars': 'bg-rose-500',
              'Whitespace': 'bg-slate-400',
            };
            const fallbackColors = [
              'bg-blue-600',
              'bg-amber-500',
              'bg-violet-600',
              'bg-emerald-500',
              'bg-rose-500',
              'bg-slate-400',
            ];
            const colorClass = distinctColors[bucket.range] || fallbackColors[idx % fallbackColors.length];

            return (
              <div
                key={bucket.range}
                className={`${colorClass} h-full transition-all`}
                style={{ width: `${bucket.percentage}%` }}
                title={`${bucket.range}: ${bucket.count} tokens (${bucket.percentage}%)`}
              />
            );
          })}
        </div>

        {/* Legend grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {stats.distribution.map((bucket, idx) => {
            const distinctDots: Record<string, string> = {
              '1 char': 'bg-blue-600',
              '2 chars': 'bg-amber-500',
              '3-4 chars': 'bg-violet-600',
              '5-8 chars': 'bg-emerald-500',
              '9+ chars': 'bg-rose-500',
              'Whitespace': 'bg-slate-400',
            };
            const fallbackDots = [
              'bg-blue-600',
              'bg-amber-500',
              'bg-violet-600',
              'bg-emerald-500',
              'bg-rose-500',
              'bg-slate-400',
            ];
            const dotClass = distinctDots[bucket.range] || fallbackDots[idx % fallbackDots.length];

            return (
              <div key={bucket.range} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${dotClass} shrink-0 shadow-2xs`} />
                  <span className="text-[11px] font-medium text-slate-700">{bucket.range}</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xs font-bold font-mono text-slate-900">{bucket.count}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{bucket.percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
