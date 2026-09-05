import React, { useState } from 'react';
import { Plus, Trash2, MessageSquare, ArrowRight } from 'lucide-react';
import { ChatMessage, ModelDefinition } from '../types';
import { formatChatMessages, tokenizeTiktoken } from '../services/tokenizerEngine';

interface ChatPromptModeProps {
  model: ModelDefinition;
  onApplyChatPrompt: (assembledPrompt: string) => void;
}

export const ChatPromptMode: React.FC<ChatPromptModeProps> = ({
  model,
  onApplyChatPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'system',
      content: 'You are an intelligent code review assistant. Analyze code for bugs, security vulnerabilities, and adherence to clean architecture principles.',
    },
    {
      id: '2',
      role: 'user',
      content: 'Please review this React useEffect hook implementation and explain if there are any potential memory leak issues.',
    },
    {
      id: '3',
      role: 'assistant',
      content: 'I would be glad to help. Please provide the code snippet containing the useEffect hook and any cleanup functions.',
    },
  ]);

  const handleAddMessage = (role: 'system' | 'user' | 'assistant') => {
    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        role,
        content: '',
      },
    ]);
  };

  const handleUpdateMessage = (id: string, content: string) => {
    setMessages(messages.map((m) => (m.id === id ? { ...m, content } : m)));
  };

  const handleUpdateRole = (id: string, role: 'system' | 'user' | 'assistant') => {
    setMessages(messages.map((m) => (m.id === id ? { ...m, role } : m)));
  };

  const handleDeleteMessage = (id: string) => {
    setMessages(messages.filter((m) => m.id !== id));
  };

  // Compute tokens per message and assembled chat prompt
  const assembledPrompt = formatChatMessages(messages);
  const totalChatTokens = model.family === 'openai'
    ? tokenizeTiktoken(assembledPrompt, model).length
    : Math.round(assembledPrompt.length / 4);

  return (
    <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Chat Prompt Formatter & Overhead Calculator
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Calculates actual ChatML tokens including per-message delimiters and primer tokens for {model.name}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-mono text-slate-500">
              Total Chat Tokens: <strong className="text-slate-900 text-sm">{totalChatTokens.toLocaleString()}</strong>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              ~${((totalChatTokens / 1_000_000) * model.costPer1MInput).toFixed(5)} input cost
            </div>
          </div>

          <button
            type="button"
            onClick={() => onApplyChatPrompt(assembledPrompt)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <span>Open in Visualizer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-3">
        {messages.map((msg, index) => {
          const msgTokens = model.family === 'openai'
            ? tokenizeTiktoken(msg.content, model).length
            : Math.round(msg.content.length / 4);

          return (
            <div
              key={msg.id}
              className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2 transition-colors hover:border-slate-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <select
                    value={msg.role}
                    onChange={(e) => handleUpdateRole(msg.id, e.target.value as any)}
                    className="text-xs font-bold uppercase rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="system">System</option>
                    <option value="user">User</option>
                    <option value="assistant">Assistant</option>
                  </select>
                  <span className="text-[11px] font-mono text-slate-400">
                    Message #{index + 1}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-slate-500">
                    {msgTokens} tokens ({msg.content.length} chars)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="Remove message"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <textarea
                value={msg.content}
                onChange={(e) => handleUpdateMessage(msg.id, e.target.value)}
                placeholder={`Enter ${msg.role} message content...`}
                rows={2}
                className="w-full p-2.5 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-y text-slate-800"
              />
            </div>
          );
        })}
      </div>

      {/* Add message buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => handleAddMessage('user')}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 text-blue-600" />
          <span>Add User Message</span>
        </button>
        <button
          type="button"
          onClick={() => handleAddMessage('assistant')}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 text-sky-600" />
          <span>Add Assistant Message</span>
        </button>
        <button
          type="button"
          onClick={() => handleAddMessage('system')}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 text-amber-600" />
          <span>Add System Message</span>
        </button>
      </div>
    </div>
  );
};
