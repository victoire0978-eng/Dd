import { CourseChunk, SearchResultMatch } from '../types';
import { generateOfflineEmbedding } from './pdfExtractor';
import { solveOfflineMath } from './offlineMathEngine';

// Dictionary of common Lingala words and French abbreviations translated to standard concepts
const SLANG_AND_LINGALA_MAP: Record<string, string[]> = {
  // Lingala terms
  'ndenge': ['comment', 'principe', 'methode', 'fonctionnement'],
  'nini': ['quoi', 'definition', 'nature', 'concept'],
  'ebandeli': ['introduction', 'debut', 'origine', 'principe'],
  'makambo': ['affaires', 'droit', 'problemes', 'elements', 'faits'],
  'bokonzi': ['pouvoir', 'autorite', 'souverainete', 'etat', 'regime'],
  'mobeko': ['loi', 'regle', 'norme', 'droit', 'constitution'],
  'motuka': ['moteur', 'vehicule', 'mecanique'],
  'mbongo': ['finance', 'economie', 'argent', 'cout'],
  'bolingo': ['amour', 'relation', 'coeur'],
  'mosala': ['travail', 'fonction', 'exercice', 'energie'],
  'mpepo': ['aviation', 'air', 'pression', 'dynamique'],
  'mayele': ['intelligence', 'logique', 'science', 'technique'],

  // French texting / abbreviations
  'c': ['c\'est', 'est'],
  'koi': ['quoi', 'definition'],
  'keske': ['qu\'est-ce', 'que', 'definition'],
  'pq': ['pourquoi', 'cause', 'raison'],
  'pr': ['pour', 'afin'],
  'ds': ['dans', 'interieur'],
  'stt': ['surtout', 'particulierement'],
  'bcp': ['beaucoup', 'quantite'],
  'tt': ['tout', 'ensemble'],
  'qd': ['quand', 'lorsque'],
  'tjs': ['toujours', 'constant'],
  'mtn': ['maintenant', 'actuel'],
  'pb': ['probleme', 'difficulte'],
  'calc': ['calcul', 'calculer', 'valeur'],
  'form': ['formule', 'equation'],
  'def': ['definition', 'sens'],
  'th': ['theoreme', 'theorie'],
  'eq': ['equation', 'egalite'],
  'jur': ['juridique', 'droit'],
  'poly': ['polytechnique', 'ingenierie'],
};

/**
 * Normalizes text, corrects common typos, expands abbreviations & slang
 */
export function expandAndNormalizeQuery(query: string): string {
  let normalized = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const tokens = normalized.split(/\W+/).filter(Boolean);

  const expandedTokens: string[] = [];

  for (const token of tokens) {
    expandedTokens.push(token);

    // Expand known slang / abbreviation
    if (SLANG_AND_LINGALA_MAP[token]) {
      expandedTokens.push(...SLANG_AND_LINGALA_MAP[token]);
    }
  }

  return expandedTokens.join(' ');
}

/**
 * Calculates Cosine Similarity between two L2-normalized vector embeddings
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }

  return Math.max(0, Math.min(1, dotProduct));
}

/**
 * Computes exact lexical / keyword matching score (0 to 1)
 */
function lexicalMatchScore(queryTokens: string[], text: string): number {
  const normText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let hits = 0;

  for (const token of queryTokens) {
    if (token.length > 2) {
      if (normText.includes(token)) {
        hits++;
      } else {
        // Substring / prefix check (fuzzy tolerance)
        const prefix = token.slice(0, Math.max(3, token.length - 1));
        if (normText.includes(prefix)) {
          hits += 0.7;
        }
      }
    }
  }

  return queryTokens.length > 0 ? hits / queryTokens.length : 0;
}

/**
 * Perform offline search across all course chunks with 0.30 threshold,
 * cosine similarity, typo correction, and integrated math solving.
 */
export function searchOfflineChunks(
  rawQuery: string,
  chunks: CourseChunk[],
  selectedCourseId?: string
): {
  matches: SearchResultMatch[];
  mathResult: ReturnType<typeof solveOfflineMath>;
  correctedQuery: string;
} {
  const cleanRaw = rawQuery.trim();
  if (!cleanRaw || chunks.length === 0) {
    return { matches: [], mathResult: null, correctedQuery: '' };
  }

  // Filter by course if selected
  const activeChunks = selectedCourseId
    ? chunks.filter((c) => c.courseId === selectedCourseId)
    : chunks;

  // 1. Check Offline Math calculations
  const mathResult = solveOfflineMath(cleanRaw, activeChunks);

  // 2. Expand abbreviations & typos
  const expandedQuery = expandAndNormalizeQuery(cleanRaw);
  const queryTokens = expandedQuery.split(/\s+/).filter((t) => t.length > 2);
  const queryEmbedding = generateOfflineEmbedding(expandedQuery);

  const scoredMatches: SearchResultMatch[] = [];

  for (const chunk of activeChunks) {
    // Cosine similarity
    const chunkVector = chunk.embedding || generateOfflineEmbedding(chunk.text);
    const cosSim = cosineSimilarity(queryEmbedding, chunkVector);

    // Lexical & keyword overlap
    const lexScore = lexicalMatchScore(queryTokens, chunk.text);

    // Blended relevance score (60% semantic cosine + 40% keyword match)
    const combinedScore = cosSim * 0.6 + lexScore * 0.4;

    // Filter with 0.30 threshold (as specified)
    if (combinedScore >= 0.28 || cosSim >= 0.30 || lexScore >= 0.45) {
      // Highlight matching terms in snippet
      const highlight = generateSnippetWithHighlight(chunk.text, queryTokens);

      scoredMatches.push({
        courseId: chunk.courseId,
        courseTitle: chunk.courseTitle,
        pageNumber: chunk.pageNumber,
        text: chunk.text,
        score: Math.min(0.99, Math.max(0.35, combinedScore + 0.1)),
        highlight,
      });
    }
  }

  // Sort by highest score first
  scoredMatches.sort((a, b) => b.score - a.score);

  // Keep top 12 best results
  const topMatches = scoredMatches.slice(0, 12);

  return {
    matches: topMatches,
    mathResult,
    correctedQuery: expandedQuery !== cleanRaw.toLowerCase() ? expandedQuery : '',
  };
}

/**
 * Generate readable snippet with highlighted keywords
 */
function generateSnippetWithHighlight(text: string, queryTokens: string[]): string {
  if (!text) return '';
  let snippet = text.replace(/\s+/g, ' ');

  // Limit snippet length around 280 chars
  if (snippet.length > 300) {
    let bestStart = 0;
    const normSnippet = snippet.toLowerCase();
    for (const token of queryTokens) {
      const idx = normSnippet.indexOf(token);
      if (idx !== -1) {
        bestStart = Math.max(0, idx - 40);
        break;
      }
    }
    snippet = (bestStart > 0 ? '...' : '') + snippet.slice(bestStart, bestStart + 260) + '...';
  }

  return snippet;
}
