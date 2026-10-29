import React from 'react';
import { SlideCitationData } from '../../types';
import { FileText, ExternalLink, Sparkles, BookOpen } from 'lucide-react';

interface SlideCitationCardProps {
  data: SlideCitationData;
  onInspectSlide?: (deckTitle: string, slideNumber: number) => void;
}

export const SlideCitationCard: React.FC<SlideCitationCardProps> = ({
  data,
  onInspectSlide,
}) => {
  return (
    <div className="my-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 hover:bg-slate-50 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-blue-700">
            <FileText className="h-3.5 w-3.5" />
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-900">{data.deckTitle}</span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span className="font-mono font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
              Slide {data.slideNumber}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-emerald-600" />
            <span>RAG Match: <span className="font-mono font-semibold text-slate-800">{(data.similarity * 100).toFixed(0)}%</span></span>
          </div>

          <button
            onClick={() => onInspectSlide?.(data.deckTitle, data.slideNumber)}
            className="flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 hover:underline px-1.5 py-0.5 rounded"
          >
            <span>View in Slide Deck</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200/80">
        <span className="font-semibold text-slate-900 block mb-1">
          {data.topic}
        </span>
        <blockquote className="border-l-2 border-blue-400 pl-2.5 text-slate-600 italic">
          "{data.excerpt}"
        </blockquote>
      </div>
    </div>
  );
};
