import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, TutorMode } from '../types';
import { DocumentExportKind } from '../services/docxExportService';
import { LossLandscapeDiagram } from './visuals/LossLandscapeDiagram';
import { ConceptCheckCard } from './visuals/ConceptCheckCard';
import { FlipFlashcard } from './visuals/FlipFlashcard';
import { SocraticHintLadder } from './visuals/SocraticHintLadder';
import { SlideCitationCard } from './visuals/SlideCitationCard';
import { CodeSandboxBlock } from './visuals/CodeSandboxBlock';
import { NeuralFlowVisualizer } from './visuals/NeuralFlowVisualizer';
import { ConceptDiagram } from './visuals/ConceptDiagram';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Lightbulb,
  CheckCircle,
  HelpCircle,
  RotateCcw,
  Layers,
  ArrowUp,
  FileQuestion,
} from 'lucide-react';

interface ChatAreaProps {
  messages: Message[];
  currentMode: TutorMode;
  onSendMessage: (text: string) => void;
  isGenerating: boolean;
  onInspectSlide?: (deckTitle: string, slideNumber: number) => void;
  onVisualizeMessage: (message: Message, userPrompt: string) => void;
  visualizingMessageId?: string | null;
  onCreateDocument: (kind: DocumentExportKind) => Promise<void>;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  currentMode,
  onSendMessage,
  isGenerating,
  onInspectSlide,
  onVisualizeMessage,
  visualizingMessageId,
  onCreateDocument,
}) => {
  const [inputText, setInputText] = useState('');
  const [thinkingStep, setThinkingStep] = useState(0);
  const [isDocumentMenuOpen, setIsDocumentMenuOpen] = useState(false);
  const [documentAction, setDocumentAction] = useState<DocumentExportKind | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  useEffect(() => {
    if (!isGenerating) {
      setThinkingStep(0);
      return;
    }

    setThinkingStep(0);
    const interval = window.setInterval(() => {
      setThinkingStep((step) => step + 1);
    }, 1800);

    return () => window.clearInterval(interval);
  }, [isGenerating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleDocumentAction = async (kind: DocumentExportKind) => {
    setDocumentAction(kind);
    setIsDocumentMenuOpen(false);
    setDocumentError(null);
    try {
      await onCreateDocument(kind);
    } catch (error) {
      setDocumentError(error instanceof Error ? error.message : 'The document could not be created.');
    } finally {
      setDocumentAction(null);
    }
  };

  const samplePrompts = [
    'What is this lecture about?',
    'Explain the main idea in simple terms.',
    'Quiz me on this lecture.',
  ];
  const thinkingMessages = [
    'Reading your question carefully…',
    'Identifying the key idea behind your question…',
    'Checking the relevant lecture context…',
    'Planning a useful Socratic next step…',
    'Evaluating the clearest way to explain it…',
    'Organizing the response for you…',
  ];
  const latestAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant' && message.text.trim());
  const latestUserPrompt = latestAssistantMessage
    ? [...messages]
        .slice(0, messages.indexOf(latestAssistantMessage))
        .reverse()
        .find((message) => message.role === 'user')?.text || ''
    : '';

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FBFBF9] overflow-hidden">
      {/* Scrollable Messages Stream */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 notebook-rule space-y-6">
        {messages.map((message, messageIndex) => {
          const isUser = message.role === 'user';
          const isPendingAssistant =
            !isUser && isGenerating && messageIndex === messages.length - 1;

          return (
            <div
              key={message.id}
              className={`flex gap-3 max-w-4xl mx-auto ${
                isUser ? 'justify-end' : 'justify-start'
              }`}
            >
              {!isUser && (
                <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg bg-[#1E232A] text-[#FBF6EE] font-serif font-bold text-xs shadow-xs mt-0.5 border border-[#2D343E]">
                  PT
                </div>
              )}

              <div
                className={`flex-1 max-w-3xl rounded-2xl p-4 md:p-5 shadow-xs transition-all ${
                  isUser
                    ? 'bg-[#1E232A] text-[#FBF6EE] rounded-tr-xs'
                    : 'bg-white border border-[#E8E5DE] text-[#1E232A] rounded-tl-xs'
                }`}
              >
                {/* Assistant Metadata Header */}
                {!isUser && (
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E5DE] pb-2 mb-3 text-xs text-[#687280]">
                    <div className="flex items-center gap-2">
                      <span                       className="font-semibold text-[#1E232A] font-serif">
                        {message.mode === 'socratic' ? 'Socratic AI Tutor' : 'Personal Assistant'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-[11px] text-[#687280]">
                        {message.timestamp}
                      </span>
                    </div>

                    {message.socraticRatio && (
                      <span className="text-[10px] font-mono uppercase text-[#6b431b] bg-[#FBF6EE] px-2 py-0.5 rounded-full border border-[#EED9BE]">
                        {message.socraticRatio}
                      </span>
                    )}
                  </div>
                )}

                {/* Message Text Content */}
                <div className={`text-xs md:text-sm leading-relaxed ${isUser ? 'whitespace-pre-wrap' : 'font-serif'}`}>
                  {isPendingAssistant && !message.text ? (
                    <div className="flex items-center gap-2 text-[#687280]">
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#C58940] animate-pulse" />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#C58940] animate-pulse [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#C58940] animate-pulse [animation-delay:300ms]" />
                      </span>
                      <span>{thinkingMessages[thinkingStep % thinkingMessages.length]}</span>
                    </div>

                  ) : isUser ? message.text : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => <h1 className="text-lg font-bold mt-4 mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-bold mt-4 mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="font-semibold mt-3 mb-1">{children}</h3>,
                        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                        blockquote: ({ children }) =>                         <blockquote className="border-l-2 border-[#C58940] pl-3 italic text-[#687280] my-3">{children}</blockquote>,
                        code: ({ className, children }) => (
                          <code className={`${className ? 'block overflow-x-auto rounded-lg bg-[#2D343E] p-3 text-xs text-[#FBF6EE] my-3' : 'rounded bg-[#F6F5F0] px-1 py-0.5 text-[0.9em] text-[#8a5a25]'}`}>
                            {children}
                          </code>
                        ),
                        table: ({ children }) => <div className="overflow-x-auto mb-3"><table className="w-full border-collapse text-xs">{children}</table></div>,
                        th: ({ children }) => <th className="border border-[#E8E5DE] bg-[#F6F5F0] px-2 py-1 text-left font-semibold">{children}</th>,
                        td: ({ children }) => <td className="border border-[#E8E5DE] px-2 py-1 align-top">{children}</td>,
                        a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="text-[#8a5a25] underline">{children}</a>,
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                  )}
                </div>

                {/* Render Dynamic Visual Components */}
                {!isUser && message.visuals && message.visuals.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {message.visuals.map((visual, vIdx) => {
                      switch (visual.type) {
                        case 'loss-diagram':
                          return (
                            <LossLandscapeDiagram
                              key={`vis-${vIdx}`}
                              defaultLearningRate={visual.lossDiagram?.defaultLearningRate}
                              initialSteps={visual.lossDiagram?.initialSteps}
                            />
                          );
                        case 'mcq':
                          return visual.mcq ? (
                            <ConceptCheckCard key={`vis-${vIdx}`} data={visual.mcq} />
                          ) : null;
                        case 'flashcard':
                          return visual.flashcard ? (
                            <FlipFlashcard key={`vis-${vIdx}`} data={visual.flashcard} />
                          ) : null;
                        case 'hint-ladder':
                          return visual.hintLadder ? (
                            <SocraticHintLadder key={`vis-${vIdx}`} data={visual.hintLadder} />
                          ) : null;
                        case 'slide-citation':
                          return visual.slideCitation ? (
                            <SlideCitationCard
                              key={`vis-${vIdx}`}
                              data={visual.slideCitation}
                              onInspectSlide={onInspectSlide}
                            />
                          ) : null;
                        case 'code-block':
                          return visual.codeBlock ? (
                            <CodeSandboxBlock key={`vis-${vIdx}`} data={visual.codeBlock} />
                          ) : null;
                        case 'concept-diagram':
                          return visual.conceptDiagram ? (
                            <ConceptDiagram key={`vis-${vIdx}`} data={visual.conceptDiagram} />
                          ) : null;
                        case 'neural-flow':
                          return <NeuralFlowVisualizer key={`vis-${vIdx}`} />;
                        default:
                          return null;
                      }
                    })}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg bg-[#F6F5F0] border border-[#E8E5DE] text-[#687280] font-semibold text-xs mt-0.5">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Bar */}
      <div className="max-w-4xl w-full mx-auto px-4 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none text-xs">
          <span className="text-[11px] font-medium text-[#687280] shrink-0 flex items-center gap-1">
            <Lightbulb className="h-3 w-3 text-[#C58940]" />
            <span>Try:</span>
          </span>
          {samplePrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => onSendMessage(prompt)}
              className="text-xs bg-white hover:bg-[#F6F5F0] text-[#687280] border border-[#E8E5DE] hover:border-[#DCD8CF] rounded-full px-3 py-1 whitespace-nowrap shrink-0 transition-colors shadow-2xs"
            >
              {prompt}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              if (latestAssistantMessage) {
                onVisualizeMessage(latestAssistantMessage, latestUserPrompt);
              }
            }}
            disabled={!latestAssistantMessage || isGenerating || visualizingMessageId === latestAssistantMessage?.id}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#EED9BE] bg-[#FBF6EE] px-3 py-1 text-xs font-medium text-[#6b431b] whitespace-nowrap shrink-0 transition-colors hover:bg-[#f8ecd8] disabled:cursor-not-allowed disabled:opacity-50"
            title={latestAssistantMessage ? 'Create an interactive visual for the latest response' : 'Ask a question first'}
          >
            <Sparkles className="h-3 w-3" />
            {visualizingMessageId === latestAssistantMessage?.id ? 'Creating visual…' : 'Visualize concept'}
          </button>
        </div>
      </div>

      {/* Message Input Box */}
      <div className="max-w-4xl w-full mx-auto px-4 pb-4">
        <form
          onSubmit={handleSubmit}
          className="relative rounded-2xl border border-[#DCD8CF] bg-white shadow-xs focus-within:border-[#C58940] focus-within:ring-1 focus-within:ring-[#EED9BE] transition-all p-2"
        >
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={
              currentMode === 'socratic'
                ? 'Ask a conceptual question (e.g., "Why does learning rate cause overshoot?")...'
                : 'Paste a homework problem or formula to derive with verification checks...'
            }
            rows={2}
            className="w-full resize-none bg-transparent px-3 py-1.5 text-xs md:text-sm text-[#1E232A] placeholder:text-[#9aa1a9] focus:outline-none font-serif"
          />

          <div className="flex items-center justify-between pt-1 border-t border-[#E8E5DE] px-2 text-xs text-[#687280]">
            <div className="flex items-center gap-2 text-[11px]">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDocumentMenuOpen((open) => !open)}
                  disabled={documentAction !== null}
                  className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[#687280] hover:bg-[#F6F5F0] hover:text-[#8a5a25] disabled:opacity-50"
                  aria-haspopup="menu"
                  aria-expanded={isDocumentMenuOpen}
                >
                  <FileQuestion className="h-3.5 w-3.5" />
                  <span>{documentAction ? 'Creating document…' : 'Create document'}</span>
                </button>
                {isDocumentMenuOpen && (
                  <div className="absolute bottom-8 left-0 z-20 w-56 rounded-lg border border-[#E8E5DE] bg-white p-1.5 text-xs shadow-lg" role="menu">
                    <button type="button" onClick={() => void handleDocumentAction('latest')} className="block w-full rounded-md px-2.5 py-2 text-left hover:bg-[#F6F5F0]" role="menuitem">
                      Download latest response
                    </button>
                    <button type="button" onClick={() => void handleDocumentAction('conversation')} className="block w-full rounded-md px-2.5 py-2 text-left hover:bg-[#F6F5F0]" role="menuitem">
                      Download full conversation
                    </button>
                    <button type="button" onClick={() => void handleDocumentAction('study-guide')} className="block w-full rounded-md px-2.5 py-2 text-left hover:bg-[#F6F5F0]" role="menuitem">
                      Generate polished study guide
                    </button>
                  </div>
                )}
              </div>
              {documentError && (
                <span className="max-w-56 truncate text-[10px] text-red-600" title={documentError}>
                  {documentError}
                </span>
              )}
              <span className="hidden sm:inline">
                Press <kbd className="px-1 py-0.5 rounded bg-[#F6F5F0] border border-[#E8E5DE] font-mono text-[10px]">Enter</kbd> to send
              </span>
              <span aria-hidden="true" className="hidden sm:inline">·</span>
              <span className="font-mono text-[#687280]">
                Mode: {currentMode === 'socratic' ? 'Socratic' : 'Personal assistant'}
              </span>
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || isGenerating}
              className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                inputText.trim() && !isGenerating
                  ? 'bg-[#1E232A] text-white hover:bg-[#2D343E] shadow-xs cursor-pointer'
                  : 'bg-[#F6F5F0] text-[#9aa1a9] cursor-not-allowed'
              }`}
            >
              <span>Ask Tutor</span>
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
