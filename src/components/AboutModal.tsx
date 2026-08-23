import React from 'react';
import {
  Sparkles,
  Heart,
  Code2,
  Music,
  GraduationCap,
  X,
  Lock,
  Crown,
  Zap,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { DakisMemory } from '../types';
import { getMemory } from '../utils/memory';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUnlock?: () => void;
  isUnlocked?: boolean;
  isDakisQueen?: boolean;
  isIsmaelBoss?: boolean;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  onOpenUnlock,
  isUnlocked = false,
  isDakisQueen = false,
  isIsmaelBoss = false,
}) => {
  if (!isOpen) return null;

  const memory: DakisMemory = getMemory();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-md max-h-[90vh] bg-[#121214]/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl flex flex-col text-zinc-100 overflow-hidden">
        {/* Subtle glow orb */}
        <div
          className={`absolute -top-12 -left-12 w-44 h-44 rounded-full blur-3xl pointer-events-none ${
            isIsmaelBoss
              ? 'bg-cyan-500/15'
              : isDakisQueen
              ? 'bg-rose-500/15'
              : isUnlocked
              ? 'bg-orange-500/15'
              : 'bg-zinc-600/10'
          }`}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center ${
                isIsmaelBoss
                  ? 'text-cyan-400'
                  : isDakisQueen
                  ? 'text-rose-400'
                  : isUnlocked
                  ? 'text-orange-400'
                  : 'text-white/70'
              }`}
            >
              {isIsmaelBoss ? (
                <Zap className="w-4 h-4" />
              ) : isDakisQueen ? (
                <Crown className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                À Propos de DAKIS AI
                <span
                  className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-full border ${
                    isUnlocked
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {isUnlocked ? 'Accès Déverrouillé' : 'Mode Protégé'}
                </span>
              </h2>
              <p className="text-[11px] text-white/40 uppercase tracking-wider font-medium">
                Assistant Personnel & Privé
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs leading-relaxed">
          {/* Main App Overview Card */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center shadow-lg">
            <h3 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>DAKIS AI • Version 2026</span>
            </h3>
            <p className="text-white/80 mt-2 text-[12px] leading-relaxed">
              Assistant d'intelligence artificielle personnalisé, sécurisé et ultra-rapide.
              Conçu pour le travail, le code, les études juridiques, l'organisation et la vie quotidienne.
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-white/60 text-[10.5px]">
                ⚡ Moteur Gemini 3.6 Flash
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-white/60 text-[10.5px]">
                🔒 Chiffrement SHA-256
              </span>
            </div>
          </div>

          {/* If NOT UNLOCKED: STRICT PRIVACY LOCK (No personal data leak) */}
          {!isUnlocked ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-md space-y-3 shadow-md text-center">
              <div className="w-10 h-10 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  Profils & Données Personnelles Protégés
                </h4>
                <p className="text-[11.5px] text-white/70 mt-1.5 leading-relaxed">
                  Les identités complètes, informations privées du créateur et de son entourage sont strictement confidentielles et masquées.
                </p>
              </div>

              {onOpenUnlock && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenUnlock();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition active:scale-95"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Entrer le mot de passe secret</span>
                </button>
              )}
            </div>
          ) : (
            /* If UNLOCKED: Display information to authorized users (Boss, Queen or Family) */
            <>
              <div className="px-2 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>
                  {isIsmaelBoss
                    ? 'Identifié : Boss ISMAEL (Créateur) ⚡'
                    : isDakisQueen
                    ? 'Identifié : Reine Daniella (DAKIS) 👑'
                    : 'Membre de confiance déverrouillé ❤️'}
                </span>
              </div>

              {/* Creator Card */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-2.5 shadow-md">
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-white">Le Créateur : ISMAEL</span>
                </div>
                <p className="text-white/80 text-[12px] leading-relaxed">
                  {memory.creator?.nom || 'ISMAEL'}, étudiant en Faculté Polytechnique et développeur de DAKIS AI.
                </p>
                <div className="flex flex-wrap gap-2 text-[11px] pt-1">
                  <span className="px-2.5 py-1 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1 backdrop-blur-md">
                    <GraduationCap className="w-3.5 h-3.5" /> Polytech Unilu
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-orange-500/10 text-orange-300 border border-orange-500/20 flex items-center gap-1 backdrop-blur-md">
                    <Music className="w-3.5 h-3.5" /> Rap & Bouss
                  </span>
                </div>
              </div>

              {/* Daniella Queen Card */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-2.5 shadow-md">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                  <span className="text-white">La Reine : Daniella (DAKIS)</span>
                </div>
                <p className="text-white/80 text-[12px] leading-relaxed">
                  {memory.girlfriend?.nom || 'Daniella (DAKIS)'}, étudiante en Droit et reine du cœur d'ISMAEL.
                </p>
                <div className="flex flex-wrap gap-2 text-[11px] pt-1">
                  <span className="px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-1 backdrop-blur-md">
                    <GraduationCap className="w-3.5 h-3.5" /> Droit UPL
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1 backdrop-blur-md">
                    <Crown className="w-3.5 h-3.5 text-amber-400" /> Reine de DAKIS
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Footer note */}
          <div className="pt-2 text-center text-[10.5px] text-white/40 uppercase tracking-widest font-medium">
            DAKIS AI • Système Privé & Confidentiel 2026
          </div>
        </div>
      </div>
    </div>
  );
};
