import { DakisMemory, Message, ChatSession } from '../types';
import {
  hashSHA256,
  verifyPasswordHash,
  DEFAULT_HASHES,
} from './crypto';

export const STORAGE_KEY = 'dakis_memory';
export const DEVICE_KEY = 'dakis_device_id';
export const SESSIONS_KEY = 'dakis_chat_sessions'; // legacy single session backup
export const ALL_SESSIONS_KEY = 'dakis_all_chat_sessions'; // multi-session list
export const ACTIVE_SESSION_ID_KEY = 'dakis_active_session_id';
export const QUEEN_MODE_KEY = 'dakis_queen_mode';
export const BOSS_MODE_KEY = 'dakis_boss_mode';
export const VOICE_AUTO_SPEAK_KEY = 'dakis_voice_auto_speak';

export const DEFAULT_MEMORY: DakisMemory = {
  magic_word_hash: DEFAULT_HASHES.MAGIC_WORD_HASH,
  queen_password_hash: DEFAULT_HASHES.QUEEN_PASSWORD_HASH,
  boss_password_hash: DEFAULT_HASHES.BOSS_PASSWORD_HASH,
  creator: {
    nom: 'KAZINGUVU MONGA ISMAEL',
    infos: "Créateur de DAKIS AI. Étudiant à l'Unilu en Polytech. Habite Lubumbashi, Ruashi. 1m80+, timide et parfois renfermé. Passionné de manga et d'informatique. Fan de rap français, artiste préféré Bouss."
  },
  girlfriend: {
    nom: 'BAMUSWE MUSANGA Daniella alias DAKIS',
    infos: "Meuf de ISMAEL. Passionnée de Droit. Série préférée: Summer Love. Aime trop les frites. Gentille, timide en vrai, un peu taquine. Fut secrétaire dans une école de la place. Étudiante à l'Université Protestante de Lubumbashi, BAC1 Droit. Surnom à l'univ: La fille aux beaux yeux. Peau très claire, beaux yeux, taille moyenne trop mignonne."
  },
  personnes_autorisees: ['ISMAEL', 'Daniella', 'DAKIS'],
  personnes_connues: {},
  unlocked_users: []
};

// Voice Auto-Speak setting
export function getVoiceAutoSpeak(): boolean {
  try {
    return localStorage.getItem(VOICE_AUTO_SPEAK_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

export function setVoiceAutoSpeak(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem(VOICE_AUTO_SPEAK_KEY, 'true');
    } else {
      localStorage.removeItem(VOICE_AUTO_SPEAK_KEY);
    }
  } catch (e) {}
}

// Sanitize messages array to prevent corrupt render crashes or XSS payloads
export function sanitizeMessages(raw: any): Message[] {
  if (!Array.isArray(raw)) return [];
  const valid: Message[] = [];

  for (let i = 0; i < Math.min(raw.length, 120); i++) {
    const item = raw[i];
    if (!item || typeof item !== 'object') continue;

    const role = item.role === 'user' ? 'user' : 'model';
    // Limit message content size to prevent memory bloat
    const rawContent = typeof item.content === 'string' ? item.content : String(item.content || '');
    const content = rawContent.slice(0, 10000);
    const id = typeof item.id === 'string' && item.id.length > 0 ? item.id.slice(0, 80) : `msg_${Date.now()}_${i}`;
    const timestamp = typeof item.timestamp === 'number' && !isNaN(item.timestamp) ? item.timestamp : Date.now();

    valid.push({
      id,
      role,
      content,
      timestamp,
      isUnlockedSecret: !!item.isUnlockedSecret,
      isLockedNotice: !!item.isLockedNotice,
    });
  }

  return valid;
}

// Generate smart title from first user message
export function generateSessionTitle(messages: Message[]): string {
  const firstUserMsg = messages.find((m) => m.role === 'user');
  if (!firstUserMsg || !firstUserMsg.content) return 'Nouvelle discussion';
  const clean = firstUserMsg.content.trim().replace(/[#*_]/g, '');
  if (clean.length > 38) {
    return clean.slice(0, 35) + '...';
  }
  return clean || 'Discussion DAKIS';
}

// Load all saved chat sessions
export function getAllSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(ALL_SESSIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((s: any) => ({
          id: String(s.id || `session_${Date.now()}`),
          title: String(s.title || 'Discussion').slice(0, 50),
          messages: sanitizeMessages(s.messages),
          createdAt: Number(s.createdAt) || Date.now(),
          updatedAt: Number(s.updatedAt) || Date.now(),
        }));
      }
    }
  } catch (e) {
    console.warn('Failed to parse all sessions from localStorage:', e);
  }
  return [];
}

