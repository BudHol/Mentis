import React from 'react';
import { Plus } from 'lucide-react';

interface TopBarProps {
  activeTab: 'workspace' | 'library';
  onTabChange: (tab: 'workspace' | 'library') => void;
  onNewSession: () => void;
  onOpenUpload: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onTabChange,
  onNewSession,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 lg:px-8 py-3.5 border-b border-[#E8E5DE] bg-[#FBFBF9]/95 backdrop-blur-xs sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-2 shrink-0">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onTabChange('workspace');
          }}
          className="text-[15px] font-semibold tracking-tight text-[#1E232A] whitespace-nowrap shrink-0 hover:text-[#2D343E] transition-colors flex items-center gap-2"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#1E232A] text-[#FBF6EE] font-serif font-bold text-sm tracking-wide shadow-xs border border-[#2D343E]">
            PT
          </span>
          <span>My Personal Tutor</span>
        </a>
      </div>

      {/* Primary navigation */}
      <nav className="hidden md:flex items-center gap-1.5 bg-[#F6F5F0] p-1 rounded-lg border border-[#E8E5DE]">
        <button
          onClick={() => onTabChange('workspace')}
          className={`px-3 py-1 rounded-md text-xs transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'workspace' ? 'text-[#1E232A] font-semibold bg-white shadow-xs border border-[#E8E5DE]/60' : 'text-[#687280] font-medium hover:text-[#1E232A]'
          }`}
        >
          Workspace
        </button>
        <button
          onClick={() => onTabChange('library')}
          className={`px-3 py-1 rounded-md text-xs transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'library' ? 'text-[#1E232A] font-semibold bg-white shadow-xs border border-[#E8E5DE]/60' : 'text-[#687280] font-medium hover:text-[#1E232A]'
          }`}
        >
          Lecture Library
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onNewSession}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#FBFBF9] bg-[#1E232A] rounded-lg hover:bg-[#2D343E] transition-colors whitespace-nowrap shrink-0 shadow-xs cursor-pointer border border-[#1E232A]"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Session</span>
        </button>
      </div>
    </header>
  );
};
