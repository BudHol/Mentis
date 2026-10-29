import React, { useState } from 'react';
import { FlashcardData } from '../../types';
import { Layers, RotateCw, Check, BookOpen } from 'lucide-react';

interface FlipFlashcardProps {
  data: FlashcardData;
}

export const FlipFlashcard: React.FC<FlipFlashcardProps> = ({ data }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [rating, setRating] = useState<'hard' | 'good' | 'mastered' | null>(null);

  return (
    <div className="my-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-teal-700 uppercase tracking-wide">
              Active Recall Flashcard
            </span>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span>{data.context}</span>
              {data.slideRef && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-slate-600">{data.slideRef}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
        >
          <RotateCw className="h-3 w-3" />
          <span>{isFlipped ? 'Show Prompt' : 'Reveal Concept'}</span>
        </button>
      </div>

      {/* Card Content with flip sensation */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="cursor-pointer min-h-[110px] rounded-lg border border-slate-200/90 bg-gradient-to-b from-slate-50/70 to-slate-100/50 p-4 flex flex-col justify-between hover:border-slate-300 transition-all"
      >
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
            {isFlipped ? 'Answer / Intuitive Model' : 'Recall Challenge'}
          </span>
          <p className="text-sm font-medium text-slate-900 leading-relaxed">
            {isFlipped ? data.back : data.front}
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/60 mt-3">
          <span>Click anywhere to flip card</span>
          <span className="text-slate-500 font-mono">
            {isFlipped ? 'Side B' : 'Side A'}
          </span>
        </div>
      </div>

      {/* Confidence rating strip */}
      {isFlipped && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-slate-600">Rate your recall:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setRating('hard')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                rating === 'hard'
                  ? 'bg-rose-100 text-rose-800 font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Needs Review
            </button>
            <button
              onClick={() => setRating('good')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                rating === 'good'
                  ? 'bg-amber-100 text-amber-800 font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Got It
            </button>
            <button
              onClick={() => setRating('mastered')}
              className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                rating === 'mastered'
                  ? 'bg-emerald-100 text-emerald-800 font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Check className="h-3 w-3" />
              <span>Mastered</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
