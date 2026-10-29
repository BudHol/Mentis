import React, { useEffect, useState } from 'react';
import { TutorMode, LectureDeck, Message, RagChunk } from './types';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { ModeHeader } from './components/ModeHeader';
import { ChatArea } from './components/ChatArea';
import { RagInspectorDrawer } from './components/RagInspectorDrawer';
import { PdfUploadModal } from './components/PdfUploadModal';
import { LectureLibraryView } from './components/views/LectureLibraryView';
import { generateConceptVisual, getOpenRouterApiKey, parseTutorResponse, streamTutorResponse } from './services/openRouterTutor';
import { retrieveRelevantChunks } from './services/ragService';
import { generateStudyGuide } from './services/documentGenerationService';
import {
  DocumentExportKind,
  documentFromMessages,
  downloadTutorDocument,
} from './services/docxExportService';
import {
  deleteConversation,
  getConversationTitle,
  listConversations,
  loadConversation,
  migrateLegacyActiveConversation,
  saveConversation,
  StoredConversation,
} from './services/conversationStore';

export default function App() {
  const [activeTab, setActiveTab] = useState<'workspace' | 'library'>('workspace');
  const [currentMode, setCurrentMode] = useState<TutorMode>('socratic');
  const [activeConversationId, setActiveConversationId] = useState<string>(() => crypto.randomUUID());
  const [conversationCreatedAt, setConversationCreatedAt] = useState(() => new Date().toISOString());
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [lectureDecks, setLectureDecks] = useState<LectureDeck[]>([]);
  const [ragChunks, setRagChunks] = useState<RagChunk[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConversationLoaded, setIsConversationLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [visualizingMessageId, setVisualizingMessageId] = useState<string | null>(null);

  // Modals & Drawers
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isRagDrawerOpen, setIsRagDrawerOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeSlideRef, setActiveSlideRef] = useState<{ deckTitle: string; slideNumber: number } | null>(null);

  const activeDeck = lectureDecks.find((deck) => deck.id === activeDeckId) || lectureDecks[0];

  const retrieveSessionChunks = (text: string) => retrieveRelevantChunks(
    text,
    ragChunks.filter((chunk) => chunk.deckId === activeDeck?.id),
  );

  useEffect(() => {
    let isMounted = true;

    Promise.all([migrateLegacyActiveConversation(), listConversations()])
      .then(async ([migratedConversation, savedConversations]) => {
        if (!isMounted) return;
        const availableConversations = migratedConversation
          ? [migratedConversation, ...savedConversations.filter(({ id }) => id !== migratedConversation.id)]
          : savedConversations;
        setConversations(availableConversations);
        const conversation = availableConversations[0];
        if (conversation?.messages.length) {
          setActiveConversationId(conversation.id);
          setConversationCreatedAt(conversation.createdAt);
          setMessages(conversation.messages);
          setCurrentMode(conversation.mode);
        }
      })
      .catch((error) => {
        console.error('Unable to restore the saved conversation.', error);
      })
      .finally(() => {
        if (isMounted) setIsConversationLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isConversationLoaded) return;

    const conversation: StoredConversation = {
      id: activeConversationId,
      title: getConversationTitle(messages),
      mode: currentMode,
      messages,
      createdAt: conversationCreatedAt,
      updatedAt: new Date().toISOString(),
    };

    saveConversation(conversation).then(() => {
      setConversations((previous) => [
        conversation,
        ...previous.filter(({ id }) => id !== conversation.id),
      ]);
    }).catch((error) => {
      console.error('Unable to save the conversation locally.', error);
    });
  }, [activeConversationId, conversationCreatedAt, currentMode, isConversationLoaded, messages]);

  const handleInspectSlide = (deckTitle: string, slideNumber: number) => {
    setActiveSlideRef({ deckTitle, slideNumber });
    setIsRagDrawerOpen(true);
  };

  const handleNewSession = () => {
    setActiveConversationId(crypto.randomUUID());
    setConversationCreatedAt(new Date().toISOString());
    setMessages([]);
    setActiveTab('workspace');
  };

  const handleSelectConversation = async (conversation: StoredConversation) => {
    try {
      const savedConversation = await loadConversation(conversation.id);
      if (!savedConversation) return;
      setActiveConversationId(savedConversation.id);
      setConversationCreatedAt(savedConversation.createdAt);
      setCurrentMode(savedConversation.mode);
      setMessages(savedConversation.messages);
      setActiveTab('workspace');
      setIsMobileSidebarOpen(false);
    } catch (error) {
      console.error('Unable to open the selected conversation.', error);
    }
  };

  const handleDeleteConversation = async (conversation: StoredConversation) => {
    try {
      await deleteConversation(conversation.id);
      setConversations((previous) => previous.filter(({ id }) => id !== conversation.id));
      if (conversation.id === activeConversationId) {
        handleNewSession();
      }
    } catch (error) {
      console.error('Unable to delete the selected conversation.', error);
    }
  };

  const handleMockSendMessage = (text: string) => {
    const retrievedChunks = retrieveSessionChunks(text);
    const lectureContext = retrievedChunks.length
      ? `\n\nI checked **${activeDeck?.title || 'your indexed lecture'}** and found relevant passages on ${retrievedChunks
          .map((chunk) => `Slide ${chunk.slideNumber}`)
          .join(', ')}.`
      : activeDeck
        ? `\n\nI checked **${activeDeck.title}**, but no matching passage was found for this question.`
        : '\n\nNo lecture is selected yet, so this answer is based on the question alone.';
    const sourceExcerpt = retrievedChunks[0]
      ? `\n\n> Slide ${retrievedChunks[0].slideNumber}: ${retrievedChunks[0].snippet}`
      : '';
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: currentMode,
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);

    // Dynamic AI Tutor response simulation reflecting selected mode & user intent
    setTimeout(() => {
      const lower = text.toLowerCase();
      let assistantMsg: Message;

      if (currentMode === 'socratic') {
        if (lower.includes('quiz') || lower.includes('check')) {
          assistantMsg = {
            id: `msg-${Date.now() + 1}`,
            role: 'assistant',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            mode: 'socratic',
            socraticRatio: '85% Socratic · 15% Direct Guidance',
            text: `Here is a diagnostic check based on the indexed lecture context.${lectureContext}${sourceExcerpt}`,
            ragSources: retrievedChunks,
            visuals: [
              {
                type: 'mcq',
                mcq: {
                  question: 'Why do deep networks with Sigmoid activations suffer from vanishing gradients during backpropagation?',
                  options: [
                    {
                      id: 'a',
                      text: 'The derivative of Sigmoid maxes out at 0.25, so multiplying through many layers drives upstream gradients toward zero',
                      isCorrect: true,
                      feedback: 'Spot on! Because dσ/dz = σ(z)(1 - σ(z)) has a peak value of 0.25 (at z=0), cascading 10 layers multiplies gradients by at most (0.25)^10 ≈ 9.5 × 10^-7.',
                    },
                    {
                      id: 'b',
                      text: 'The Sigmoid function cannot be differentiated analytically',
                      isCorrect: false,
                      feedback: 'Sigmoid is completely smooth and differentiable everywhere. In fact, its derivative has an elegant closed form: σ(z)(1 - σ(z)).',
                    },
                    {
                      id: 'c',
                      text: 'The learning rate is automatically divided by the layer depth',
                      isCorrect: false,
                      feedback: 'The learning rate η remains constant unless an adaptive optimizer like Adam is used; it is not divided by layer depth.',
                    },
                  ],
                  socraticFollowUp: 'What modern activation function was specifically introduced to remedy this problem, and why?',
                },
              },
              {
                type: 'flashcard',
                flashcard: {
                  front: 'Why does the ReLU activation function solve the vanishing gradient problem in deep networks?',
                  back: 'For all positive inputs (z > 0), the gradient of ReLU is identically 1.0! When multiplying chain rule derivatives, 1.0 does not attenuate upstream gradients across arbitrary layer depths.',
                  context: 'Lecture 05 · Slide 14',
                  slideRef: 'Slide 14',
                },
              },
            ],
          };
        } else if (lower.includes('diagram') || lower.includes('loss') || lower.includes('oscillation') || lower.includes('learning rate')) {
          assistantMsg = {
            id: `msg-${Date.now() + 1}`,
            role: 'assistant',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            mode: 'socratic',
            socraticRatio: '80% Socratic · 20% Direct Guidance',
            text: `Let's visualize the loss surface directly! In Lecture 04 (Slide 14), we study the Lipschitz smoothness constant $L$.

When you step with $\\eta$, each update moves you along:
$$\\theta_{t+1} = \\theta_t (1 - \\eta \\cdot L)$$

Try dragging the learning rate slider $\\eta$ past $0.70$ in the visualizer below to see how consecutive step vectors begin to alternate and explode:`,
            visuals: [
              {
                type: 'loss-diagram',
                lossDiagram: {
                  defaultLearningRate: 0.62,
                  initialSteps: 7,
                },
              },
              {
                type: 'slide-citation',
                slideCitation: {
                  deckTitle: 'CS 229 · Lecture 04: Gradient Descent',
                  slideNumber: 14,
                  similarity: 0.94,
                  topic: 'Theorem 4.2: Step Size & Lipschitz Upper Bound (η < 2/L)',
                  excerpt: 'If η > 2/L, successive steps overshoot the valley minimum, causing alternating oscillations or divergence to infinity.',
                },
              },
            ],
          };
        } else {
          assistantMsg = {
            id: `msg-${Date.now() + 1}`,
            role: 'assistant',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            mode: 'socratic',
            socraticRatio: '80% Socratic Inquiry',
            text: `Great conceptual question! Before jumping straight to the conclusion, let's test our foundational intuition.

1. What does the gradient vector $\\nabla J(\\theta)$ physically represent on the loss surface?
2. If the slope is steep, is the gradient small or large?
3. How does that interact with the step size $\\eta$?

Here is a progressive Socratic Hint Ladder to guide your thinking step-by-step:`,
            visuals: [
              {
                type: 'hint-ladder',
                hintLadder: {
                  title: 'Unpacking Gradient Step Dynamics',
                  coreQuestion: 'How does step size scale with gradient magnitude and learning rate?',
                  hints: [
                    {
                      level: 1,
                      label: 'Direction vs Step Length',
                      content: 'Gradient direction points along steepest ascent. We negate it (-∇J) to go downhill. But step length is η · ||∇J||.',
                    },
                    {
                      level: 2,
                      label: 'Curvature Sensitivity',
                      content: 'If the valley walls are steep, ||∇J|| is huge. Even a modest η can propel you across the entire basin.',
                    },
                  ],
                  finalInsight: 'Optimal step sizes must adapt to local curvature (e.g., using adaptive learning rates like Adam or setting η ≤ 1/L).',
                },
              },
              {
                type: 'slide-citation',
                slideCitation: {
                  deckTitle: 'CS 229 · Lecture 04',
                  slideNumber: 15,
                  similarity: 0.88,
                  topic: 'Curvature and Hessian Eigenvalues',
                  excerpt: 'Along high-curvature directions, the gradient changes rapidly; a step size scaled for flat directions will aggressively overshoot.',
                },
              },
            ],
          };
        }
      } else {
          assistantMsg = {
            id: `msg-${Date.now() + 1}`,
            role: 'assistant',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            mode: 'assistant',
            socraticRatio: 'Personal Assistant',
            text: `I’ll give you a direct, candid assessment of this request, identify the key risks or assumptions, and finish with a prioritized next-step plan.\n\nRegarding “${text}”: start by stating the outcome you want, the constraints you are operating under, and the evidence supporting your current approach. I’ll pressure-test it from there.${lectureContext}${sourceExcerpt}`,
            ragSources: retrievedChunks,
          };
      }

      const includesLectureContext =
        assistantMsg.text.includes('I checked') ||
        assistantMsg.text.includes('No lecture is selected') ||
        assistantMsg.text.includes('no matching passage');
      assistantMsg = {
        ...assistantMsg,
        ragSources: retrievedChunks,
        text: includesLectureContext
          ? assistantMsg.text
          : `${assistantMsg.text}${lectureContext}${sourceExcerpt}`,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsGenerating(false);
    }, 900);
  };

  const handleSendMessage = async (text: string) => {
    if (!getOpenRouterApiKey()) {
      handleMockSendMessage(text);
      return;
    }

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      timestamp: now,
      mode: currentMode,
      text,
    };
    const assistantId = `msg-${Date.now() + 1}`;
    const assistantMsg: Message = {
      id: assistantId,
      role: 'assistant',
      timestamp: now,
      mode: currentMode,
      socraticRatio: currentMode === 'socratic' ? 'Socratic Tutor' : 'Personal Assistant',
      text: '',
    };
    const retrievedChunks = retrieveSessionChunks(text);

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsGenerating(true);

    try {
      let rawText = '';
      await streamTutorResponse(
        [...messages, userMsg],
        currentMode,
        retrievedChunks,
        {
          onText: (chunk) => {
            rawText += chunk;
            const parsed = parseTutorResponse(rawText);
            setMessages((prev) => prev.map((message) => (
              message.id === assistantId
                ? { ...message, text: parsed.text, visuals: parsed.visuals, ragSources: retrievedChunks }
                : message
            )));
          },
        },
      );
    } catch (error) {
      const errorText = error instanceof Error ? error.message : 'The tutor could not complete this request.';
      setMessages((prev) => prev.map((message) => (
        message.id === assistantId
          ? {
              ...message,
              text: `I couldn't reach the live tutor.\n\n${errorText}\n\nYour message is still in this session. Check your API configuration and try again.`,
            }
          : message
      )));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeckUploaded = (newDeck: LectureDeck, chunks: RagChunk[]) => {
    setLectureDecks((prev) => [newDeck, ...prev]);
    setRagChunks((prev) => [...chunks, ...prev]);
    setActiveDeckId(newDeck.id);
  };

  const handleVisualizeMessage = async (message: Message, userPrompt: string) => {
    setVisualizingMessageId(message.id);
    try {
      const visual = await generateConceptVisual(message, userPrompt, message.ragSources || []);
      setMessages((prev) => prev.map((item) => (
        item.id === message.id
          ? { ...item, visuals: [...(item.visuals || []), visual] }
          : item
      )));
    } catch (error) {
      const errorText = error instanceof Error ? error.message : 'The visual assistant could not complete this request.';
      setMessages((prev) => prev.map((item) => (
        item.id === message.id
          ? { ...item, text: `${item.text}\n\n*Visual assistant: ${errorText}*` }
          : item
      )));
    } finally {
      setVisualizingMessageId(null);
    }
  };

  const handleCreateDocument = async (kind: DocumentExportKind) => {
    const assistantMessages = messages.filter((message) => message.role === 'assistant' && message.text.trim());
    if (!assistantMessages.length) throw new Error('There is no tutor response to export yet.');

    const sources = messages.flatMap((message) => message.ragSources || []);
    const uniqueSources = sources.filter((source, index, all) => (
      all.findIndex((candidate) => candidate.id === source.id) === index
    ));
    if (kind === 'study-guide') {
      const studyGuide = await generateStudyGuide(messages, uniqueSources);
      await downloadTutorDocument(studyGuide, 'my-personal-tutor-study-guide.docx');
      return;
    }

    const selectedMessages = kind === 'latest'
      ? [assistantMessages[assistantMessages.length - 1]]
      : messages.filter((message) => message.text.trim());
    const title = kind === 'latest' ? 'Tutor response' : 'My Personal Tutor conversation';
    await downloadTutorDocument(
      documentFromMessages(title, selectedMessages, uniqueSources),
      kind === 'latest' ? 'my-personal-tutor-response.docx' : 'my-personal-tutor-conversation.docx',
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBF9] text-[#1E232A] font-sans antialiased">
      {/* Strict 3-Zone Top Bar Contract */}
      <TopBar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onNewSession={handleNewSession}
        onOpenUpload={() => setIsUploadModalOpen(true)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          lectureDecks={lectureDecks}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onOpenUpload={() => setIsUploadModalOpen(true)}
          onOpenRagInspector={() => setIsRagDrawerOpen(true)}
          onSelectDeck={(deck) => {
            setActiveDeckId(deck.id);
            handleInspectSlide(deck.title, 1);
          }}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Center Canvas Area based on activeTab */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#FBFBF9]">
          {activeTab === 'workspace' && (
            <>
              {/* Dual-Mode Switcher Sub-header */}
              <ModeHeader
                currentMode={currentMode}
                activeDeckTitle={activeDeck?.title}
                onModeChange={setCurrentMode}
                onOpenRag={() => setIsRagDrawerOpen(true)}
                onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              />

              {/* Chat Stream & Dynamic Visuals */}
              <ChatArea
                messages={messages}
                currentMode={currentMode}
                onSendMessage={handleSendMessage}
                isGenerating={isGenerating}
                onInspectSlide={handleInspectSlide}
                onVisualizeMessage={handleVisualizeMessage}
                visualizingMessageId={visualizingMessageId}
                onCreateDocument={handleCreateDocument}
              />
            </>
          )}

          {activeTab === 'library' && (
            <LectureLibraryView
              decks={lectureDecks}
              onOpenUpload={() => setIsUploadModalOpen(true)}
              onOpenRagInspector={() => setIsRagDrawerOpen(true)}
              onSelectDeck={(deck) => {
                setActiveDeckId(deck.id);
                handleInspectSlide(deck.title, 1);
              }}
            />
          )}

        </main>
      </div>

      {/* Ingestion & Chunking Modal */}
      <PdfUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDeckUploaded={handleDeckUploaded}
        currentCourse="lecture"
      />

      {/* RAG Context & Slide Inspector Drawer */}
      <RagInspectorDrawer
        isOpen={isRagDrawerOpen}
        onClose={() => {
          setIsRagDrawerOpen(false);
          setActiveSlideRef(null);
        }}
        decks={lectureDecks}
        chunks={ragChunks}
        activeSlideRef={activeSlideRef}
      />
    </div>
  );
}
