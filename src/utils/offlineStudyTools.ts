import { CourseChunk, QuizQuestion } from '../types';

/**
 * Extract 10 essential summary points from offline course chunks
 */
export function generateOffline10PointSummary(chunks: CourseChunk[]): string[] {
  if (chunks.length === 0) {
    return ['Aucun contenu disponible pour résumer ce cours.'];
  }

  const allSentences: { text: string; score: number }[] = [];
  const importantKeywords = [
    'défini',
    'consiste',
    'est un',
    'est une',
    'permet',
    'propriété',
    'principe',
    'formule',
    'théorème',
    'règle',
    'loi',
    'concept',
    'essentiel',
    'important',
    'fonction',
    'objectif',
    'méthode',
    'caractéristique',
    'article',
    'structure',
  ];

  for (const chunk of chunks) {
    const rawSentences = chunk.text.split(/(?<=[.!?])\s+/);
    for (const s of rawSentences) {
      const trimmed = s.trim();
      if (trimmed.length > 35 && trimmed.length < 220) {
        let score = 0;
        const lower = trimmed.toLowerCase();
        for (const kw of importantKeywords) {
          if (lower.includes(kw)) score += 2;
        }
        if (/\d/.test(trimmed)) score += 1;
        if (trimmed.includes('=')) score += 2;

        if (score > 0) {
          allSentences.push({ text: trimmed, score });
        }
      }
    }
  }

  if (allSentences.length === 0) {
    return chunks.slice(0, 10).map((c, i) => `Point ${i + 1} (Page ${c.pageNumber}) : ${c.text.slice(0, 120)}...`);
  }

  // Deduplicate and sort by relevance score
  allSentences.sort((a, b) => b.score - a.score);
  const selected: string[] = [];
  const seen = new Set<string>();

  for (const item of allSentences) {
    const simplified = item.text.slice(0, 40).toLowerCase();
    if (!seen.has(simplified)) {
      seen.add(simplified);
      selected.push(item.text);
      if (selected.length === 10) break;
    }
  }

  // If less than 10, fill with other chunks
  if (selected.length < 10 && chunks.length > 0) {
    for (let i = 0; i < chunks.length && selected.length < 10; i++) {
      const snippet = chunks[i].text.slice(0, 140) + '...';
      if (!selected.includes(snippet)) {
        selected.push(snippet);
      }
    }
  }

  return selected;
}

/**
 * Generate 5 interactive Quiz questions (QCM) from offline course chunks
 */
export function generateOfflineQuiz(chunks: CourseChunk[]): QuizQuestion[] {
  if (chunks.length === 0) {
    return [
      {
        id: 1,
        question: 'Le cours est-il bien stocké en local ?',
        options: ['Oui, 100% dans IndexedDB', 'Non, sur un serveur', 'Je ne sais pas'],
        correctIndex: 0,
        explanation: 'DAKIS AI stocke vos cours sur votre appareil pour un usage illimité en mode avion.',
      },
    ];
  }

  const questions: QuizQuestion[] = [];
  const usedChunks = [...chunks].sort(() => 0.5 - Math.random());

  let qId = 1;
  for (const chunk of usedChunks) {
    if (questions.length >= 5) break;

    const sentences = chunk.text.split(/(?<=[.!?])\s+/);
    for (const s of sentences) {
      const trimmed = s.trim();

      // Look for definitional sentences: "X est un/une Y...", "Le principe de X permet de Y..."
      const defMatch = trimmed.match(/^([A-ZÀ-Ÿ][a-zA-ZÀ-ÿ0-9'\s]{3,35})\s+(est\s+(?:un|une|le|la|défini comme|considéré comme))\s+([^.]+)/i);

      if (defMatch && defMatch[1] && defMatch[3]) {
        const subject = defMatch[1].trim();
        const definition = defMatch[3].trim();

        if (definition.length > 15 && definition.length < 160) {
          // Generate 3 distractors
          const distractors = [
            `Une méthode opposée ne concernant pas ${subject}.`,
            `Une variable secondaire sans impact direct sur le système.`,
            `Un concept purement théorique non applicable ici.`,
          ];

          const options = [definition, ...distractors].sort(() => 0.5 - Math.random());
          const correctIndex = options.indexOf(definition);

          questions.push({
            id: qId++,
            question: `Selon le cours (Page ${chunk.pageNumber}), que désigne "${subject}" ?`,
            options,
            correctIndex,
            explanation: `Source (Page ${chunk.pageNumber}) : "${trimmed}"`,
            sourcePage: chunk.pageNumber,
          });

          break;
        }
      }

      // Look for formula sentences
      const formulaMatch = trimmed.match(/([A-Z][a-zA-Z0-9_]*\s*=\s*[a-zA-Z0-9+\-*/^().\s]{3,30})/);
      if (formulaMatch && formulaMatch[1]) {
        const formula = formulaMatch[1].trim();
        const fake1 = formula.replace('+', '-').replace('*', '+');
        const fake2 = formula.replace('=', '≈ 2 *');
        const fake3 = formula.replace('/', '*');

        const options = Array.from(new Set([formula, fake1, fake2, fake3])).slice(0, 4);
        if (options.length >= 3) {
          const correctIndex = options.indexOf(formula);
          questions.push({
            id: qId++,
            question: `Quelle est l'expression correcte mentionnée à la Page ${chunk.pageNumber} ?`,
            options,
            correctIndex,
            explanation: `Extrait du cours : "${trimmed}"`,
            sourcePage: chunk.pageNumber,
          });
          break;
        }
      }
    }
  }

  // If not enough questions generated from regex, generate context comprehension questions
  while (questions.length < 5 && questions.length < chunks.length) {
    const c = chunks[questions.length % chunks.length];
    const snippet = c.text.slice(0, 100).trim();

    questions.push({
      id: qId++,
      question: `À la page ${c.pageNumber}, quelle notion essentielle est abordée ?`,
      options: [
        `${snippet}...`,
        'Aucune mention de ce sujet dans ce chapitre.',
        'Une démonstration réservée aux travaux pratiques.',
        'Un résumé des années précédentes.',
      ],
      correctIndex: 0,
      explanation: `Extrait de la page ${c.pageNumber} : "${c.text.slice(0, 180)}..."`,
      sourcePage: c.pageNumber,
    });
  }

  return questions;
}

/**
 * Extract all formulas, theorems, equations and laws from chunks
 */
export function extractOfflineFormulas(chunks: CourseChunk[]): { formula: string; page: number }[] {
  const list: { formula: string; page: number }[] = [];
  const seen = new Set<string>();

  for (const chunk of chunks) {
    const lines = chunk.text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length < 5 || trimmed.length > 180) continue;

      const hasEquals = trimmed.includes('=') && /[a-zA-Z0-9]/.test(trimmed);
      const hasKeyword = /formule|loi|théorème|équation|principe|article/i.test(trimmed);
      const hasMath = /[+\-*/^√∫∑λσεΔσμω]/.test(trimmed) && trimmed.includes('=');

      if ((hasEquals || hasKeyword || hasMath) && !trimmed.startsWith('//')) {
        const clean = trimmed.replace(/\s+/g, ' ');
        if (!seen.has(clean)) {
          seen.add(clean);
          list.push({ formula: clean, page: chunk.pageNumber });
        }
      }
    }
  }

  return list;
}
