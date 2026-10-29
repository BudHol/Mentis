import React, { useState } from 'react';
import { McqData } from '../../types';
import { HelpCircle, CheckCircle2, XCircle, RotateCcw, Lightbulb, ArrowRight } from 'lucide-react';

interface ConceptCheckCardProps {
  data: McqData;
}

export const ConceptCheckCard: React.FC<ConceptCheckCardProps> = ({ data }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const selectedOption = data.options.find((opt) => opt.id === selectedId);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setIsAnswered(true);
  };

  const handleReset = () => {
    setSelectedId(null);
    setIsAnswered(false);
    setShowHint(false);
  };

  return (
    <div className="my-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
            <HelpCircle className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
              Socratic Concept Check
            </span>
            <h4 className="text-sm font-medium text-slate-900 mt-0.5">
              {data.question}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAnswered && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {data.options.map((option, idx) => {
          const isSelected = selectedId === option.id;
          const letter = String.fromCharCode(65 + idx); // A, B, C...

          let stateStyles = 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white';
          if (isAnswered) {
            if (isSelected) {
              stateStyles = option.isCorrect
                ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950 font-medium'
                : 'border-rose-400 bg-rose-50/40 text-rose-950';
            } else if (option.isCorrect) {
              stateStyles = 'border-emerald-300 bg-emerald-50/20 text-emerald-900';
            } else {
              stateStyles = 'border-slate-200 opacity-60 bg-slate-50/40';
            }
          }

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={isAnswered}
              className={`w-full text-left p-3 rounded-lg border transition-all text-xs flex items-start gap-3 ${stateStyles}`}
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-semibold border ${
                isSelected && option.isCorrect
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : isSelected && !option.isCorrect
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {letter}
              </span>
              <span className="flex-1 leading-relaxed text-slate-800">
                {option.text}
              </span>
              {isAnswered && isSelected && (
                option.isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                )
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback Panel */}
      {isAnswered && selectedOption && (
        <div className={`mt-3 p-3.5 rounded-lg text-xs leading-relaxed border ${
          selectedOption.isCorrect
            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
            : 'bg-amber-50/60 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-start gap-2">
            {selectedOption.isCorrect ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <span className="font-semibold block">
                {selectedOption.isCorrect ? 'Insight Verified:' : 'Misconception Check:'}
              </span>
              <p>{selectedOption.feedback}</p>
            </div>
          </div>

          {/* Socratic follow-up */}
          {data.socraticFollowUp && selectedOption.isCorrect && (
            <div className="mt-3 pt-2.5 border-t border-emerald-200/60 text-emerald-950 flex items-start gap-2">
              <ArrowRight className="h-3.5 w-3.5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Next Socratic Step:</span>{' '}
                <span>{data.socraticFollowUp}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
