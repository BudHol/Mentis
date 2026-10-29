import React from 'react';
import { LectureDeck } from '../types';
import { BookOpen, ExternalLink, FileText, MessageSquare, Trash2, UploadCloud } from 'lucide-react';
import { StoredConversation } from '../services/conversationStore';

interface SidebarProps {
  lectureDecks: LectureDeck[];
  onOpenUpload: () => void;
  onOpenRagInspector: () => void;
  onSelectDeck: (deck: LectureDeck) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  conversations: StoredConversation[];
  activeConversationId: string;
  onSelectConversation: (conversation: StoredConversation) => void;
  onDeleteConversation: (conversation: StoredConversation) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  lectureDecks,
  onOpenUpload,
  onOpenRagInspector,
  onSelectDeck,
  isMobileOpen,
  onCloseMobile,
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
}) => (
  <>
    {isMobileOpen && (
      <div
        onClick={onCloseMobile}
        className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
      />
    )}
    <aside
      className={`fixed md:static inset-y-0 left-0 z-40 w-72 lg:w-80 bg-[#F7F6F2] border-r border-[#E8E5DE] flex flex-col transition-transform duration-200 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      <div className="flex-1 overflow-y-auto px-3.5 py-4">
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-1.5 px-2">
            <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-[11px] font-semibold tracking-wider text-[#687280] uppercase">Recent conversations</span>
          </div>
          {conversations.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-[11px] text-slate-500">
              Your conversations will appear here.
            </p>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group flex items-start gap-1 rounded-lg border px-2 py-2 ${
                    conversation.id === activeConversationId
                      ? 'border-[#DCD8CF] bg-white shadow-xs'
                      : 'border-transparent hover:border-[#E8E5DE] hover:bg-white/80'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectConversation(conversation)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-xs font-semibold text-[#1E232A]">{conversation.title}</span>
                    <span className="mt-0.5 block text-[10px] text-[#687280] font-mono">
                      {new Date(conversation.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteConversation(conversation)}
                    className="mt-0.5 rounded p-1 text-slate-400 opacity-0 transition-opacity hover:bg-white hover:text-red-600 group-hover:opacity-100"
                    aria-label={`Delete ${conversation.title}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-xs font-semibold text-[#1E232A]">Lecture index</span>
          </div>
          <button
            onClick={onOpenRagInspector}
            className="flex items-center gap-1 text-[11px] text-[#8a5a25] hover:text-[#6b431b]"
          >
            Inspect <ExternalLink className="h-2.5 w-2.5" />
          </button>
        </div>

        <div className="space-y-2">
          {lectureDecks.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-[11px] text-slate-500">
              Upload a lecture PDF to build your local study index.
            </p>
          )}
          {lectureDecks.map((deck) => (
            <button
              key={deck.id}
              onClick={() => onSelectDeck(deck)}
              className="w-full text-left group p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300 transition-colors"
            >
              <span className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5 group-hover:text-blue-600" />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium text-slate-800">{deck.title}</span>
                  <span className="block mt-0.5 text-[11px] text-slate-500">
                    {deck.pages} pages · {deck.chunkCount} chunks
                  </span>
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-3.5 border-t border-[#E8E5DE] bg-white/70">
        <button
          onClick={onOpenUpload}
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-[#C58940]/40 bg-[#FBF6EE]/70 hover:bg-[#FBF6EE] text-xs text-[#6b431b] font-semibold"
        >
          <UploadCloud className="h-3.5 w-3.5 text-slate-500" />
          Upload lecture PDF
        </button>
      </div>
    </aside>
  </>
);
