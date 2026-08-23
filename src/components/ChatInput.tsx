import React, { useRef, useEffect, useState } from 'react';
import {
  Send,
  KeyRound,
  Crown,
  Zap,
  Mic,
  MicOff,
  History,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  isSpeechRecognitionSupported,
  startVoiceRecognition,
  SpeechRecognitionController,
} from '../utils/speech';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  isUnlocked: boolean;
  isDakisQueen?: boolean;
  isIsmaelBoss?: boolean;
  onOpenUnlock: () => void;
  onOpenAdmin?: () => void;
  onOpenAbout?: () => void;
  onOpenSessions?: () => void;
  voiceAutoSpeak?: boolean;
  onToggleVoiceAutoSpeak?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  isUnlocked,
  isDakisQueen,
  isIsmaelBoss,
  onOpenUnlock,
  onOpenAdmin,
  onOpenAbout,
  onOpenSessions,
  voiceAutoSpeak = false,
  onToggleVoiceAutoSpeak,
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionController | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Clean up recognition when unmounting
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    if (!input.trim() || isLoading) return;
    const textToSend = input.trim();
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    onSendMessage(textToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleVoiceInput = () => {
    setSpeechError(null);

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setSpeechError("La reconnaissance vocale n'est pas supportée par ce navigateur.");
      setTimeout(() => setSpeechError(null), 4000);
      return;
    }

    const controller = startVoiceRecognition({
      onStart: () => {
        setIsListening(true);
        setSpeechError(null);
      },
      onResult: (transcript, isFinal) => {
        setInput((prev) => {
          // If we had something before starting or user spoke continuous words
          return transcript;
        });
      },
      onError: (errMsg) => {
        setSpeechError(errMsg);
        setIsListening(false);
        setTimeout(() => setSpeechError(null), 5000);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (controller) {
      recognitionRef.current = controller;
      setIsListening(true);
    }
  };

  return (
    <div className="sticky bottom-0 z-20 w-full bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent pt-2 pb-4 px-3 sm:px-4 select-none">
      <div className="max-w-3xl mx-auto">
        {/* Active Speech Recognition Notification Bar */}
        {isListening && (
          <div className="mb-2 px-3 py-1.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-200 text-xs flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="font-semibold">Micro activé • Parlez maintenant en français...</span>
            </div>
            <button
              onClick={toggleVoiceInput}
              className="text-[11px] font-bold text-orange-300 hover:text-white px-2 py-0.5 rounded-lg bg-white/10"
            >
              Terminer
            </button>
          </div>
        )}

        {speechError && (
          <div className="mb-2 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center justify-between">
            <span>⚠️ {speechError}</span>
            <button
              onClick={() => setSpeechError(null)}
              className="text-[11px] text-white/60 hover:text-white ml-2"
            >
              OK
            </button>
          </div>
        )}

        {/* Main Input Form with Frosted Glass & Ambient Focus Glow */}
        <form onSubmit={handleSubmit} className="relative group">
          {/* Ambient Glow on Focus */}
          <div
            className={`absolute inset-0 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none rounded-2xl ${
              isIsmaelBoss
                ? 'bg-cyan-500/25'
                : isDakisQueen
                ? 'bg-rose-500/25'
                : 'bg-orange-500/20'
            }`}
          />

          <div
            className={`relative flex items-end gap-1.5 sm:gap-2 bg-white/5 backdrop-blur-xl border rounded-2xl p-2 sm:p-2.5 shadow-2xl transition-all ${
              isListening
                ? 'border-orange-500 ring-2 ring-orange-500/30'
                : isIsmaelBoss
                ? 'border-cyan-500/40 focus-within:border-cyan-400'
                : isDakisQueen
                ? 'border-rose-500/40 focus-within:border-rose-400'
                : 'border-white/10 focus-within:border-orange-500/50'
            }`}
          >
            {/* Magic word / Boss / Queen quick indicator if locked */}
            {!isUnlocked ? (
              <button
                type="button"
                onClick={onOpenUnlock}
                className="mb-1 p-2 rounded-xl text-amber-400/80 hover:text-amber-300 hover:bg-white/5 backdrop-blur-sm transition flex-shrink-0"
                title="Débloquer les secrets"
              >
                <KeyRound className="w-4 h-4" />
              </button>
            ) : isIsmaelBoss ? (
              <button
                type="button"
                onClick={onOpenUnlock}
                className="mb-1 p-2 rounded-xl text-cyan-400 hover:text-cyan-300 hover:bg-white/5 backdrop-blur-sm transition flex-shrink-0"
                title="Espace Boss ISMAEL Actif ⚡"
              >
                <Zap className="w-4 h-4" />
              </button>
            ) : isDakisQueen ? (
              <button
                type="button"
                onClick={onOpenUnlock}
                className="mb-1 p-2 rounded-xl text-amber-400 hover:text-amber-300 hover:bg-white/5 backdrop-blur-sm transition flex-shrink-0"
                title="Espace Reine DAKIS Actif 👑"
              >
                <Crown className="w-4 h-4" />
              </button>
            ) : null}

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? "Dictée en cours... Dites votre message..."
                  : isIsmaelBoss
                  ? "À vos ordres Boss ISMAEL. Polytech, code, stratégie..."
                  : isDakisQueen
                  ? "Posez votre question, Ma Reine Daniella..."
                  : isUnlocked
                  ? "Pose une question sur ISMAEL, Daniella, code, droit..."
                  : "Entre le mot de passe secret ou écris un message..."
              }
              className="flex-1 bg-transparent text-sm text-white placeholder-white/25 focus:outline-none resize-none max-h-32 py-1.5 px-1 leading-relaxed"
            />

            {/* Voice Input (Microphone) Button */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`mb-0.5 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-medium transition-all flex-shrink-0 ${
                isListening
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse scale-105'
                  : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white active:scale-95'
              }`}
              title={isListening ? 'Arrêter la dictée vocale' : 'Dictée vocale (Microphone)'}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 text-white" />
              ) : (
                <Mic className="w-4 h-4 text-orange-400" />
              )}
            </button>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`mb-0.5 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-medium transition-all flex-shrink-0 ${
                input.trim() && !isLoading
                  ? isIsmaelBoss
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/25 active:scale-95'
                    : isDakisQueen
                    ? 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white shadow-lg shadow-rose-500/25 active:scale-95'
                    : 'bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/25 active:scale-95'
                  : 'bg-white/5 border border-white/5 text-white/20 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>

        {/* Frosted Glass Footer quick bar */}
        <div className="flex items-center justify-between mt-2.5 px-2">
          {/* History / Sessions quick open & auto-speak */}
          <div className="flex items-center gap-2">
            {onOpenSessions && (
              <button
                type="button"
                onClick={onOpenSessions}
                className="flex items-center gap-1 text-[11px] text-white/50 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/5 transition"
                title="Afficher l'historique et les sessions de chat"
              >
                <History className="w-3.5 h-3.5 text-orange-400" />
                <span className="font-medium">Sessions</span>
              </button>
            )}

            {onToggleVoiceAutoSpeak && (
              <button
                type="button"
                onClick={onToggleVoiceAutoSpeak}
                className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border transition ${
                  voiceAutoSpeak
                    ? 'bg-orange-500/20 border-orange-500/40 text-orange-300 font-semibold'
                    : 'bg-white/5 border-white/5 text-white/40 hover:text-white'
                }`}
                title={
                  voiceAutoSpeak
                    ? 'Lecture vocale automatique activée (DAKIS lit chaque réponse)'
                    : 'Activer la lecture vocale automatique des réponses'
                }
              >
                {voiceAutoSpeak ? (
                  <Volume2 className="w-3.5 h-3.5 text-orange-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">
                  {voiceAutoSpeak ? 'Voix Auto' : 'Voix Muet'}
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onOpenUnlock}
              className={`text-[10px] transition-colors uppercase tracking-[0.15em] font-bold ${
                isIsmaelBoss
                  ? 'text-cyan-400 hover:text-cyan-300'
                  : isDakisQueen
                  ? 'text-rose-400 hover:text-rose-300'
                  : isUnlocked
                  ? 'text-rose-400/80 hover:text-rose-300'
                  : 'text-white/30 hover:text-white/70'
              }`}
            >
              {isIsmaelBoss ? "⚡ Boss" : isDakisQueen ? "👑 Reine" : isUnlocked ? "Famille ❤️" : "Secrets 🔒"}
            </button>
            {onOpenAbout && (
              <button
                type="button"
                onClick={onOpenAbout}
                className="text-[10px] text-white/30 hover:text-white/70 transition-colors uppercase tracking-[0.15em] font-bold"
              >
                À Propos
              </button>
            )}
            {onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="text-[10px] text-orange-500/60 hover:text-orange-400 transition-colors uppercase tracking-[0.15em] font-bold"
              >
                /admin
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
