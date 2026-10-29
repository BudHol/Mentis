import { LectureDeck, RagChunk } from '../types';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

const TOKEN_PATTERN = /[a-z0-9][a-z0-9'-]*/gi;

function tokenize(text: string): string[] {
  return text.toLowerCase().match(TOKEN_PATTERN) || [];
}

function keywordsFor(text: string): string[] {
  const counts = new Map<string, number>();
  for (const token of tokenize(text)) {
    if (token.length < 4) continue;
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([token]) => token);
}

function splitIntoChunks(text: string, chunkSize: number): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const chunks: string[] = [];
  const overlap = Math.min(40, Math.floor(chunkSize * 0.15));

  for (let start = 0; start < words.length; start += chunkSize - overlap) {
    const chunk = words.slice(start, start + chunkSize).join(' ').trim();
    if (chunk) chunks.push(chunk);
    if (start + chunkSize >= words.length) break;
  }
  return chunks;
}

export async function extractPdfChunks(
  file: File,
  deck: Pick<LectureDeck, 'id' | 'title'>,
  chunkSize: number,
  onProgress?: (progress: number) => void,
): Promise<RagChunk[]> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const document = await pdfjs.getDocument(new Uint8Array(await file.arrayBuffer())).promise;
  const chunks: RagChunk[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    for (const snippet of splitIntoChunks(pageText, chunkSize)) {
      chunks.push({
        id: `${deck.id}-page-${pageNumber}-${chunks.length}`,
        deckId: deck.id,
        lectureTitle: deck.title,
        slideNumber: pageNumber,
        snippet,
        similarityScore: 0,
        keywords: keywordsFor(snippet),
      });
    }
    onProgress?.(Math.round((pageNumber / document.numPages) * 100));
  }

  if (!chunks.length) {
    throw new Error('No selectable text was found in this PDF. Scanned PDFs need OCR before they can be searched.');
  }
  return chunks;
}

export function retrieveRelevantChunks(
  query: string,
  chunks: RagChunk[],
  limit = 6,
): RagChunk[] {
  if (!query.trim() || !chunks.length) return [];
  const isDocumentOverview = /\b(file|pdf|document|lecture|slides?|about|summarize|summary|overview)\b/i.test(query);

  const documents = chunks.map((chunk) => tokenize(chunk.snippet));
  const queryTokens = tokenize(query);
  const vocabulary = new Set([...queryTokens, ...documents.flat()]);
  const documentFrequency = new Map<string, number>();

  for (const term of vocabulary) {
    documentFrequency.set(
      term,
      documents.filter((tokens) => tokens.includes(term)).length,
    );
  }

  const weight = (term: string, tokens: string[]): number => {
    const count = tokens.filter((token) => token === term).length;
    const tf = count / Math.max(tokens.length, 1);
    const idf = Math.log((documents.length + 1) / ((documentFrequency.get(term) || 0) + 1)) + 1;
    return tf * idf;
  };

  const queryVector = [...vocabulary].map((term) => weight(term, queryTokens));
  const magnitude = (vector: number[]) => Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  const queryMagnitude = magnitude(queryVector);

  const ranked = chunks
    .map((chunk, index) => {
      const vector = [...vocabulary].map((term) => weight(term, documents[index]));
      const denominator = queryMagnitude * magnitude(vector);
      const score = denominator
        ? vector.reduce((sum, value, vectorIndex) => sum + value * queryVector[vectorIndex], 0) / denominator
        : 0;
      return { ...chunk, similarityScore: score };
    })
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .filter((chunk) => chunk.similarityScore > 0);

  if (ranked.length) return ranked.slice(0, limit);
  if (isDocumentOverview) return chunks.slice(0, limit);
  return [];
}
