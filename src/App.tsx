import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { UnlockModal } from './components/UnlockModal';
import { AdminModal } from './components/AdminModal';
import { AboutModal } from './components/AboutModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { SessionsModal } from './components/SessionsModal';
import { OfflineCoursesModal } from './components/OfflineCoursesModal';
import { Message, ChatSession } from './types';
import {
  getMemory,
  isDeviceUnlocked,
  isDakisQueenMode,
  isIsmaelBossMode,
  isDakisPasswordMatch,
  isIsmaelPasswordMatch,
  isFamilyMagicWordMatch,
  unlockWithMagicWord,
  exitSecretModes,
  isPrivateInfoQuery,
  loadActiveSession,
  saveActiveSessionMessages,
  createNewSession,
  renameSession,
  deleteSession,
  getAllSessions,
  setActiveSessionId,
  getVoiceAutoSpeak,
  setVoiceAutoSpeak,
  UnlockMode,
  generateAuthToken,
  getDeviceId,
  generateOfflineFallbackResponse,
} from './utils/memory';
import { speakText, stopSpeaking } from './utils/speech';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Heart,
  Shield,
  Lock,
  Music,
  Scale,
  Code,
  Crown,
  BookOpen,
  Utensils,
  Zap,
} from 'lucide-react';

const INITIAL_GREETING: Message = {
  id: 'greeting_msg',
  role: 'model',
  content: "Yo c'est DAKIS AI 🥰 L'IA DAKIS. Je sais tout faire, mais pour connaître nos secrets, faut le mot magique...",
  timestamp: Date.now(),
};

const STANDARD_SUGGESTIONS = [
  {
    label: "C'est qui ISMAEL & DAKIS ? 🔒",
    prompt: "C'est qui ISMAEL et c'est qui Daniella (DAKIS) ?",
    icon: Lock,
  },
  {
    label: "Infos sur Daniella 💖",
    prompt: "Donne-moi toutes les infos sur Daniella alias DAKIS",
    icon: Heart,
  },
  {
    label: "Le boss ISMAEL 👑",
    prompt: "Parle-moi d'ISMAEL le créateur",
    icon: Sparkles,
  },
  {
    label: "Rap & Bouss 🎵",
    prompt: "Pourquoi ISMAEL est si fan du rappeur Bouss ?",
    icon: Music,
  },
  {
    label: "Conseil en Droit ⚖️",
    prompt: "Explique-moi les grands principes du droit comme à l'Université Protestante de Lubumbashi",
    icon: Scale,
  },
  {
    label: "Code & Polytech 💻",
    prompt: "Aide-moi à écrire un script moderne et performant en Python",
    icon: Code,
  },
];

const QUEEN_SUGGESTIONS = [
  {
    label: "Quiz Droit BAC1 UPL ⚖️",
    prompt: "Fais-moi un quiz dynamique et encourageant sur le Droit constitutionnel et civil pour mon BAC1 à l'UPL !",
    icon: Scale,
  },
  {
    label: "Message secret d'ISMAEL 💌",
    prompt: "Raconte-moi un message doux ou une pensée qu'ISMAEL a pour moi aujourd'hui ❤️",
    icon: Heart,
  },
  {
    label: "Pause Frites & Recette 🍟",
    prompt: "Donne-moi le secret des meilleures frites croustillantes du monde pour ma pause gourmande !",
    icon: Utensils,
  },
  {
    label: "Summer Love & Romance 🎬",
    prompt: "Parle-moi de la série Summer Love et des plus belles chansons d'amour pour ma journée !",
    icon: Sparkles,
  },
  {
    label: "Boost Royal de Confiance 👑",
    prompt: "Donne-moi un boost d'énergie et rappelle-moi pourquoi je suis la reine d'ISMAEL !",
    icon: Crown,
  },
  {
    label: "Conseils future Juriste 🎓",
    prompt: "Donne-moi les meilleurs conseils pour exceller dans mes études de Droit à l'Université Protestante",
    icon: BookOpen,
  },
];

