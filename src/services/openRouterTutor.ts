import { Message, MessageVisualPayload, RagChunk, TutorMode } from '../types';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'nvidia/nemotron-3.5-lightning:free';
const FALLBACK_MODEL = 'nvidia/nemotron-3.5-super-vl:free';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface StreamCallbacks {
  onText: (text: string) => void;
}

interface ParsedTutorResponse {
  text: string;
  visuals: MessageVisualPayload[];
}

type CompletionContent = string | Array<{ type?: string; text?: string; content?: string }>;

function extractCompletionText(payload: {
  choices?: Array<{ text?: string; message?: { content?: CompletionContent } }>;
}): string {
  const choice = payload.choices?.[0];
  const content = choice?.message?.content;
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => part.text || part.content || '')
      .join('')
      .trim();
  }
  return choice?.text?.trim() || '';
}

function parseVisualJson(content: string): MessageVisualPayload {
  const normalized = content
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const parsed = JSON.parse(normalized) as MessageVisualPayload;
  const payloadKey = parsed.type === 'mcq'
    ? 'mcq'
    : parsed.type === 'flashcard'
      ? 'flashcard'
      : parsed.type === 'hint-ladder'
        ? 'hintLadder'
            : parsed.type === 'concept-diagram'
              ? 'conceptDiagram'
              : parsed.type === 'neural-flow'
                ? 'neuralFlow'
                : parsed.type === 'code-block'
          ? 'codeBlock'
          : null;
  if (!payloadKey || !parsed[payloadKey]) {
    throw new Error('Visual payload is incomplete.');
  }
  return parsed;
}

function visualPrompt(text: string, userPrompt: string, ragChunks: RagChunk[]): string {
  const context = ragChunks.length
    ? ragChunks.map((chunk) => `[Slide ${chunk.slideNumber}] ${chunk.snippet}`).join('\n')
    : 'No lecture context was retrieved.';
  return `You create one safe, predefined visual study aid for a tutor response.
Return ONLY valid JSON. Do not use markdown fences, HTML, JSX, JavaScript, or explanatory text.
Choose exactly one type: mcq, flashcard, hint-ladder, concept-diagram, neural-flow, or code-block.
If the user's request includes quiz, quiz me, test me, multiple choice, or MCQ, you MUST choose mcq.
For processes, systems, relationships, sequences, or comparisons, prefer concept-diagram or neural-flow over flashcard.
For optimization landscapes, prefer concept-diagram unless the response is specifically about gradient descent loss behavior.
The JSON must match one of these shapes:
{"type":"mcq","mcq":{"question":"...","options":[{"id":"a","text":"...","isCorrect":true,"feedback":"..."}],"socraticFollowUp":"..."}}
{"type":"flashcard","flashcard":{"front":"...","back":"...","context":"..."}}
{"type":"hint-ladder","hintLadder":{"title":"...","coreQuestion":"...","hints":[{"level":1,"label":"...","content":"..."}],"finalInsight":"..."}}
{"type":"concept-diagram","conceptDiagram":{"title":"...","summary":"...","nodes":[{"id":"a","label":"...","detail":"..."}],"connections":[{"from":"a","to":"b","label":"..."}]}}
{"type":"neural-flow"}
{"type":"code-block","codeBlock":{"language":"python","code":"...","notes":"...","runnable":false}}
Never include executable behavior, scripts, event handlers, or arbitrary component names.

Tutor response to visualize:
${text}

Original user request:
${userPrompt}

Relevant lecture context:
${context}`;
}

export async function generateConceptVisual(
  message: Message,
  userPrompt: string,
  ragChunks: RagChunk[],
  signal?: AbortSignal,
): Promise<MessageVisualPayload> {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) throw new Error('OpenRouter is not configured.');

  const configuredModel = import.meta.env.VITE_OPENROUTER_MODEL?.trim();
  const models = [...new Set(
    [configuredModel, DEFAULT_MODEL, FALLBACK_MODEL].filter((model): model is string => Boolean(model)),
  )];
  let lastError = 'The visual assistant returned no usable visual.';

  for (const model of models) {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'My Personal Tutor',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: visualPrompt(message.text, userPrompt, ragChunks) },
          { role: 'user', content: 'Return the single visual JSON object now.' },
        ],
        stream: false,
        max_tokens: 900,
        temperature: 0.3,
      }),
      signal,
    });

    if (!response.ok) {
      lastError = `Visual generation failed (${response.status}) for ${model}: ${(await response.text()).slice(0, 240)}`;
      if (response.status >= 400 && response.status < 500) break;
      continue;
    }

    try {
      const payload = await response.json() as {
        choices?: Array<{ message?: { content?: CompletionContent } }>;
      };
      const content = extractCompletionText(payload);
      if (!content) {
        lastError = `Visual assistant returned an empty response for ${model}.`;
        continue;
      }
      return parseVisualJson(content);
    } catch (error) {
      lastError = error instanceof Error
        ? `Visual assistant response was invalid for ${model}: ${error.message}`
        : `Visual assistant response was invalid for ${model}.`;
    }
  }

  throw new Error(lastError);
}

