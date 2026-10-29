import React, { useState } from 'react';
import { LectureDeck } from '../../types';
import {
  BookOpen,
  FileText,
  UploadCloud,
  Search,
  Sparkles,
  ExternalLink,
  Layers,
  CheckCircle,
} from 'lucide-react';

interface LectureLibraryViewProps {
  decks: LectureDeck[];
  onOpenUpload: () => void;
  onOpenRagInspector: () => void;
  onSelectDeck: (deck: LectureDeck) => void;
}

export const LectureLibraryView: React.FC<LectureLibraryViewProps> = ({
  decks,
  onOpenUpload,
  onOpenRagInspector,
  onSelectDeck,
}) => {
  const [search, setSearch] = useState('');

  const filteredDecks = decks.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.topics.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const totalSlides = decks.reduce((acc, d) => acc + d.pages, 0);
  const totalChunks = decks.reduce((acc, d) => acc + d.chunkCount, 0);

  return (
    <div className="flex-1 overflow-y-auto bg-[#FBFBF9] notebook-rule p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">
              Lecture Library
            </h2>
            <p className="text-xs md:text-sm text-slate-600 mt-1">
              Your indexed lecture notes, ready for local retrieval and focused study.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenRagInspector}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <span>Inspect index</span>
            </button>
            <button
              onClick={onOpenUpload}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Upload PDF</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-[#E8E5DE] bg-white p-4 shadow-2xs">
            <span className="text-[11px] font-mono text-slate-500 uppercase">
              Ingested Decks
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {decks.length} Decks
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Across 3 active courses
            </div>
          </div>

          <div className="rounded-xl border border-[#E8E5DE] bg-white p-4 shadow-2xs">
            <span className="text-[11px] font-mono text-slate-500 uppercase">
              Parsed Slides
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {totalSlides} Pages
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Text & diagram metadata
            </div>
          </div>

          <div className="rounded-xl border border-[#E8E5DE] bg-white p-4 shadow-2xs">
            <span className="text-[11px] font-mono text-slate-500 uppercase">
              RAG Vector Chunks
            </span>
            <div className="text-2xl font-bold text-blue-700 mt-1">
              {totalChunks} Chunks
            </div>
            <div className="text-xs text-slate-500 mt-1">
              In-memory cosine similarity
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search slides by title, topic, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs md:text-sm bg-white border border-[#E8E5DE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C58940] shadow-2xs"
          />
        </div>

        {/* Decks Grid */}
        <div className="space-y-4">
          {filteredDecks.map((deck) => (
            <div
              key={deck.id}
              className="rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-all shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                        {deck.course}
                      </span>
                      <span className="text-xs text-slate-500">
                        Uploaded {deck.uploadedAt}
                      </span>
                    </div>
                    <h3 className="text-sm md:text-base font-semibold text-slate-900 mt-1">
                      {deck.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {deck.summary}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-end gap-2 shrink-0">
                  <button
                    onClick={() => {
                      onSelectDeck(deck);
                      onOpenRagInspector();
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Chunks</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Topics & Chunk Count Bar */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Indexed Topics:</span>
                  {deck.topics.map((t) => (
                    <span
                      key={t}
                      className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
                  <span>{deck.pages} Slides</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-slate-800">
                    {deck.chunkCount} Chunks
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
