import React, { useState, useEffect } from 'react';
import {
  unlockWithMagicWord,
  isDakisQueenMode,
  isIsmaelBossMode,
  isDeviceUnlocked,
  exitSecretModes,
  UnlockMode,
} from '../utils/memory';
import confetti from 'canvas-confetti';
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  X,
  Heart,
  Sparkles,
  Crown,
  Zap,
  LogOut,
  ShieldCheck,
  Eye,
  EyeOff,
  ShieldAlert,
} from 'lucide-react';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (mode?: UnlockMode) => void;
  onExit?: () => void;
}

export const UnlockModal: React.FC<UnlockModalProps> = ({ isOpen, onClose, onSuccess, onExit }) => {
  const [word, setWord] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [unlockedMode, setUnlockedMode] = useState<UnlockMode>('none');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Anti-brute force countdown
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setFailedAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  if (!isOpen) return null;

  const isQueen = isDakisQueenMode();
  const isBoss = isIsmaelBossMode();
  const isUnlocked = isDeviceUnlocked();

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    const trimmed = word.trim();
    if (!trimmed) return;

    const res = unlockWithMagicWord(trimmed);
    if (res.success) {
      setSuccess(true);
      setUnlockedMode(res.mode);
      setError(false);
      setFailedAttempts(0);

      try {
        if (res.mode === 'boss') {
          confetti({
            particleCount: 130,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#06b6d4', '#f59e0b', '#3b82f6', '#10b981', '#fbbf24'],
          });
        } else if (res.mode === 'queen') {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#ec4899', '#f43f5e', '#a855f7', '#fbbf24'],
          });
        } else {
          confetti({
            particleCount: 80,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#f43f5e', '#a855f7', '#ec4899', '#3b82f6'],
          });
        }
      } catch (err) {}

      setTimeout(() => {
        setSuccess(false);
        setUnlockedMode('none');
        setWord('');
        onSuccess(res.mode);
        onClose();
      }, 1200);
    } else {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      setError(true);

      if (nextAttempts >= 5) {
        setLockoutSeconds(30);
      }
    }
  };

  const handleExitModes = () => {
    exitSecretModes();
    if (onExit) onExit();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-sm bg-[#121214]/95 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 shadow-2xl text-white overflow-hidden">
        {/* Subtle internal gradient orb */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center mt-1">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center text-amber-400 mb-3 shadow-lg">
            {success ? (
              unlockedMode === 'boss' ? (
                <Zap className="w-7 h-7 text-cyan-400 animate-pulse" />
              ) : unlockedMode === 'queen' ? (
                <Crown className="w-7 h-7 text-amber-400 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              )
            ) : isBoss ? (
              <Zap className="w-7 h-7 text-cyan-400 animate-pulse" />
            ) : isQueen ? (
              <Crown className="w-7 h-7 text-amber-400 animate-pulse" />
            ) : (
              <Lock className="w-7 h-7 text-amber-400 animate-bounce" />
            )}
          </div>

          <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
            Espaces Secrets & Accès
            <Sparkles className="w-4 h-4 text-orange-400" />
          </h3>
          <p className="text-xs text-white/50 mt-1 max-w-[280px] leading-relaxed">
            Entre le mot secret du <span className="text-cyan-400 font-semibold">Boss ISMAEL</span>, de la <span className="text-rose-300 font-semibold">Reine DAKIS</span> ou de la famille.
          </p>
        </div>

        {/* Current status banner if active */}
        {(isBoss || isQueen || isUnlocked) && (
          <div className="mt-4 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {isBoss ? (
                <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-bold">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Mode Boss ISMAEL Actif ⚡</span>
                </div>
              ) : isQueen ? (
                <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
                  <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Mode Reine Daniella Actif 👑</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Accès Famille Actif ❤️</span>
                </div>
              )}
            </div>
            <button
              onClick={handleExitModes}
              className="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-[11px] font-bold flex items-center gap-1 transition active:scale-95"
              title="Quitter l'espace secret et verrouiller"
            >
              <LogOut className="w-3 h-3" />
              <span>Quitter</span>
            </button>
          </div>
        )}

        <form onSubmit={handleUnlock} className="mt-4 space-y-3.5">
          <div>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                disabled={lockoutSeconds > 0}
                value={word}
                onChange={(e) => {
                  setWord(e.target.value);
                  if (error) setError(false);
                }}
                placeholder={lockoutSeconds > 0 ? `Verrouillé (${lockoutSeconds}s)` : 'Mot de passe secret...'}
                className={`w-full bg-white/5 border rounded-xl pl-4 pr-10 py-3 text-sm text-white placeholder-white/25 focus:outline-none transition backdrop-blur-md ${
                  lockoutSeconds > 0
                    ? 'border-rose-500/50 bg-rose-500/5 cursor-not-allowed opacity-70'
                    : 'border-white/10 focus:border-orange-500/50'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={lockoutSeconds > 0}
                className="absolute right-3 p-1 text-white/40 hover:text-white/80 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && lockoutSeconds === 0 && (
              <div className="flex items-center gap-1.5 text-rose-400 text-xs mt-2 pl-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Mot de passe incorrect ({failedAttempts}/5 essais).</span>
              </div>
            )}

            {lockoutSeconds > 0 && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-left">
                <p className="font-semibold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Protection Anti-Bruteforce Active
                </p>
                <p className="text-[11px] text-white/60 mt-0.5">
                  Veuillez patienter <span className="font-bold text-rose-300">{lockoutSeconds}s</span> avant de réessayer.
                </p>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-1.5 text-xs mt-2 pl-1 font-medium animate-pulse">
                {unlockedMode === 'boss' ? (
                  <>
                    <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                    <span className="text-cyan-300 font-bold">Salutations, Boss ISMAEL ! Espace Créateur Débloqué 👑⚡</span>
                  </>
                ) : unlockedMode === 'queen' ? (
                  <>
                    <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-amber-300 font-bold">Majesté Daniella ! Espace Reine DAKIS Déverrouillé 👑❤️</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
                    <span className="text-emerald-300 font-medium">T'es de la famille maintenant ! Déverrouillage réussi ❤️</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="pt-1 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-semibold rounded-xl transition"
            >
              Fermer
            </button>
            <button
              type="submit"
              disabled={lockoutSeconds > 0 || !word.trim()}
              className="flex-1 px-3 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-500/25 transition active:scale-95"
            >
              Débloquer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
