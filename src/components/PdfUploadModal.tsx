import React, { useRef, useState } from 'react';
import { LectureDeck, RagChunk } from '../types';
import { extractPdfChunks } from '../services/ragService';
import { UploadCloud, FileText, X, Sliders, Layers, AlertCircle } from 'lucide-react';

interface PdfUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeckUploaded: (deck: LectureDeck, chunks: RagChunk[]) => void;
  currentCourse: string;
}

export const PdfUploadModal: React.FC<PdfUploadModalProps> = ({
  isOpen,
  onClose,
  onDeckUploaded,
  currentCourse,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [title, setTitle] = useState('');
  const [slideCount, setSlideCount] = useState<number>(0);
  const [chunkSize, setChunkSize] = useState<number>(512);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please choose a PDF file.');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError('This PDF is larger than the 100 MB limit.');
      return;
    }
    setError('');
    setSuccess('');
    setFileName(file.name);
    setIsProcessing(true);
    setProgress(15);

    try {
      const id = `deck-${Date.now()}`;
      const deckInfo = { id, title: title.trim() || file.name.replace(/\.pdf$/i, '') };
      const chunks = await extractPdfChunks(file, deckInfo, chunkSize, setProgress);
      const pages = Math.max(...chunks.map((chunk) => chunk.slideNumber));
      setSlideCount(pages);
      const topics = [...new Set(chunks.flatMap((chunk) => chunk.keywords))].slice(0, 8);
      const newDeck: LectureDeck = {
        id,
        course: currentCourse,
        title: deckInfo.title,
        filename: file.name,
        pages,
        chunkCount: chunks.length,
        uploadedAt: 'Just now',
        summary: chunks.slice(0, 2).map((chunk) => chunk.snippet).join(' '),
        topics,
      };
      onDeckUploaded(newDeck, chunks);
      setIsProcessing(false);
      setProgress(0);
      setSuccess(`Indexed ${pages} pages into ${chunks.length} searchable chunks. This lecture is now available to the tutor.`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'PDF ingestion failed.');
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Ingest Lecture Slides (PDF)
            </h3>
            <p className="text-xs text-slate-500">
              Extract text, chunk pages, and build a browser-local search index
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) {
                void handleFile(file);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleFile(file);
                event.target.value = '';
              }}
            />
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-3">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="text-xs font-semibold text-slate-800">
              Drop lecture PDF or click to browse
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports .pdf slides up to 100MB (PDF.js text parsing)
            </p>
          </div>

          {/* RAG Chunking Settings */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <Sliders className="h-3.5 w-3.5 text-slate-500" />
              <span>RAG Chunking & Ingestion Strategy</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-600 block mb-1">
                  PDF pages
                </label>
                <input
                  type="number"
                  value={slideCount || ''}
                  placeholder="Detected after upload"
                  readOnly
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1">
                  Chunk Token Size
                </label>
                <select
                  value={chunkSize}
                  onChange={(e) => setChunkSize(parseInt(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none"
                >
                  <option value={256}>256 tokens (Slide sentences)</option>
                  <option value={512}>512 tokens (Balanced)</option>
                  <option value={1024}>1024 tokens (Full slide blocks)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
              <Layers className="h-3 w-3 text-emerald-600" />
              <span>Retrieval Engine: Local TF-IDF cosine similarity</span>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Processing progress */}
          {isProcessing && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Extracting text & building search index...</span>
                <span className="font-mono font-medium">{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => success ? onClose() : fileInputRef.current?.click()}
            disabled={isProcessing}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors shadow-xs"
          >
            {isProcessing ? 'Ingesting PDF...' : success ? 'Done' : 'Choose PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};
