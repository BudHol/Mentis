import React, { useState } from 'react';
import { LectureDeck, RagChunk } from '../types';
import { X, Search, FileText, CheckCircle2, Sparkles, Filter, ChevronRight } from 'lucide-react';

interface RagInspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  decks: LectureDeck[];
  chunks: RagChunk[];
  activeSlideRef?: { deckTitle: string; slideNumber: number } | null;
}

export const RagInspectorDrawer: React.FC<RagInspectorDrawerProps> = ({
  isOpen,
  onClose,
  decks,
  chunks,
  activeSlideRef,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeckId, setSelectedDeckId] = useState<string>('all');

  if (!isOpen) return null;

  const filteredChunks = chunks.filter((chunk) => {
    const matchesSearch =
      searchTerm === '' ||
      chunk.snippet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chunk.keywords.some((k) => k.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDeck =
      selectedDeckId === 'all' || chunk.deckId === selectedDeckId;
    return matchesSearch && matchesDeck;
  });

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Lecture RAG Context Inspector
            </h3>
            <p className="text-xs text-slate-500">
              Local TF-IDF vectors & cosine retrieval
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Target Focus Notice if opened from citation */}
      {activeSlideRef && (
        <div className="px-5 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900">
          <span className="font-medium">
            Inspecting {activeSlideRef.deckTitle} (Slide {activeSlideRef.slideNumber})
          </span>
          <span className="font-mono text-[11px] text-blue-700 font-semibold">
            Active Ref
          </span>
        </div>
      )}

      {/* Search and Deck Filter */}
      <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search retrieved slide chunks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedDeckId}
            onChange={(e) => setSelectedDeckId(e.target.value)}
            className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="all">All Ingested Slide Decks</option>
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.title} ({deck.chunkCount} chunks)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chunks List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>{filteredChunks.length} chunks retrieved</span>
          <span className="font-mono text-[11px]">Index: browser-local TF-IDF</span>
        </div>

        {filteredChunks.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No matching chunks found in the current vector store.
          </div>
        ) : (
          filteredChunks.map((chunk) => {
            const isTarget =
              activeSlideRef &&
              activeSlideRef.slideNumber === chunk.slideNumber;

            return (
              <div
                key={chunk.id}
                className={`p-3.5 rounded-xl border transition-all text-xs ${
                  isTarget
                    ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-400/40'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 font-medium text-slate-900 truncate">
                    <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{chunk.lectureTitle}</span>
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60 shrink-0">
                    Slide {chunk.slideNumber}
                  </span>
                </div>

                <p className="text-slate-700 leading-relaxed font-sans bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {chunk.snippet}
                </p>

                {/* Similarity & Keywords */}
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <span>Cosine Sim:</span>
                    <span className="font-mono font-semibold text-emerald-700">
                      {(chunk.similarityScore * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {chunk.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Drawer Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          <span>Local retrieval index active</span>
        </span>
        <button
          onClick={onClose}
          className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors"
        >
          Close Inspector
        </button>
      </div>
    </div>
  );
};
