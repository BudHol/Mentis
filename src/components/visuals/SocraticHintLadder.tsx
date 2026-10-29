import React, { useState } from 'react';
import { HintLadderData } from '../../types';
import { Compass, ChevronDown, ChevronUp, Sparkles, CheckCircle } from 'lucide-react';

interface SocraticHintLadderProps {
  data: HintLadderData;
}

export const SocraticHintLadder: React.FC<SocraticHintLadderProps> = ({ data }) => {
  const [unlockedLevel, setUnlockedLevel] = useState<number>(1);
  const [showInsight, setShowInsight] = useState<boolean>(false);

  const handleUnlockNext = () => {
    if (unlockedLevel < data.hints.length) {
      setUnlockedLevel((prev) => prev + 1);
    } else {
      setShowInsight(true);
    }
  };

  return (
    <div className="my-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
              Socratic Hint Ladder
            </span>
            <h4 className="text-sm font-medium text-slate-900 mt-0.5">
              {data.title}
            </h4>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Unlocked {Math.min(unlockedLevel, data.hints.length)}/{data.hints.length} hints
        </div>
      </div>

      <div className="mb-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-700 border border-slate-200/80">
        <span className="font-semibold text-slate-900">Problem Core: </span>
        {data.coreQuestion}
      </div>

      {/* Hints List */}
      <div className="space-y-2.5">
        {data.hints.map((hint, idx) => {
          const isUnlocked = idx < unlockedLevel;
          const isCurrentTarget = idx === unlockedLevel - 1;

          return (
            <div
              key={hint.level}
              className={`rounded-lg border p-3 transition-all ${
                isUnlocked
                  ? 'border-amber-200/80 bg-amber-50/30 text-slate-900'
                  : 'border-slate-200 bg-slate-50/50 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded text-[11px] font-mono font-bold ${
                      isUnlocked
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {hint.level}
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {hint.label}
                  </span>
                </div>
                {isUnlocked && (
                  <span className="text-[10px] text-amber-700 font-medium">
                    Unlocked
                  </span>
                )}
              </div>

              {isUnlocked ? (
                <p className="text-xs text-slate-700 leading-relaxed mt-1.5 pl-7">
                  {hint.content}
                </p>
              ) : (
                <div className="text-[11px] text-slate-400 pl-7 italic">
                  Tier {hint.level} locked — attempt with previous hint first
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Unlock Next Tier CTA */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          {!showInsight && unlockedLevel <= data.hints.length && (
            <span>Try to solve it with current hints before revealing more.</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unlockedLevel < data.hints.length && (
            <button
              onClick={handleUnlockNext}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-700" />
              <span>Reveal Next Hint (Tier {unlockedLevel + 1})</span>
            </button>
          )}

          {unlockedLevel === data.hints.length && !showInsight && (
            <button
              onClick={() => setShowInsight(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
            >
              <CheckCircle className="h-3.5 w-3.5 text-emerald-700" />
              <span>Verify Final Socratic Insight</span>
            </button>
          )}
        </div>
      </div>

      {/* Final insight revealed */}
      {showInsight && (
        <div className="mt-3 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
          <span className="font-semibold block mb-1">Synthesized Solution & Intuition:</span>
          <p className="leading-relaxed">{data.finalInsight}</p>
        </div>
      )}
    </div>
  );
};