function buildSystemPrompt(mode: TutorMode, ragChunks: RagChunk[]): string {
  const strategy = mode === 'socratic'
    ? 'Use a Socratic approach: ask one useful question when the learner can reasonably discover the next step, supported by concise guidance.'
    : 'Use a direct, helpful approach: explain the answer clearly, state relevant assumptions, and suggest practical next steps when useful.';
  const context = ragChunks.length
    ? `\nThe learner has uploaded and indexed a lecture document. Use the following retrieved passages as authoritative context. For broad questions about what the file is about, synthesize a topic overview from these passages instead of saying the file is unavailable. Cite page/slide numbers when useful:\n${ragChunks
        .map((chunk) => `[Slide ${chunk.slideNumber}] ${chunk.snippet}`)
        .join('\n')}`
    : '\nNo lecture passages were retrieved for this question. Do not claim that a file was uploaded unless context is provided.';

  return `You are My Personal Tutor, a careful AI study companion. The active interaction style is ${mode === 'socratic' ? 'Socratic Tutor' : 'Personal Assistant'}.
${strategy}
Prefer concise explanations, concrete intuition, and correct mathematics. If the lecture context does not contain the answer, say so instead of inventing a citation.
${context}

You may add exactly one interactive visual when it materially improves the answer. Use one of these exact blocks, with valid JSON and no markdown fences:
<visual type="mcq">{"mcq":{"question":"...","options":[{"id":"a","text":"...","isCorrect":true,"feedback":"..."}]}}</visual>
<visual type="flashcard">{"flashcard":{"front":"...","back":"...","context":"..."}}</visual>
<visual type="hint-ladder">{"hintLadder":{"title":"...","coreQuestion":"...","hints":[{"level":1,"label":"...","content":"..."}],"finalInsight":"..."}}</visual>
<visual type="code-block">{"codeBlock":{"language":"python","code":"...","notes":"..."}}</visual>
Never put untrusted HTML, JavaScript, or executable component names in a visual block.`;
}

function toApiMessages(messages: Message[], mode: TutorMode, ragChunks: RagChunk[]): OpenRouterMessage[] {
  return [
    { role: 'system', content: buildSystemPrompt(mode, ragChunks) },
    ...messages.slice(-12).map((message) => ({
      role: message.role,
      content: message.text,
    })),
  ];
}

export function getOpenRouterApiKey(): string | undefined {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY?.trim();
  return apiKey && apiKey !== 'your_openrouter_api_key_here' ? apiKey : undefined;
}

export async function streamTutorResponse(
  messages: Message[],
  mode: TutorMode,
  ragChunks: RagChunk[],
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    throw new Error('OpenRouter is not configured. Add an API key in Settings to enable live tutoring.');
  }

  const configuredModel = import.meta.env.VITE_OPENROUTER_MODEL?.trim();
  const models = [...new Set(
    [configuredModel, DEFAULT_MODEL, FALLBACK_MODEL].filter((model): model is string => Boolean(model)),
  )];
  let lastError = 'OpenRouter did not return a response.';

  for (const model of models) {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'My Personal Tutor',
      },
      body: JSON.stringify({
        model,
        messages: toApiMessages(messages, mode, ragChunks),
        stream: false,
        max_tokens: 1200,
        temperature: 0.4,
      }),
      signal,
    });

    if (!response.ok) {
      const detail = await response.text();
      lastError = `OpenRouter request failed (${response.status}) for ${model}: ${detail.slice(0, 240)}`;
      if (response.status === 401 || response.status === 403) break;
      continue;
    }
    try {
      const payload = await response.json() as {
        choices?: Array<{
          text?: string;
          finish_reason?: string | null;
          message?: { content?: CompletionContent };
        }>;
        error?: { message?: string };
      };
      const text = extractCompletionText(payload);
      if (!text) {
        const finishReason = payload.choices?.[0]?.finish_reason;
        lastError = `OpenRouter returned no assistant text for ${model}: ${
          payload.error?.message || (finishReason ? `finish reason: ${finishReason}` : 'empty completion')
        }`;
        continue;
      }
      callbacks.onText(text);
      return;
    } catch (error) {
      lastError = `Could not read OpenRouter JSON response for ${model}: ${
        error instanceof Error ? error.message : 'invalid response'
      }`;
      continue;
    }
  }

  throw new Error(lastError);
}

export function parseTutorResponse(rawText: string): ParsedTutorResponse {
  const visuals: MessageVisualPayload[] = [];
  const text = rawText.replace(
    /<visual\s+type="(mcq|flashcard|hint-ladder|code-block)">([\s\S]*?)<\/visual>/g,
    (_match, type: MessageVisualPayload['type'], json: string) => {
      try {
        const payload = JSON.parse(json) as Omit<MessageVisualPayload, 'type'>;
        visuals.push({ type, ...payload });
      } catch {
        // Keep malformed model output visible as text rather than silently losing it.
        return json;
      }
      return '';
    },
  ).trim();

  return { text, visuals };
}
