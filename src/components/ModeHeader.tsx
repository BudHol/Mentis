import React from 'react';
import { Sparkles, Brain } from 'lucide-react';
import { TutorMode } from '../types';

interface ModeHeaderProps {
  currentMode: TutorMode;
  activeDeckTitle?: string;
  onModeChange: (mode: TutorMode) => void;
  onOpenRag: () => void;
  onToggleMobileSidebar: () => void;
}

export const ModeHeader: React.FC<ModeHeaderProps> = ({
  currentMode,
  activeDeckTitle,
  onModeChange,
  onOpenRag,
  onToggleMobileSidebar,
}) => {
  return (
    <div className="h-14 shrink-0 border-b border-[#E8E5DE] bg-[#FBFBF9]/95 px-6 lg:px-8 py-3 backdrop-blur">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Mobile sidebar toggle + Mode Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            <Brain className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#1E232A]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#C58940]" />
            <span>Interaction style</span>
          </div>
          <div className="flex rounded-lg border border-[#E8E5DE] bg-[#F6F5F0] p-0.5 shadow-2xs" role="group" aria-label="Interaction style">
            {([
              ['socratic', 'Socratic'],
              ['assistant', 'Personal assistant'],
            ] as const).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => onModeChange(mode)}
                aria-pressed={currentMode === mode}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  currentMode === mode
                    ? 'bg-white text-[#6b431b] shadow-sm border border-[#EED9BE]/70 font-semibold'
                    : 'text-[#687280] hover:text-[#1E232A]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Mode Strategy & Socratic Breakdown */}
        <div className="flex items-center gap-3 text-xs">
          {/* RAG Context Quick Link */}
          <button
            onClick={onOpenRag}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#1E232A] bg-white hover:bg-[#F6F5F0] border border-[#E8E5DE] rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#8a5a25]" />
            <span className="hidden sm:inline font-semibold text-[11px]">RAG Slides:</span>
            <span className="font-mono text-[#687280] italic truncate max-w-[140px]">
              {activeDeckTitle ? activeDeckTitle.split(':')[0] : 'No lecture selected'}
            </span>
          </button>
        </div>
      </div>

    </div>
  );
};
