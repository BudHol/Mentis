import { Message, RagChunk } from '../types';
import { DocumentTable, DocumentFlowchart, DocumentSection, TutorDocument } from './docxExportService';
import { getOpenRouterApiKey } from './openRouterTutor';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'nvidia/nemotron-3.5-lightning:free';
const FALLBACK_MODEL = 'nvidia/nemotron-3.5-super-vl:free';

type CompletionContent = string | Array<{ type?: string; text?: string; content?: string }>;

interface GeneratedDocumentPayload {
  title?: string;
  subtitle?: string;
  sections?: DocumentSection[];
  tables?: DocumentTable[];
  flowcharts?: DocumentFlowchart[];
}

function extractText(payload: {
  choices?: Array<{ message?: { content?: CompletionContent }; text?: string }>;
}): string {
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    return content.map((part) => part.text || part.content || '').join('').trim();
  }
  return payload.choices?.[0]?.text?.trim() || '';
}

function extractJsonObject(content: string): string {
  const normalized = content
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const start = normalized.indexOf('{');
  if (start < 0) throw new Error('The document assistant did not return a JSON object.');

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < normalized.length; index += 1) {
    const character = normalized[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }
    if (character === '"') {
      inString = true;
    } else if (character === '{') {
      depth += 1;
    } else if (character === '}') {
      depth -= 1;
      if (depth === 0) return normalized.slice(start, index + 1);
    }
  }
  throw new Error('The document assistant returned incomplete JSON. Try generating the document again.');
}

function validateDocument(payload: GeneratedDocumentPayload): TutorDocument {
  if (!payload.title || !Array.isArray(payload.sections) || payload.sections.length === 0) {
    throw new Error('The document assistant returned an incomplete document.');
  }
  return {
    title: payload.title,
    subtitle: payload.subtitle,
    sections: payload.sections.filter((section) => section.heading && Array.isArray(section.paragraphs)),
    tables: payload.tables?.filter((table) => Array.isArray(table.columns) && Array.isArray(table.rows)),
    flowcharts: payload.flowcharts?.filter((flow) => flow.title && Array.isArray(flow.nodes)),
  };
}

function createLocalStudyGuide(messages: Message[], ragChunks: RagChunk[]): TutorDocument {
  const meaningfulMessages = messages.filter((message) => message.text.trim());
  const userQuestions = meaningfulMessages
    .filter((message) => message.role === 'user')
    .map((message) => message.text.trim());
  const tutorResponses = meaningfulMessages
    .filter((message) => message.role === 'assistant')
    .map((message) => message.text.trim());

  return {
    title: 'Personal Tutor Study Guide',
    subtitle: 'Generated from this conversation',
    sections: [
      {
        heading: 'Questions explored',
        paragraphs: userQuestions.length
          ? ['The conversation explored the following questions:']
          : ['No user questions were recorded in this conversation.'],
        bullets: userQuestions,
      },
      {
        heading: 'Tutor explanations',
        paragraphs: tutorResponses.length
          ? tutorResponses
          : ['No completed tutor explanation was available.'],
      },
    ],
    sources: ragChunks,
  };
}

export async function generateStudyGuide(
  messages: Message[],
  ragChunks: RagChunk[],
  signal?: AbortSignal,
): Promise<TutorDocument> {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) throw new Error('OpenRouter is not configured.');
  const context = ragChunks.map((chunk) => `[Lecture page ${chunk.slideNumber}] ${chunk.snippet}`).join('\n');
  const transcript = messages.slice(-12).map((message) => `${message.role}: ${message.text}`).join('\n\n');
  const configuredModel = import.meta.env.VITE_OPENROUTER_MODEL?.trim();
  const models = configuredModel ? [configuredModel] : [DEFAULT_MODEL, FALLBACK_MODEL];
  let lastError = 'The document assistant did not return a usable response.';

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
      messages: [
        {
          role: 'system',
          content: `Create a polished study guide as one complete JSON object only. Do not use markdown fences, HTML, newlines inside string values, or explanatory text.
Use this shape: {"title":"...","subtitle":"...","sections":[{"heading":"...","paragraphs":["..."],"bullets":["..."]}],"tables":[{"title":"...","columns":["..."],"rows":[["..."]]}],"flowcharts":[{"title":"...","nodes":["..."]}]}
Use no more than 5 sections, 2 tables, and 1 flowchart. Keep each paragraph concise and grounded in the transcript and lecture context. Ensure every string is closed and the JSON object is complete.`,
        },
        { role: 'user', content: `Transcript:\n${transcript}\n\nLecture context:\n${context || 'None available.'}` },
      ],
      stream: false,
      max_tokens: 2200,
      temperature: 0.3,
    }),
    signal,
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 240);
      lastError = `Document generation failed (${response.status}) for ${model}: ${detail}`;
      if (response.status >= 400 && response.status < 500) break;
      continue;
    }

    try {
      const payload = await response.json() as {
        choices?: Array<{
          message?: { content?: CompletionContent; refusal?: string };
          text?: string;
          finish_reason?: string;
        }>;
        error?: { message?: string };
      };
      const content = extractText(payload);
      if (!content) {
        const choice = payload.choices?.[0];
        lastError = `The document assistant returned an empty response for ${model}${
          choice?.finish_reason ? ` (${choice.finish_reason})` : ''
        }${payload.error?.message ? `: ${payload.error.message}` : ''}.`;
        continue;
      }
      try {
        return validateDocument(JSON.parse(extractJsonObject(content)) as GeneratedDocumentPayload);
      } catch (error) {
        lastError = error instanceof Error
          ? error.message
          : `The document assistant returned malformed JSON for ${model}.`;
      }
    } catch (error) {
      lastError = error instanceof Error
        ? `Could not read the document assistant response for ${model}: ${error.message}`
        : `Could not read the document assistant response for ${model}.`;
    }
  }

  if (lastError.includes('incomplete JSON') || lastError.includes('malformed JSON')) {
    return createLocalStudyGuide(messages, ragChunks);
  }
  throw new Error(lastError);
}
