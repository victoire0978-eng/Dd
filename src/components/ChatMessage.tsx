import React, { useState, useEffect } from 'react';
import { Message } from '../types';
import Markdown from 'react-markdown';
import { motion } from 'motion/react';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  KeyRound,
  Sparkles,
  Heart,
  ShieldAlert,
} from 'lucide-react';
import { speakText, stopSpeaking, isSpeechSynthesisSupported } from '../utils/speech';

interface ChatMessageProps {
  message: Message;
  onUnlockClick?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onUnlockClick }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!isSpeechSynthesisSupported()) return;

    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }

    setSpeaking(true);
    speakText(message.content, {
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const isPrivateLockedResponse =
    (message.content || '').includes('Info privée 🔒') ||
    (message.content || '').includes('mot magique pour débloquer') ||
    (message.content || '').includes('mot de passe secret');

  const isFamilyWelcomeResponse =
    (message.content || '').includes("t'es de la famille maintenant") ||
    (message.content || '').includes('famille maintenant ❤️');

  const timeFormatted = new Date(message.timestamp || Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={`group flex flex-col w-full my-3 px-2 sm:px-3 transition-all ${
        isUser ? 'items-end' : 'items-start'
      }`}
    >
      <div className="flex items-start gap-2.5 max-w-[90%] sm:max-w-[82%]">
        {!isUser && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center text-rose-400 mt-1 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-orange-400" />
          </motion.div>
        )}

        <div className="flex flex-col gap-1 w-full">
          {/* Frosted Glass Bubble */}
          <div
            className={`relative rounded-2xl p-4 text-[15px] leading-relaxed shadow-xl backdrop-blur-md transition-all ${
              isUser
                ? 'bg-orange-500/10 border border-orange-500/30 text-white/90 rounded-tr-none'
                : isFamilyWelcomeResponse
                ? 'bg-gradient-to-br from-rose-500/15 via-white/5 to-purple-500/15 text-white/95 border border-rose-500/40 rounded-tl-none shadow-[0_0_20px_rgba(244,63,94,0.12)]'
                : isPrivateLockedResponse
                ? 'bg-white/5 text-white/90 border border-red-500/35 rounded-tl-none shadow-[0_0_20px_rgba(239,68,68,0.08)]'
                : 'bg-white/5 text-white/90 border border-white/10 rounded-tl-none'
            }`}
          >
            {/* Special header if family welcome */}
            {isFamilyWelcomeResponse && (
              <div className="flex items-center gap-1.5 pb-2.5 mb-2.5 border-b border-rose-500/30 text-rose-300 font-semibold text-xs">
                <Heart className="w-4 h-4 fill-rose-400 text-rose-400 animate-pulse" />
                <span>Accès Famille Autorisé</span>
              </div>
            )}

            {/* Special lock header if private info blocked */}
            {isPrivateLockedResponse && (
              <div className="flex items-center gap-2 pb-2 mb-2 border-b border-red-500/20 text-red-400 font-semibold text-xs">
                <ShieldAlert className="w-4 h-4" />
                <span className="uppercase tracking-widest text-[10px]">Action requise</span>
              </div>
            )}

            {/* Markdown content */}
            <div className="markdown-body prose prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-headings:text-white prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-lg prose-code:text-orange-300 prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 text-[14.5px]">
              <Markdown>{message.content}</Markdown>
            </div>

            {/* Interactive unlock button if locked notice */}
            {isPrivateLockedResponse && onUnlockClick && (
              <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
                <button
                  onClick={onUnlockClick}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition active:scale-95"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Entrer le mot magique</span>
                </button>
                <span className="text-[11px] text-white/40 italic">Accès privé & confidentiel 🔒</span>
              </div>
            )}
          </div>

          {/* Subtitle / Timestamp & Actions */}
          <div
            className={`flex items-center gap-2 mt-0.5 px-1 ${
              isUser ? 'justify-end' : 'justify-between'
            }`}
          >
            {!isUser && (
              <div className="flex items-center gap-2 text-white/40 text-xs opacity-75 group-hover:opacity-100 transition">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
                  title="Copier le texte"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[10px]">{copied ? 'Copié' : 'Copier'}</span>
                </button>

                {isSpeechSynthesisSupported() && (
                  <button
                    onClick={handleSpeak}
                    className={`flex items-center gap-1 p-1 rounded-lg hover:bg-white/5 transition ${
                      speaking ? 'text-orange-400 font-semibold animate-pulse' : 'hover:text-white'
                    }`}
                    title={speaking ? 'Arrêter la lecture vocale' : 'Écouter la réponse à haute voix'}
                  >
                    {speaking ? <VolumeX className="w-3.5 h-3.5 text-orange-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span className="text-[10px]">{speaking ? 'Stop' : 'Voix'}</span>
                  </button>
                )}
              </div>
            )}

            <span className="text-[10px] text-white/30">
              {isUser ? `Vous • ${timeFormatted}` : `DAKIS AI • ${timeFormatted}`}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
