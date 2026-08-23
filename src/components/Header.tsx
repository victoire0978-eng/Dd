import React from 'react';
import {
  Lock,
  Heart,
  Shield,
  Plus,
  Download,
  Crown,
  Zap,
  History,
  Volume2,
  VolumeX,
  BookOpen,
} from 'lucide-react';

interface HeaderProps {
  isUnlocked: boolean;
  isDakisQueen?: boolean;
  isIsmaelBoss?: boolean;
  onOpenUnlock: () => void;
  onOpenAdmin: () => void;
  onOpenAbout: () => void;
  onOpenInstall: () => void;
  onOpenSessions: () => void;
  onOpenOfflineCourses: () => void;
  onNewChat: () => void;
  isInstallable: boolean;
  sessionCount?: number;
  offlineCourseCount?: number;
  voiceAutoSpeak?: boolean;
  onToggleVoiceAutoSpeak?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isUnlocked,
  isDakisQueen,
  isIsmaelBoss,
  onOpenUnlock,
  onOpenAdmin,
  onOpenAbout,
  onOpenInstall,
  onOpenSessions,
  onOpenOfflineCourses,
  onNewChat,
  isInstallable,
  sessionCount = 1,
  offlineCourseCount = 0,
  voiceAutoSpeak = false,
  onToggleVoiceAutoSpeak,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-2.5 sm:px-4 py-2.5 sm:py-3 bg-[#121214]/75 backdrop-blur-2xl border-b border-white/10 select-none">
      {/* Brand & Identity */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onOpenAbout}
          className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md text-white active:scale-95 transition-all shadow-inner flex-shrink-0"
          title="À propos de DAKIS AI"
          id="btn-about"
        >
          <img src="/icon-192.svg" alt="DAKIS AI" className="w-5 h-5 sm:w-6 sm:h-6 rounded-xl" />
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.7)] border-2 border-[#121214]" />
        </button>

        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="font-bold text-xs sm:text-base tracking-tight text-white flex items-center gap-1.5">
              DAKIS AI
              <span className="text-[9.5px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full bg-white/5 text-orange-400 border border-orange-500/20 backdrop-blur-md hidden xs:inline-block">
                v3.6 Flash
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isIsmaelBoss
                  ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                  : isDakisQueen
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                  : 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]'
              }`}
            />
            <span className="text-[10px] sm:text-[10.5px] text-white/50 uppercase tracking-wider font-medium truncate max-w-[110px] xs:max-w-[150px] sm:max-w-[220px]">
              {isIsmaelBoss
                ? '⚡ Boss ISMAEL'
                : isDakisQueen
                ? '👑 Reine Daniella'
                : isUnlocked
                ? 'Accès Famille ❤️'
                : 'En Ligne 🔒'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Badges & Buttons */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* 📚 OFFLINE COURSES BUTTON */}
        <button
          onClick={onOpenOfflineCourses}
          id="btn-offline-courses"
          className="relative flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-300 backdrop-blur-md transition-all active:scale-95 font-semibold text-xs shadow-[0_0_12px_rgba(249,115,22,0.15)]"
          title="📚 Mes Cours & Bibliothèque OFFLINE (Mode Avion)"
        >
          <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />
          <span className="hidden md:inline">Mes Cours</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
            OFFLINE
          </span>
        </button>

        {/* Chat Sessions / History Button */}
        <button
          onClick={onOpenSessions}
          id="btn-sessions"
          className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white backdrop-blur-md transition-all active:scale-95"
          title={`Historique des discussions (${sessionCount})`}
        >
          <History className="w-4 h-4 text-orange-400" />
          {sessionCount > 1 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-[#121214]">
              {sessionCount > 9 ? '9+' : sessionCount}
            </span>
          )}
        </button>

        {/* Voice Auto-Speak Toggle */}
        {onToggleVoiceAutoSpeak && (
          <button
            onClick={onToggleVoiceAutoSpeak}
            id="btn-voice-toggle"
            className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl border backdrop-blur-md transition-all active:scale-95 ${
              voiceAutoSpeak
                ? 'bg-orange-500/20 border-orange-500/40 text-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.2)]'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/40 hover:text-white'
            }`}
            title={
              voiceAutoSpeak
                ? 'Mode Vocal Actif : DAKIS lit les réponses à haute voix'
                : 'Mode Vocal Désactivé : Cliquez pour activer la lecture vocale automatique'
            }
          >
            {voiceAutoSpeak ? (
              <Volume2 className="w-4 h-4 text-orange-400 animate-pulse" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Unlocked / Boss / Queen / Locked status pill */}
        <button
          onClick={onOpenUnlock}
          id="btn-unlock-status"
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-medium border backdrop-blur-md transition-all active:scale-95 ${
            isIsmaelBoss
              ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
              : isDakisQueen
              ? 'bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
              : isUnlocked
              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
              : 'bg-white/5 text-amber-300/90 border-white/10 hover:border-amber-500/40 hover:bg-white/10'
          }`}
          title={
            isIsmaelBoss
              ? 'Mode Boss ISMAEL Activé ⚡ (Cliquez pour gérer)'
              : isDakisQueen
              ? 'Mode Reine DAKIS Activé 👑 (Cliquez pour gérer)'
              : isUnlocked
              ? 'Membre de la famille déverrouillé'
              : 'Appareil verrouillé - Cliquez pour débloquer'
          }
        >
          {isIsmaelBoss ? (
            <>
              <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400 animate-pulse" />
              <span className="font-bold hidden sm:inline">Boss ⚡</span>
            </>
          ) : isDakisQueen ? (
            <>
              <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
              <span className="font-bold hidden sm:inline">Reine 👑</span>
            </>
          ) : isUnlocked ? (
            <>
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              <span className="font-semibold hidden sm:inline">Famille</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Privé</span>
            </>
          )}
        </button>

        {/* PWA Install Button */}
        <button
          onClick={onOpenInstall}
          id="btn-pwa-install"
          className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-400/90 hover:text-cyan-300 backdrop-blur-md transition-all active:scale-95"
          title="Installer l'application PWA"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Admin Access Button */}
        <button
          onClick={onOpenAdmin}
          id="btn-admin-access"
          className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-purple-400/90 hover:text-purple-300 backdrop-blur-md transition-all active:scale-95"
          title="Espace Admin (/admin)"
        >
          <Shield className="w-4 h-4" />
        </button>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          id="btn-new-chat"
          className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-medium shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex-shrink-0"
          title="Nouvelle discussion"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
