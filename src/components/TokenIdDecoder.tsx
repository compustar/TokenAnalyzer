import React, { useState } from 'react';
import { Binary, ArrowRight, Copy, Check, RefreshCw } from 'lucide-react';
import { ModelDefinition } from '../types';
import { decodeTokenIds } from '../services/tokenizerEngine';

interface TokenIdDecoderProps {
  model: ModelDefinition;
  onApplyDecodedText: (text: string) => void;
}

export const TokenIdDecoder: React.FC<TokenIdDecoderProps> = ({
  model,
  onApplyDecodedText,
}) => {
  const [idsInput, setIdsInput] = useState('9906, 1917, 311, 271, 10242, 6088');
  const [decodedResult, setDecodedResult] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDecode = async () => {
    setError(null);
    try {
      const cleaned = idsInput.replace(/[\[\]]/g, ' ');
      const tokens = cleaned
        .split(/[\s,]+/)
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => {
          const num = Number(s);
          if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
            throw new Error(`Invalid token ID: "${s}" is not a positive integer.`);
          }
          return num;
        });

      if (tokens.length === 0) {
        setDecodedResult('');
        return;
      }

      setIsDecoding(true);
      const text = await decodeTokenIds(tokens, model);
      setDecodedResult(text);
    } catch (err: any) {
      setError(err.message || 'Failed to decode tokens');
      setDecodedResult('');
    } finally {
      setIsDecoding(false);
    }
  };

  const handleCopyDecoded = () => {
    navigator.clipboard.writeText(decodedResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLoadSample = (sampleIds: number[]) => {
    setIdsInput(sampleIds.join(', '));
  };

  return (
    <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Binary className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Token IDs to Text (Reverse Decoder)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter a sequence of token ID numbers to decode them back into raw text using {model.name}.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400">Samples:</span>
          <button
            type="button"
            onClick={() => handleLoadSample([15339, 1917, 311, 279, 1968])}
            className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] transition-colors"
          >
            "Tokenizing text..."
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample([1150, 4832, 11, 31346, 0])}
            className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] transition-colors"
          >
            "Hello, world!"
          </button>
        </div>
      </div>

      {/* Input / Output Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Token IDs Input */}
        <div className="flex flex-col space-y-2">
          <label htmlFor="token-ids-input-area" className="text-xs font-medium text-slate-700">
            Raw Token IDs (comma, space, or JSON array format):
          </label>
          <textarea
            id="token-ids-input-area"
            value={idsInput}
            onChange={(e) => setIdsInput(e.target.value)}
            placeholder="e.g. 15339, 1917, 311, 279, 1968"
            className="w-full h-44 p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <button
            type="button"
            onClick={handleDecode}
            disabled={isDecoding || !idsInput.trim()}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isDecoding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
            <span>Decode Token IDs to Text</span>
          </button>
        </div>

        {/* Reconstructed Decoded Output */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700">
              Decoded Output String:
            </span>
            {decodedResult && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyDecoded}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
                <button
                  type="button"
                  onClick={() => onApplyDecodedText(decodedResult)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-medium"
                >
                  <span>Load into Visualizer</span>
                </button>
              </div>
            )}
          </div>

          <div className="w-full h-44 p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg overflow-y-auto whitespace-pre-wrap">
            {error ? (
              <div className="text-rose-600 font-sans text-xs p-2 bg-rose-50 rounded-lg border border-rose-200">
                {error}
              </div>
            ) : decodedResult ? (
              <span className="text-slate-900">{decodedResult}</span>
            ) : (
              <span className="text-slate-400 font-sans">
                Click "Decode Token IDs to Text" to see the reconstructed output here.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