// Save all sessions to localStorage
export function saveAllSessions(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(ALL_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.warn('Failed to save sessions to localStorage:', e);
  }
}

// Get active session ID
export function getActiveSessionId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_SESSION_ID_KEY);
  } catch (e) {
    return null;
  }
}

// Set active session ID
export function setActiveSessionId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_SESSION_ID_KEY, id);
  } catch (e) {}
}

// Load or initialize active session
export function loadActiveSession(defaultGreeting: Message): { currentSession: ChatSession; allSessions: ChatSession[] } {
  let all = getAllSessions();

  // If no sessions in all_sessions, check legacy single session storage
  if (all.length === 0) {
    try {
      const legacyRaw = localStorage.getItem(SESSIONS_KEY);
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw);
        const cleaned = sanitizeMessages(legacyParsed);
        if (cleaned.length > 0) {
          const legacySession: ChatSession = {
            id: `session_${Date.now()}`,
            title: generateSessionTitle(cleaned),
            messages: cleaned,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          all = [legacySession];
          saveAllSessions(all);
          setActiveSessionId(legacySession.id);
          return { currentSession: legacySession, allSessions: all };
        }
      }
    } catch (e) {}

    // Otherwise create first default session
    const firstSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: 'Discussion principale',
      messages: [defaultGreeting],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    all = [firstSession];
    saveAllSessions(all);
    setActiveSessionId(firstSession.id);
    return { currentSession: firstSession, allSessions: all };
  }

  const activeId = getActiveSessionId();
  let found = all.find((s) => s.id === activeId);

  if (!found) {
    // Pick the most recent session
    found = all.sort((a, b) => b.updatedAt - a.updatedAt)[0];
    if (found) {
      setActiveSessionId(found.id);
    }
  }

  if (!found) {
    found = {
      id: `session_${Date.now()}`,
      title: 'Discussion',
      messages: [defaultGreeting],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    all.unshift(found);
    saveAllSessions(all);
    setActiveSessionId(found.id);
  }

  return { currentSession: found, allSessions: all };
}

