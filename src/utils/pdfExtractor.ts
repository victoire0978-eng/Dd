/* eslint-disable @typescript-eslint/no-explicit-any */
import * as pdfjsLib from 'pdfjs-dist';
import type { CourseChunk, ExtractedPdfResult } from '../types';

// Force pdf.js worker to CDN (explicit requested)
(pdfjsLib as any).GlobalWorkerOptions = (pdfjsLib as any).GlobalWorkerOptions || {};
(pdfjsLib as any).GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Existing chunking & helper functions (adapted from original implementation)
function chunkTextIntoPieces(text: string, chunkSize = 400, overlap = 100): string[] {
  const pieces: string[] = [];
  let i = 0;
  while (i < text.length) {
    const part = text.slice(i, i + chunkSize);
    pieces.push(part.trim());
    i += chunkSize - overlap;
  }
  return pieces.filter(Boolean);
}

function generate10PointsFromText(text: string): string[] {
  // Simple heuristic summary: split into sentences and pick first 10 significant lines
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 20);
  return lines.slice(0, 10);
}

function extractFormulasFromText(_: string) {
  // Placeholder: real implementation would regex-detect formulas
  return [] as { formula: string; page: number }[];
}

export async function extractPdfContent(
  file: File | ArrayBuffer,
  fileName: string,
  courseId: string,
  faculty: string = 'Général'
): Promise<ExtractedPdfResult> {
  // Normalize to ArrayBuffer
  const arrayBuffer = file instanceof ArrayBuffer ? file : await (file as File).arrayBuffer();
  const fileSize = arrayBuffer.byteLength;

  // Try parsing with pdf.js first
  try {
    const loadingTask = (pdfjsLib as any).getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages || 1;

    const chunks: CourseChunk[] = [];
    let fullText = '';

    for (let p = 1; p <= totalPages; p++) {
      const page = await pdfDoc.getPage(p);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((it: any) => (it.str || '')).join(' ');
      fullText += '\n' + pageText;

      // chunk page text
      const parts = chunkTextIntoPieces(pageText, 400, 100);
      let chunkIndex = 0;
      for (const part of parts) {
        const chunkId = `${courseId}_p${p}_c${chunkIndex}`;
        chunks.push({
          id: chunkId,
          courseId,
          pageNumber: p,
          chunkIndex,
          text: part,
          embedding: null,
        } as any);
        chunkIndex++;
      }
    }

    const summaryPoints = generate10PointsFromText(fullText);
    const formulas = extractFormulasFromText(fullText);

    return {
      title: fileName,
      totalPages: pdfDoc.numPages,
      fileSize,
      chunks,
      summaryPoints,
      formulas,
      fullText,
    } as ExtractedPdfResult;
  } catch (pdfErr) {
    console.warn('pdf.js parsing failed, attempting OCR fallback', pdfErr);

    // OCR fallback using tesseract.js with pdf.js rendering to canvas per page
    try {
      // dynamic import to keep bundle smaller
      const Tesseract = (await import('tesseract.js')) as any;
      const loadingTask = (pdfjsLib as any).getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdfDoc = await loadingTask.promise;
      const totalPages = pdfDoc.numPages || 1;

      const chunks: CourseChunk[] = [];
      let fullText = '';

      for (let p = 1; p <= totalPages; p++) {
        const page = await pdfDoc.getPage(p);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const context = canvas.getContext('2d')!;
        // render page to canvas
        // @ts-ignore
        await page.render({ canvasContext: context, viewport }).promise;

        // run OCR on canvas
        const { data } = await Tesseract.recognize(canvas, 'fra');
        const text = data?.text || '';
        fullText += '\n' + text;

        const parts = chunkTextIntoPieces(text, 400, 100);
        let chunkIndex = 0;
        for (const part of parts) {
          const chunkId = `${courseId}_p${p}_c${chunkIndex}`;
          chunks.push({
            id: chunkId,
            courseId,
            pageNumber: p,
            chunkIndex,
            text: part,
            embedding: null,
          } as any);
          chunkIndex++;
        }
      }

      const summaryPoints = generate10PointsFromText(fullText);
      const formulas = extractFormulasFromText(fullText);

      return {
        title: fileName,
        totalPages: pdfDoc.numPages,
        fileSize,
        chunks,
        summaryPoints,
        formulas,
        fullText,
      } as ExtractedPdfResult;
    } catch (ocrErr) {
      console.error('OCR fallback failed', ocrErr);
      throw new Error('Impossible d’analyser le PDF via pdf.js et OCR. Le fichier est peut‑être corrompu.');
    }
  }
}