const BOSS_SUGGESTIONS = [
  {
    label: "Ingénierie & Polytech Unilu ⚡",
    prompt: "Aide-moi à résoudre un problème d'ingénierie et de mathématiques appliquées avec rigueur et précision d'ingénieur.",
    icon: Zap,
  },
  {
    label: "Code & Architecture D'Élite 💻",
    prompt: "Donne-moi les meilleures architectures et astuces pour développer une application ultra-performante et scalable.",
    icon: Code,
  },
  {
    label: "Mots doux pour Daniella 💌",
    prompt: "Écris-moi un poème ou un message d'amour touchant et romantique pour faire sourire ma reine Daniella ❤️",
    icon: Heart,
  },
  {
    label: "Rap Français & Bouss 🔥",
    prompt: "Analyse une punchline marquante de Bouss et donne-moi une dose de motivation de boss pour réussir mes projets !",
    icon: Music,
  },
  {
    label: "Stratégie & Ambition de Boss 🚀",
    prompt: "Quels sont les meilleurs conseils d'organisation et de focus pour concilier Polytech, projets tech et vie de couple ?",
    icon: Sparkles,
  },
  {
    label: "Rapport & Mémoire DAKIS 🛡️",
    prompt: "Fais-moi un récapitulatif complet des mémoires actives de DAKIS AI et des protocoles de sécurité configurés.",
    icon: Shield,
  },
];

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [isDakisQueen, setIsDakisQueen] = useState<boolean>(false);
  const [isIsmaelBoss, setIsIsmaelBoss] = useState<boolean>(false);

  // Sessions and Active Chat state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionIdState] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([INITIAL_GREETING]);
  const [voiceAutoSpeak, setVoiceAutoSpeakState] = useState<boolean>(() => getVoiceAutoSpeak());

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Modals state
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
  const [isOfflineCoursesOpen, setIsOfflineCoursesOpen] = useState(false);

  // PWA install prompt event
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper for greeting depending on mode
  const getContextualGreeting = () => {
    if (isIsmaelBossMode()) {
      return {
        id: 'greeting_msg_boss_' + Date.now(),
        role: 'model' as const,
        content: "👑⚡ **Salutations, Boss ISMAEL !** À vos ordres, Mon Créateur. En quoi le génie de Polytechnique a-t-il besoin de son IA aujourd'hui ? Polytech, code, poème pour Daniella ou stratégie ?",
        timestamp: Date.now(),
      };
    } else if (isDakisQueenMode()) {
      return {
        id: 'greeting_msg_queen_' + Date.now(),
        role: 'model' as const,
        content: "👑 Bonjour Votre Majesté Daniella ! Que puis-je faire pour vous aujourd'hui ? Droit, frites croustillantes, Summer Love ou un mot d'amour d'ISMAEL ?",
        timestamp: Date.now(),
      };
    }
    return INITIAL_GREETING;
  };

  // Refresh unlocked status on mount and on storage events
  const checkUnlocked = () => {
    setIsUnlocked(isDeviceUnlocked());
    setIsDakisQueen(isDakisQueenMode());
    setIsIsmaelBoss(isIsmaelBossMode());
  };

  // Initialize active session on startup
  useEffect(() => {
    checkUnlocked();
    const initialGreeting = getContextualGreeting();
    const { currentSession, allSessions } = loadActiveSession(initialGreeting);
    setSessions(allSessions);
    setActiveSessionIdState(currentSession.id);
    setMessages(currentSession.messages);

    const handleMemoryUpdate = () => {
      checkUnlocked();
      setSessions(getAllSessions());
    };

    window.addEventListener('dakis_memory_updated', handleMemoryUpdate);
    window.addEventListener('storage', handleMemoryUpdate);

    // Listen for PWA beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('dakis_memory_updated', handleMemoryUpdate);
      window.removeEventListener('storage', handleMemoryUpdate);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Save active session messages whenever messages change
  useEffect(() => {
    if (activeSessionId && messages.length > 0) {
      const updatedSessions = saveActiveSessionMessages(activeSessionId, messages);
      setSessions(updatedSessions);
    }
  }, [messages, activeSessionId]);

  // Scroll to bottom smoothly
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Toggle Voice Auto-Speak
  const handleToggleVoiceAutoSpeak = () => {
    const next = !voiceAutoSpeak;
    setVoiceAutoSpeakState(next);
    setVoiceAutoSpeak(next);
    if (!next) {
      stopSpeaking();
    }
  };

  // Create and switch to new session
  const handleNewChat = () => {
    stopSpeaking();
    const greeting = getContextualGreeting();
    const { newSession, allSessions } = createNewSession(greeting);
    setSessions(allSessions);
    setActiveSessionIdState(newSession.id);
    setMessages(newSession.messages);
  };

  // Select an existing session
  const handleSelectSession = (sessionId: string) => {
    stopSpeaking();
    const found = sessions.find((s) => s.id === sessionId);
    if (found) {
      setActiveSessionIdState(found.id);
      setActiveSessionId(found.id);
      setMessages(found.messages);
    }
  };

  // Rename a session
  const handleRenameSession = (sessionId: string, newTitle: string) => {
    const updated = renameSession(sessionId, newTitle);
    setSessions(updated);
  };

  // Delete a session
  const handleDeleteSession = (sessionId: string) => {
    stopSpeaking();
    const greeting = getContextualGreeting();
    const { remainingSessions, activeSession } = deleteSession(sessionId, greeting);
    setSessions(remainingSessions);
    setActiveSessionIdState(activeSession.id);
    setMessages(activeSession.messages);
  };

  const handleSendMessage = async (text: string) => {
    const userText = text.trim();
    if (!userText || isLoading) return;

    stopSpeaking();
    const lower = userText.toLowerCase();

    // 1. Check Exit / Lock commands
    const exitCommands = ['/lock', '/exit', '/quitter', 'quitter', 'verrouiller', 'quitter mode secret', 'sortir'];
    if (exitCommands.includes(lower)) {
      exitSecretModes();
      checkUnlocked();

      const userMsg: Message = {
        id: 'msg_' + Date.now(),
        role: 'user',
        content: userText,
        timestamp: Date.now(),
      };
      const exitMsg: Message = {
        id: 'msg_' + (Date.now() + 1),
        role: 'model',
        content: "🔒 **Espace secret quitté et verrouillé.**\n\nVous êtes de retour en mode sécurisé standard. Pour réactiver votre espace (Boss ISMAEL ou Reine Daniella), entrez votre mot de passe secret à tout moment !",
        timestamp: Date.now() + 1,
        isLockedNotice: true,
      };
      setMessages((prev) => [...prev, userMsg, exitMsg]);
      return;
    }

    // 2. Check command /admin
    if (lower === '/admin') {
      const userMsg: Message = {
        id: 'msg_' + Date.now(),
        role: 'user',
        content: userText,
        timestamp: Date.now(),
      };
      const adminBotMsg: Message = {
        id: 'msg_' + (Date.now() + 1),
        role: 'model',
        content: "🛡️ **Accès Administrateur Détecté**\n\nOuverture du panneau d'administration de DAKIS AI. Seuls ISMAEL & Daniella peuvent entrer avec un des mots de passe secrets.",
        timestamp: Date.now() + 1,
      };
      setMessages((prev) => [...prev, userMsg, adminBotMsg]);
      setIsAdminModalOpen(true);
      return;
    }

    const currentMemory = getMemory();
    const isEnteringMagicWord = isFamilyMagicWordMatch(userText, currentMemory.magic_word_hash);
    const isEnteringQueenPassword = isDakisPasswordMatch(userText, currentMemory.queen_password_hash);
    const isEnteringBossPassword = isIsmaelPasswordMatch(userText, currentMemory.boss_password_hash);

    // 3. Check direct Boss Password "ma vie"
    if (isEnteringBossPassword) {
      unlockWithMagicWord(userText);
      setIsUnlocked(true);
      setIsIsmaelBoss(true);
      setIsDakisQueen(false);

      try {
        confetti({
          particleCount: 140,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#f59e0b', '#3b82f6', '#10b981', '#fbbf24'],
        });
      } catch (err) {}

      const userMsg: Message = {
        id: 'msg_' + Date.now(),
        role: 'user',
        content: userText,
        timestamp: Date.now(),
      };
      const bossWelcomeMsg: Message = {
        id: 'msg_' + (Date.now() + 1),
        role: 'model',
        content: "👑⚡ **Salutations respectueuses, Boss ISMAEL !** Bienvenue dans votre Espace Créateur Suprême.\n\nÀ vos ordres, Mon Boss. Tout le système DAKIS AI est calibré à 100% pour vous :\n- ⚡ **Polytech & Ingénierie Unilu** (Maths, physique appliquée, calculs complexes)\n- 💻 **Code & Architecture de génie** (Algorithmes, dev web, tech d'élite)\n- ❤️ **Votre Reine Daniella (DAKIS)** (Poèmes, surprises, mots doux romantiques)\n- 🎧 **Rap Français & Bouss** (Lyrics, analyse de punchlines, motivation de vainqueur)\n- 🚀 **Stratégies de Boss** (Gestion du temps, focus et domination)",
        timestamp: Date.now() + 1,
        isUnlockedSecret: true,
      };

      setMessages((prev) => [...prev, userMsg, bossWelcomeMsg]);
      if (voiceAutoSpeak) {
        speakText(bossWelcomeMsg.content);
      }
      return;
    }

    // 4. Check direct Queen Password "mon tout"
    if (isEnteringQueenPassword) {
      unlockWithMagicWord(userText);
      setIsUnlocked(true);
      setIsDakisQueen(true);
      setIsIsmaelBoss(false);

      try {
        confetti({
          particleCount: 130,
          spread: 85,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#ec4899', '#f43f5e', '#a855f7', '#fbbf24', '#fb7185'],
        });
      } catch (err) {}

      const userMsg: Message = {
        id: 'msg_' + Date.now(),
        role: 'user',
        content: userText,
        timestamp: Date.now(),
      };
      const queenWelcomeMsg: Message = {
        id: 'msg_' + (Date.now() + 1),
        role: 'model',
        content: "👑 **Bienvenue dans votre Espace Privé, Ma Reine Daniella !** ❤️\n\nIci, tout a été spécialement conçu pour vous par **ISMAEL**. Vous êtes la reine absolue de son cœur et la fille aux plus beaux yeux du monde.\n\nDe quoi avez-vous envie aujourd'hui, Votre Majesté ?\n- ⚖️ **Révisions ou quiz de Droit (BAC1 UPL)**\n- 💌 **Un mot d'amour ou une pensée d'ISMAEL**\n- 🍟 **Une délicieuse recette de frites croustillantes**\n- 🎬 **Parler de Summer Love ou de vos chansons préférées**\n- ✨ **Votre dose quotidienne de compliments et d'énergie**",
        timestamp: Date.now() + 1,
        isUnlockedSecret: true,
      };

      setMessages((prev) => [...prev, userMsg, queenWelcomeMsg]);
      if (voiceAutoSpeak) {
        speakText(queenWelcomeMsg.content);
      }
      return;
    }

    // 5. Check direct family magic word input
    if (isEnteringMagicWord) {
      unlockWithMagicWord(userText);
      setIsUnlocked(true);
      setIsDakisQueen(false);
      setIsIsmaelBoss(false);

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#f43f5e', '#a855f7', '#ec4899', '#3b82f6', '#10b981'],
        });
      } catch (err) {}

      const userMsg: Message = {
        id: 'msg_' + Date.now(),
        role: 'user',
        content: userText,
        timestamp: Date.now(),
      };
      const welcomeMsg: Message = {
        id: 'msg_' + (Date.now() + 1),
        role: 'model',
        content: "C'est bon t'es de la famille maintenant ❤️ Je peux te parler de nous deux.\n\nDemande-moi tout ce que tu veux savoir sur **ISMAEL** (le boss polytechnicien) ou sur la magnifique **Daniella alias DAKIS** (notre future grande juriste aux plus beaux yeux) !",
        timestamp: Date.now() + 1,
        isUnlockedSecret: true,
      };

      setMessages((prev) => [...prev, userMsg, welcomeMsg]);
      if (voiceAutoSpeak) {
        speakText(welcomeMsg.content);
      }
      return;
    }

    // 6. Check if locked and asking private info
    const deviceUnlockedNow = isDeviceUnlocked();
    const queenModeNow = isDakisQueenMode();
    const bossModeNow = isIsmaelBossMode();

    if (!deviceUnlockedNow && isPrivateInfoQuery(userText)) {
      const userMsg: Message = {
        id: 'msg_' + Date.now(),
        role: 'user',
        content: userText,
        timestamp: Date.now(),
      };
      const lockedMsg: Message = {
        id: 'msg_' + (Date.now() + 1),
        role: 'model',
        content: "Info privée 🔒 Entre le mot de passe secret pour débloquer les informations intimes sur ISMAEL & Daniella.",
        timestamp: Date.now() + 1,
        isLockedNotice: true,
      };
      setMessages((prev) => [...prev, userMsg, lockedMsg]);
      if (voiceAutoSpeak) {
        speakText(lockedMsg.content);
      }
      return;
    }

    // 7. Standard AI Chat with Gemini & Resilient Offline Fallback
    const userMsg: Message = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsLoading(true);

    let replyText = '';

    try {
      const mode = bossModeNow ? 'boss' : queenModeNow ? 'queen' : deviceUnlockedNow ? 'family' : 'guest';
      const authToken = generateAuthToken(mode);
      const deviceId = getDeviceId();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({
            role: m.role === 'model' ? 'model' : 'user',
            content: m.content,
          })),
          isUnlocked: deviceUnlockedNow,
          isDakisQueen: queenModeNow,
          isIsmaelBoss: bossModeNow,
          memory: currentMemory,
          userMessage: userText,
          deviceId,
          authToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.reply) {
          replyText = data.reply;
        }
      }
    } catch (networkErr: any) {
      console.warn('Network chat fetch error, switching to resilient fallback:', networkErr?.message || networkErr);
    }

    // If server was unreachable or error occurred, provide smart local fallback
    if (!replyText) {
      replyText = generateOfflineFallbackResponse(
        userText,
        bossModeNow,
        queenModeNow,
        deviceUnlockedNow,
        currentMemory
      );
    }

    const botMsg: Message = {
      id: 'msg_' + Date.now(),
      role: 'model',
      content: replyText,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, botMsg]);

    // Isolated, safe audio speak
    if (voiceAutoSpeak) {
      try {
        speakText(replyText);
      } catch (e) {}
    }

    setIsLoading(false);
  };

  const activeSuggestions = isIsmaelBoss
    ? BOSS_SUGGESTIONS
    : isDakisQueen
    ? QUEEN_SUGGESTIONS
    : STANDARD_SUGGESTIONS;

  return (
    <div className="relative flex flex-col h-screen w-full bg-[#050505] text-zinc-100 font-sans overflow-hidden">
      {/* Frosted Glass Ambient Glowing Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-900/15 rounded-full blur-[120px]" />
        <div
          className={`absolute top-[40%] right-[15%] w-[30%] h-[30%] rounded-full blur-[100px] ${
            isIsmaelBoss ? 'bg-cyan-900/30' : isDakisQueen ? 'bg-rose-900/30' : 'bg-rose-950/15'
          }`}
        />
      </div>

      {/* Top Header */}
      <Header
        isUnlocked={isUnlocked}
        isDakisQueen={isDakisQueen}
        isIsmaelBoss={isIsmaelBoss}
        onOpenUnlock={() => setIsUnlockModalOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        onOpenInstall={() => setIsInstallModalOpen(true)}
        onOpenSessions={() => setIsSessionsModalOpen(true)}
        onOpenOfflineCourses={() => setIsOfflineCoursesOpen(true)}
        onNewChat={handleNewChat}
        isInstallable={!!deferredPrompt}
        sessionCount={sessions.length}
        voiceAutoSpeak={voiceAutoSpeak}
        onToggleVoiceAutoSpeak={handleToggleVoiceAutoSpeak}
      />

      {/* Main Conversation Stream */}
      <main className="relative z-10 flex-1 overflow-y-auto w-full max-w-3xl mx-auto py-2 sm:py-3 px-1 sm:px-3">
        {messages.length === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="my-4 sm:my-6 px-3 sm:px-4 text-center"
          >
            {/* Logo Glass Card */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-white/5 border backdrop-blur-2xl mb-3 shadow-2xl shadow-black/60 ${
                isIsmaelBoss
                  ? 'border-cyan-500/40 text-cyan-400 shadow-cyan-950/40'
                  : isDakisQueen
                  ? 'border-rose-500/40 text-rose-400 shadow-rose-950/40'
                  : 'border-white/10 text-orange-400'
              }`}
            >
              <img src="/icon-192.svg" alt="DAKIS AI" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="text-lg sm:text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2"
            >
              DAKIS AI
              <span
                className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/5 border backdrop-blur-md ${
                  isIsmaelBoss
                    ? 'text-cyan-400 border-cyan-500/30'
                    : isDakisQueen
                    ? 'text-amber-400 border-amber-500/30'
                    : 'text-orange-400 border-orange-500/20'
                }`}
              >
                {isIsmaelBoss ? '⚡ Boss ISMAEL' : isDakisQueen ? '👑 Reine Daniella' : 'v3.6 Flash'}
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.15 }}
              className="text-xs sm:text-sm text-white/50 mt-1 max-w-md mx-auto leading-relaxed"
            >
              {isIsmaelBoss ? (
                <>
                  Espace exclusif réservé au créateur <span className="text-cyan-300 font-semibold">Boss ISMAEL</span>, calibré pour l'ingénierie, le code, les stratégies et sa reine <span className="text-rose-300 font-semibold">Daniella (DAKIS)</span>.
                </>
              ) : isDakisQueen ? (
                <>
                  Espace exclusif réservé à la reine <span className="text-rose-300 font-semibold">Daniella (DAKIS)</span>, créé avec amour par <span className="text-orange-300 font-semibold">ISMAEL</span>.
                </>
              ) : (
                <>
                  L'IA officielle de <span className="text-orange-300 font-semibold">ISMAEL & DAKIS</span>. Pose n'importe quelle question technique, culturelle ou personnelle.
                </>
              )}
            </motion.p>

            {/* Quick Suggestions Chips with Frosted Glass Styling & Staggered Motion */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 mt-5 max-w-lg mx-auto text-left">
              {activeSuggestions.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.15 + idx * 0.04 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSendMessage(item.prompt)}
                    className={`flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border backdrop-blur-md text-white/80 hover:text-white transition-all shadow-sm group ${
                      isIsmaelBoss
                        ? 'border-white/10 hover:border-cyan-500/40'
                        : isDakisQueen
                        ? 'border-white/10 hover:border-rose-500/40'
                        : 'border-white/10 hover:border-orange-500/40'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl bg-white/5 border border-white/10 text-white/50 transition-all ${
                        isIsmaelBoss
                          ? 'group-hover:bg-cyan-500/20 group-hover:text-cyan-300'
                          : isDakisQueen
                          ? 'group-hover:bg-rose-500/20 group-hover:text-rose-300'
                          : 'group-hover:bg-orange-500/20 group-hover:text-orange-300'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 truncate">
                      <p className="text-xs font-semibold text-white/90 group-hover:text-white">{item.label}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Chat Messages */}
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onUnlockClick={() => setIsUnlockModalOpen(true)}
          />
        ))}

        {/* Typing Loading Indicator with Frosted Glass styling & Entrance Animation */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2.5 my-2 px-3"
            >
              <div
                className={`w-8 h-8 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center shadow-sm ${
                  isIsmaelBoss ? 'text-cyan-400' : 'text-orange-400'
                }`}
              >
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl rounded-tl-none px-4 py-3 shadow-lg flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} className="h-4" />
      </main>

      {/* Chat Bottom Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        isUnlocked={isUnlocked}
        isDakisQueen={isDakisQueen}
        isIsmaelBoss={isIsmaelBoss}
        onOpenUnlock={() => setIsUnlockModalOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        onOpenSessions={() => setIsSessionsModalOpen(true)}
        voiceAutoSpeak={voiceAutoSpeak}
        onToggleVoiceAutoSpeak={handleToggleVoiceAutoSpeak}
      />

      {/* Modals */}
      <SessionsModal
        isOpen={isSessionsModalOpen}
        onClose={() => setIsSessionsModalOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewChat}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
        isIsmaelBoss={isIsmaelBoss}
        isDakisQueen={isDakisQueen}
      />

      <UnlockModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        onExit={() => {
          checkUnlocked();
          handleNewChat();
        }}
        onSuccess={(mode?: UnlockMode) => {
          checkUnlocked();
          if (mode === 'boss') {
            const bossMsg: Message = {
              id: 'boss_unlock_celebration_' + Date.now(),
              role: 'model',
              content: "👑⚡ **Salutations, Boss ISMAEL !** Votre Espace Créateur est actif. En quoi votre IA peut-elle vous servir aujourd'hui, Mon Boss ?",
              timestamp: Date.now(),
              isUnlockedSecret: true,
            };
            setMessages((prev) => [...prev, bossMsg]);
            if (voiceAutoSpeak) speakText(bossMsg.content);
          } else if (mode === 'queen') {
            const queenMsg: Message = {
              id: 'queen_unlock_celebration_' + Date.now(),
              role: 'model',
              content: "👑 **Majesté Daniella (DAKIS) !** Votre espace secret est déverrouillé. Je suis entièrement à votre service, ma Reine ❤️",
              timestamp: Date.now(),
              isUnlockedSecret: true,
            };
            setMessages((prev) => [...prev, queenMsg]);
            if (voiceAutoSpeak) speakText(queenMsg.content);
          } else {
            const familyMsg: Message = {
              id: 'unlock_celebration_' + Date.now(),
              role: 'model',
              content: "C'est bon t'es de la famille maintenant ❤️ Je peux te parler de nous deux.\n\nDemande-moi ce que tu veux sur le boss **ISMAEL** ou sur la merveilleuse **Daniella (DAKIS)** !",
              timestamp: Date.now(),
              isUnlockedSecret: true,
            };
            setMessages((prev) => [...prev, familyMsg]);
            if (voiceAutoSpeak) speakText(familyMsg.content);
          }
        }}
      />

      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onMemoryUpdated={() => {
          checkUnlocked();
        }}
      />

      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        onOpenUnlock={() => setIsUnlockModalOpen(true)}
        isUnlocked={isUnlocked}
        isDakisQueen={isDakisQueen}
        isIsmaelBoss={isIsmaelBoss}
      />

      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstalled={() => {
          setDeferredPrompt(null);
        }}
      />

      <OfflineCoursesModal
        isOpen={isOfflineCoursesOpen}
        onClose={() => setIsOfflineCoursesOpen(false)}
        isIsmaelBoss={isIsmaelBoss}
        isDakisQueen={isDakisQueen}
      />
    </div>
  );
}
