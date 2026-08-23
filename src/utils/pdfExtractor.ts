import * as pdfjsLib from 'pdfjs-dist';
import { CourseChunk, LocalCourse } from '../types';

// Set up pdf.js worker URL
// Use standard CDN or inline worker so it works smoothly in Vite
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

export interface ExtractedPdfResult {
  title: string;
  totalPages: number;
  fileSize: number;
  chunks: CourseChunk[];
  formulas: string[];
  summaryPoints: string[];
  fullText: string;
}

/**
 * Extract text, chunks (400 chars + 100 overlap), formulas and summary from a PDF file
 */
export async function extractPdfContent(
  file: File | ArrayBuffer,
  fileName: string,
  courseId: string,
  faculty: string = 'Général'
): Promise<ExtractedPdfResult> {
  let arrayBuffer: ArrayBuffer;
  let fileSize = 0;

  if (file instanceof File) {
    fileSize = file.size;
    arrayBuffer = await file.arrayBuffer();
  } else {
    arrayBuffer = file;
    fileSize = arrayBuffer.byteLength;
  }

  // Load PDF with pdfjs
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;

  const chunks: CourseChunk[] = [];
  const extractedFormulas: Set<string> = new Set();
  const significantSentences: string[] = [];
  let fullText = '';

  const cleanCourseTitle = fileName.replace(/\.[^/.]+$/, '').trim();

  // Iterate over each page
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    let pageText = '';
    let lastY: number | null = null;

    for (const item of textContent.items as any[]) {
      if (item.str) {
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
          pageText += '\n';
        } else if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
          pageText += ' ';
        }
        pageText += item.str;
        lastY = item.transform[5];
      }
    }

    pageText = pageText.trim();
    if (!pageText) continue;

    fullText += `\n--- Page ${pageNum} ---\n` + pageText;

    // Detect mathematical/physical/legal formulas on this page
    extractFormulasFromText(pageText, extractedFormulas);

    // Collect significant sentences for summary
    extractKeySentences(pageText, significantSentences);

    // Chunking: 400 chars with 100 chars overlap
    const chunkSize = 400;
    const overlap = 100;
    let startIdx = 0;
    let chunkIndex = 0;

    while (startIdx < pageText.length) {
      const endIdx = Math.min(startIdx + chunkSize, pageText.length);
      const chunkText = pageText.slice(startIdx, endIdx).trim();

      if (chunkText.length > 30) {
        // Generate lightweight fast embedding representation for cosine similarity
        const embedding = generateOfflineEmbedding(chunkText);

        chunks.push({
          courseId,
          courseTitle: cleanCourseTitle,
          pageNumber: pageNum,
          chunkIndex,
          text: chunkText,
          embedding,
        });
        chunkIndex++;
      }

      if (endIdx >= pageText.length) break;
      startIdx += chunkSize - overlap;
    }
  }

  // Generate 10-point offline summary
  const summaryPoints = generate10PointSummary(significantSentences);

  return {
    title: cleanCourseTitle,
    totalPages,
    fileSize,
    chunks,
    formulas: Array.from(extractedFormulas).slice(0, 40),
    summaryPoints,
    fullText,
  };
}

/**
 * Extract formulas, equations and definitions from text
 */
function extractFormulasFromText(text: string, formulasSet: Set<string>) {
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 5 || trimmed.length > 150) continue;

    // Check for mathematical equations or explicit Formula markers
    const hasEquals = trimmed.includes('=') && /[a-zA-Z0-9]/.test(trimmed);
    const hasFormulaKeyword =
      /formule|équation|theoreme|loi|propriete|principe|article/i.test(trimmed);
    const hasMathSymbols = /[+\-*/^√∫∑λσεΔσμω]/.test(trimmed) && trimmed.includes('=');

    if (hasFormulaKeyword || hasMathSymbols || (hasEquals && !trimmed.startsWith('//'))) {
      // Clean up punctuation
      const cleaned = trimmed.replace(/\s+/g, ' ').replace(/[;,.]$/, '');
      if (cleaned.length >= 6) {
        formulasSet.add(cleaned);
      }
    }
  }
}

/**
 * Extract key declarative sentences for offline summary
 */
function extractKeySentences(text: string, sentencesList: string[]) {
  const rawSentences = text.split(/(?<=[.?!])\s+/);
  for (const sentence of rawSentences) {
    const trimmed = sentence.trim();
    if (trimmed.length > 40 && trimmed.length < 250) {
      // Check if it looks like a definition or key statement
      if (
        /défini|consiste|est un|est une|permet de|se compose|signifie|a pour objet|principe|important|caractérise/i.test(
          trimmed
        )
      ) {
        sentencesList.push(trimmed);
      }
    }
  }
}

/**
 * Generate 10 concise points from key sentences
 */
function generate10PointSummary(sentences: string[]): string[] {
  if (sentences.length === 0) {
    return [
      'Document importé avec succès en mode local.',
      'Contenu textuel indexé page par page.',
      'Prêt pour les calculs et la recherche sémantique hors-ligne.',
    ];
  }

  // Deduplicate and pick top 10 evenly spaced points
  const unique = Array.from(new Set(sentences));
  if (unique.length <= 10) return unique;

  const step = unique.length / 10;
  const result: string[] = [];
  for (let i = 0; i < 10; i++) {
    const idx = Math.min(Math.floor(i * step), unique.length - 1);
    result.push(unique[idx]);
  }
  return result;
}

/**
 * Generate a 64-dimensional local normalized vector embedding
 * 100% offline using character n-grams and hashing trick (fast & zero overhead)
 */
export function generateOfflineEmbedding(text: string): number[] {
  const dim = 64;
  const vector = new Array(dim).fill(0);
  const normalized = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const words = normalized.split(/\W+/).filter((w) => w.length > 2);

  // Unigrams & Bigrams
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = (hash * 31 + word.charCodeAt(j)) & 0xffffffff;
    }
    const idx1 = Math.abs(hash) % dim;
    vector[idx1] += 1.0;

    // Bigram
    if (i < words.length - 1) {
      const bigram = word + '_' + words[i + 1];
      let biHash = 0;
      for (let j = 0; j < bigram.length; j++) {
        biHash = (biHash * 37 + bigram.charCodeAt(j)) & 0xffffffff;
      }
      const idx2 = Math.abs(biHash) % dim;
      vector[idx2] += 1.5;
    }
  }

  // L2 Norm normalization
  let norm = 0;
  for (let i = 0; i < dim; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dim; i++) {
      vector[i] = vector[i] / norm;
    }
  }

  return vector;
}