// Persist messages of active session and update title if still default
export function saveActiveSessionMessages(
  sessionId: string,
  messages: Message[]
): ChatSession[] {
  const all = getAllSessions();
  const sanitized = sanitizeMessages(messages);
  const index = all.findIndex((s) => s.id === sessionId);

  if (index !== -1) {
    const existing = all[index];
    const shouldUpdateTitle =
      existing.title === 'Nouvelle discussion' ||
      existing.title === 'Discussion' ||
      existing.title === 'Discussion principale';

    all[index] = {
      ...existing,
      messages: sanitized,
      title: shouldUpdateTitle ? generateSessionTitle(sanitized) : existing.title,
      updatedAt: Date.now(),
    };
  } else {
    const newSession: ChatSession = {
      id: sessionId,
      title: generateSessionTitle(sanitized),
      messages: sanitized,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    all.unshift(newSession);
  }

  saveAllSessions(all);
  // Also backup to legacy SESSIONS_KEY for compatibility
  saveMessages(sanitized);
  return all;
}

// Create a new session
export function createNewSession(
  defaultGreeting: Message,
  title?: string
): { newSession: ChatSession; allSessions: ChatSession[] } {
  const all = getAllSessions();
  const newSession: ChatSession = {
    id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: title || 'Nouvelle discussion',
    messages: [defaultGreeting],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  all.unshift(newSession);
  saveAllSessions(all);
  setActiveSessionId(newSession.id);
  saveMessages([defaultGreeting]);

  return { newSession, allSessions: all };
}

// Rename a session
export function renameSession(sessionId: string, newTitle: string): ChatSession[] {
  const all = getAllSessions();
  const cleanTitle = (newTitle || '').trim().slice(0, 50);
  if (!cleanTitle) return all;

  const target = all.find((s) => s.id === sessionId);
  if (target) {
    target.title = cleanTitle;
    target.updatedAt = Date.now();
    saveAllSessions(all);
  }
  return all;
}

// Delete a session
export function deleteSession(
  sessionId: string,
  defaultGreeting: Message
): { remainingSessions: ChatSession[]; activeSession: ChatSession } {
  let all = getAllSessions().filter((s) => s.id !== sessionId);

  if (all.length === 0) {
    const fresh: ChatSession = {
      id: `session_${Date.now()}`,
      title: 'Nouvelle discussion',
      messages: [defaultGreeting],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    all = [fresh];
  }

  saveAllSessions(all);
  const newActive = all[0];
  setActiveSessionId(newActive.id);
  saveMessages(newActive.messages);

  return { remainingSessions: all, activeSession: newActive };
}

// Legacy helpers
export function loadSavedMessages(defaultGreeting: Message): Message[] {
  const { currentSession } = loadActiveSession(defaultGreeting);
  return currentSession.messages;
}

export function saveMessages(messages: Message[]): void {
  try {
    const sanitized = sanitizeMessages(messages);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sanitized));
  } catch (e) {}
}

// Generate or retrieve unique device ID with entropy
export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    const randomEntropy = Math.random().toString(36).substring(2, 10);
    const timestampEntropy = Date.now().toString(36);
    id = 'dev_' + hashSHA256(`${randomEntropy}_${timestampEntropy}`).substring(0, 16);
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

// Check if DAKIS Queen mode is active
export function isDakisQueenMode(): boolean {
  try {
    return localStorage.getItem(QUEEN_MODE_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

// Set or unset DAKIS Queen mode
export function setDakisQueenMode(active: boolean): void {
  try {
    if (active) {
      localStorage.setItem(QUEEN_MODE_KEY, 'true');
      localStorage.removeItem(BOSS_MODE_KEY); // Exclusive mode
    } else {
      localStorage.removeItem(QUEEN_MODE_KEY);
    }
    window.dispatchEvent(new Event('dakis_memory_updated'));
  } catch (e) {
    console.error('Failed to set DAKIS Queen mode:', e);
  }
}

// Check if ISMAEL Boss mode is active
export function isIsmaelBossMode(): boolean {
  try {
    return localStorage.getItem(BOSS_MODE_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

// Set or unset ISMAEL Boss mode
export function setIsmaelBossMode(active: boolean): void {
  try {
    if (active) {
      localStorage.setItem(BOSS_MODE_KEY, 'true');
      localStorage.removeItem(QUEEN_MODE_KEY); // Exclusive mode
    } else {
      localStorage.removeItem(BOSS_MODE_KEY);
    }
    window.dispatchEvent(new Event('dakis_memory_updated'));
  } catch (e) {
    console.error('Failed to set ISMAEL Boss mode:', e);
  }
}

// Exit all secret modes and return to standard mode / lock
export function exitSecretModes(): void {
  try {
    localStorage.removeItem(QUEEN_MODE_KEY);
    localStorage.removeItem(BOSS_MODE_KEY);
    const memory = getMemory();
    const deviceId = getDeviceId();
    memory.unlocked_users = memory.unlocked_users.filter((id) => id !== deviceId);
    saveMemory(memory);
    window.dispatchEvent(new Event('dakis_memory_updated'));
  } catch (e) {
    console.error('Failed to exit secret modes:', e);
  }
}

// Check if input matches DAKIS secret password hash ("mon tout" by default or custom)
export function isDakisPasswordMatch(input: string, customHash?: string): boolean {
  if (!input) return false;
  const memory = getMemory();
  const targetHash = customHash || memory.queen_password_hash || DEFAULT_HASHES.QUEEN_PASSWORD_HASH;
  return verifyPasswordHash(input, targetHash);
}

// Check if input matches ISMAEL Boss secret password hash ("ma vie" by default or custom)
export function isIsmaelPasswordMatch(input: string, customHash?: string): boolean {
  if (!input) return false;
  const memory = getMemory();
  const targetHash = customHash || memory.boss_password_hash || DEFAULT_HASHES.BOSS_PASSWORD_HASH;
  return verifyPasswordHash(input, targetHash);
}

// Check if input matches Family magic word password hash ("bouss2026" by default or custom)
export function isFamilyMagicWordMatch(input: string, customHash?: string): boolean {
  if (!input) return false;
  const memory = getMemory();
  const targetHash = customHash || memory.magic_word_hash || DEFAULT_HASHES.MAGIC_WORD_HASH;
  return verifyPasswordHash(input, targetHash);
}

// Check if any admin credential matches (Boss, Queen, or Magic word)
export function verifyAdminPassword(input: string): boolean {
  return (
    isIsmaelPasswordMatch(input) ||
    isDakisPasswordMatch(input) ||
    isFamilyMagicWordMatch(input)
  );
}

// Load memory from localStorage with automatic migration to SHA-256
export function getMemory(): DakisMemory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MEMORY));
      return { ...DEFAULT_MEMORY };
    }
    const parsed = JSON.parse(raw);

    // Auto-migration: If old plaintext exists, hash it with SHA-256 and remove plaintext
    let needsMigrationSave = false;

    let magicHash = parsed.magic_word_hash;
    if (!magicHash) {
      magicHash = parsed.magic_word ? hashSHA256(parsed.magic_word) : DEFAULT_HASHES.MAGIC_WORD_HASH;
      needsMigrationSave = true;
    }

    let queenHash = parsed.queen_password_hash;
    if (!queenHash) {
      queenHash = parsed.queen_password ? hashSHA256(parsed.queen_password) : DEFAULT_HASHES.QUEEN_PASSWORD_HASH;
      needsMigrationSave = true;
    }

    let bossHash = parsed.boss_password_hash;
    if (!bossHash) {
      bossHash = parsed.boss_password ? hashSHA256(parsed.boss_password) : DEFAULT_HASHES.BOSS_PASSWORD_HASH;
      needsMigrationSave = true;
    }

    // Delete legacy plain text properties if present
    if (parsed.magic_word || parsed.queen_password || parsed.boss_password) {
      delete parsed.magic_word;
      delete parsed.queen_password;
      delete parsed.boss_password;
      needsMigrationSave = true;
    }

    const migrated: DakisMemory = {
      magic_word_hash: magicHash,
      queen_password_hash: queenHash,
      boss_password_hash: bossHash,
      creator: { ...DEFAULT_MEMORY.creator, ...(parsed.creator || {}) },
      girlfriend: { ...DEFAULT_MEMORY.girlfriend, ...(parsed.girlfriend || {}) },
      personnes_autorisees: Array.isArray(parsed.personnes_autorisees)
        ? parsed.personnes_autorisees
        : DEFAULT_MEMORY.personnes_autorisees,
      personnes_connues: parsed.personnes_connues || {},
      unlocked_users: Array.isArray(parsed.unlocked_users) ? parsed.unlocked_users : []
    };

    if (needsMigrationSave) {
      saveMemory(migrated);
    }

    return migrated;
  } catch (e) {
    console.error('Failed to parse dakis_memory:', e);
    return { ...DEFAULT_MEMORY };
  }
}

// Save memory to localStorage (ALWAYS ensures only SHA-256 hashes are stored)
export function saveMemory(memory: DakisMemory): void {
  try {
    // Sanitization: Ensure never saving plaintext passwords
    const cleanMemory: DakisMemory = {
      magic_word_hash: memory.magic_word_hash || DEFAULT_HASHES.MAGIC_WORD_HASH,
      queen_password_hash: memory.queen_password_hash || DEFAULT_HASHES.QUEEN_PASSWORD_HASH,
      boss_password_hash: memory.boss_password_hash || DEFAULT_HASHES.BOSS_PASSWORD_HASH,
      creator: {
        nom: String(memory.creator?.nom || '').slice(0, 100),
        infos: String(memory.creator?.infos || '').slice(0, 1000),
      },
      girlfriend: {
        nom: String(memory.girlfriend?.nom || '').slice(0, 100),
        infos: String(memory.girlfriend?.infos || '').slice(0, 1000),
      },
      personnes_autorisees: Array.isArray(memory.personnes_autorisees)
        ? memory.personnes_autorisees.map((s) => String(s).slice(0, 50))
        : DEFAULT_MEMORY.personnes_autorisees,
      personnes_connues: memory.personnes_connues || {},
      unlocked_users: Array.isArray(memory.unlocked_users) ? memory.unlocked_users : [],
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanMemory));
    window.dispatchEvent(new Event('dakis_memory_updated'));
  } catch (e) {
    console.error('Failed to save dakis_memory:', e);
  }
}

// Check if current device is unlocked
export function isDeviceUnlocked(): boolean {
  if (isDakisQueenMode() || isIsmaelBossMode()) return true;
  const memory = getMemory();
  const deviceId = getDeviceId();
  return memory.unlocked_users.includes(deviceId);
}

export type UnlockMode = 'queen' | 'boss' | 'family' | 'none';

// Unlock current device if password matches SHA-256 target hash
export function unlockWithMagicWord(word: string): { success: boolean; mode: UnlockMode; isQueen: boolean; isBoss: boolean } {
  const trimmed = (word || '').trim();
  const memory = getMemory();

  // 1. Check ISMAEL Boss password ("ma vie")
  if (isIsmaelPasswordMatch(trimmed, memory.boss_password_hash)) {
    setIsmaelBossMode(true);
    const deviceId = getDeviceId();
    if (!memory.unlocked_users.includes(deviceId)) {
      memory.unlocked_users.push(deviceId);
      saveMemory(memory);
    }
    return { success: true, mode: 'boss', isQueen: false, isBoss: true };
  }

  // 2. Check DAKIS Queen password ("mon tout")
  if (isDakisPasswordMatch(trimmed, memory.queen_password_hash)) {
    setDakisQueenMode(true);
    const deviceId = getDeviceId();
    if (!memory.unlocked_users.includes(deviceId)) {
      memory.unlocked_users.push(deviceId);
      saveMemory(memory);
    }
    return { success: true, mode: 'queen', isQueen: true, isBoss: false };
  }

  // 3. Check Family Magic Word ("bouss2026")
  if (isFamilyMagicWordMatch(trimmed, memory.magic_word_hash)) {
    setDakisQueenMode(false);
    setIsmaelBossMode(false);
    const deviceId = getDeviceId();
    if (!memory.unlocked_users.includes(deviceId)) {
      memory.unlocked_users.push(deviceId);
      saveMemory(memory);
    }
    return { success: true, mode: 'family', isQueen: false, isBoss: false };
  }

  return { success: false, mode: 'none', isQueen: false, isBoss: false };
}

// Lock current device
export function lockCurrentDevice(): void {
  exitSecretModes();
}

// Add or update known person
export function saveKnownPerson(nom: string, infos: string): DakisMemory {
  const memory = getMemory();
  if (!memory.personnes_connues) {
    memory.personnes_connues = {};
  }
  memory.personnes_connues[nom.trim()] = infos.trim();
  saveMemory(memory);
  return memory;
}

// Remove known person
export function removeKnownPerson(nom: string): DakisMemory {
  const memory = getMemory();
  if (memory.personnes_connues && memory.personnes_connues[nom]) {
    delete memory.personnes_connues[nom];
    saveMemory(memory);
  }
  return memory;
}

// Update all passwords in memory (converts to SHA-256 hash immediately)
export function updatePasswords(
  magicWord?: string,
  queenPassword?: string,
  bossPassword?: string
): DakisMemory {
  const memory = getMemory();
  if (magicWord !== undefined && magicWord.trim().length > 0) {
    memory.magic_word_hash = hashSHA256(magicWord.trim());
  }
  if (queenPassword !== undefined && queenPassword.trim().length > 0) {
    memory.queen_password_hash = hashSHA256(queenPassword.trim());
  }
  if (bossPassword !== undefined && bossPassword.trim().length > 0) {
    memory.boss_password_hash = hashSHA256(bossPassword.trim());
  }
  saveMemory(memory);
  return memory;
}

// Reset memory back to default
export function resetMemory(): DakisMemory {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MEMORY));
  window.dispatchEvent(new Event('dakis_memory_updated'));
  return { ...DEFAULT_MEMORY };
}

// Generates an HMAC-like cryptographic proof for client-to-server requests
export function generateAuthToken(mode: 'boss' | 'queen' | 'family' | 'guest'): string {
  const deviceId = getDeviceId();
  const memory = getMemory();
  let secretHash = 'guest';

  if (mode === 'boss') secretHash = memory.boss_password_hash;
  else if (mode === 'queen') secretHash = memory.queen_password_hash;
  else if (mode === 'family') secretHash = memory.magic_word_hash;

  return hashSHA256(`${deviceId}:${mode}:${secretHash}`);
}

// Check if message asks about private info
export function isPrivateInfoQuery(query: string): boolean {
  const q = query.toLowerCase();
  const patterns = [
    /qui (est|sont|c'est) (ismael|dakis|daniella|le créateur|sa copine|sa meuf)/i,
    /c'est qui (ismael|dakis|daniella|la fille aux beaux yeux|le boss)/i,
    /infos? sur (ismael|dakis|daniella|eux|vous)/i,
    /vous habitez o[uù]/i,
    /o[uù] habite (ismael|dakis|daniella)/i,
    /parle(-| )moi de (vous( deux)?|ismael|dakis|daniella)/i,
    /qui es-tu.*(ismael|dakis)/i,
    /raconte(-| )moi sur (ismael|dakis|daniella)/i,
    /secret/i,
    /la fille aux beaux yeux/i
  ];
  return patterns.some((p) => p.test(q));
}

// Generates intelligent, persona-aligned fallback replies if device is offline or API fails
export function generateOfflineFallbackResponse(
  userQuery: string,
  isBoss: boolean,
  isQueen: boolean,
  isUnlocked: boolean,
  memory: DakisMemory
): string {
  const q = (userQuery || '').toLowerCase();

  if (isBoss) {
    if (q.includes('daniella') || q.includes('dakis') || q.includes('amour') || q.includes('poeme') || q.includes('reine') || q.includes('coeur')) {
      return `👑 **Mon Boss Suprême ISMAEL**, voici une pensée romantique pour votre reine Daniella (DAKIS) :\n\n*"Dans les équations les plus complexes de la vie, ton regard reste la plus belle des certitudes. Tu es ma reine aux yeux d'or, et chaque projet que je bâtis en ingénierie est guidé par notre amour."* ❤️\n\n*(⚡ DAKIS AI Résilience Active)*`;
    }
    if (q.includes('bouss') || q.includes('rap') || q.includes('punchline') || q.includes('musique')) {
      return `🔥 **Pour mon Boss ISMAEL (Force & Motivation de Boss) :**\n\n*"On avance avec rigueur et détermination, sans jamais reculer devant l'obstacle."* (Vibe Bouss)\n\nBoss, continuez de dominer Polytech et vos projets informatiques. Le sommet vous appartient ! ⚡\n\n*(⚡ DAKIS AI)*`;
    }
    if (q.includes('polytech') || q.includes('code') || q.includes('python') || q.includes('math') || q.includes('calcul') || q.includes('unilu') || q.includes('algo')) {
      return `⚡ **Espace Polytech & Ingénierie Unilu (Boss ISMAEL) :**\n\nÀ vos ordres, Mon Boss ! La rigueur mathématique et l'excellence algorithmique sont nos priorités absolues. Posez-moi vos questions de sciences appliquées, d'analyse numérique ou d'architecture logicielle.\n\n*(⚡ DAKIS AI)*`;
    }
    return `👑⚡ **Salutations respectueuses Boss ISMAEL !** Je suis opérationnel et toujours à vos côtés pour exécuter vos directives d'ingénierie, de code ou pour surprendre votre reine Daniella.`;
  }

  if (isQueen) {
    if (q.includes('droit') || q.includes('upl') || q.includes('cours') || q.includes('quiz') || q.includes('juriste') || q.includes('loi')) {
      return `⚖️ **Pour ma Reine Daniella (Future Grande Juriste BAC1 UPL) :**\n\nEn Droit civil comme en Droit constitutionnel, la précision des définitions et la rigueur du raisonnement juridique font toute la différence. Vous avez tout le talent et la force pour exceller à l'Université Protestante de Lubumbashi ! 👑\n\n*(👑 Mode spécial Reine Daniella)*`;
    }
    if (q.includes('frite') || q.includes('recette') || q.includes('gourmand') || q.includes('manger')) {
      return `🍟 **La Pause Gourmande de la Reine Daniella :**\n\nPour des frites croustillantes à souhait : premier bain d'huile à 150°C pendant 6 min, laissez reposer, puis second bain à 180°C pendant 3 min. Servez bien chaud avec une touche d'amour ! Bon appétit Votre Majesté ✨`;
    }
    if (q.includes('amour') || q.includes('ismael') || q.includes('message') || q.includes('lettre')) {
      return `❤️ **Message d'ISMAEL pour sa Reine Daniella :**\n\nISMAEL vous aime de tout son cœur. Il pense à sa reine aux plus beaux yeux du monde à chaque instant et travaille chaque jour pour bâtir votre avenir commun. Vous êtes sa priorité absolue ! 👑💖`;
    }
    return `👑 **Bienvenue ma Reine Daniella !** C'est un bonheur d'être à votre service. De quoi avez-vous envie aujourd'hui pour vos révisions de Droit ou votre journée ? ❤️`;
  }

  if (!isUnlocked && (q.includes('ismael') || q.includes('daniella') || q.includes('dakis') || q.includes('secret') || q.includes('couple'))) {
    return `Info privée 🔒 Entre le mot de passe secret pour débloquer les informations intimes sur ISMAEL & Daniella.`;
  }

  if (isUnlocked) {
    return `❤️ **Espace Famille Déverrouillé :**\n\nISMAEL (notre créateur génie polytechnicien à l'Unilu) et Daniella (sa magnifique reine étudiante en Droit à l'UPL) forment un couple formidable. Pose-moi tes questions sur leurs passions et leurs projets !`;
  }

  return `Yo c'est DAKIS AI 🥰 L'IA intelligente créée par ISMAEL pour lui et Daniella. Je suis à ton service pour t'aider dans tes cours, tes révisions, le code et la culture générale ! Que souhaites-tu explorer ?`;
}
