// Speech Recognition (Speech-to-Text) and Speech Synthesis (Text-to-Speech) utilities for DAKIS AI

// Check if Web Speech API recognition is available
export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

// Check if Speech Synthesis is available
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export interface SpeechRecognitionController {
  start: () => void;
  stop: () => void;
  isListening: boolean;
}

/**
 * Initializes and starts speech recognition.
 */
export function startVoiceRecognition({
  onResult,
  onError,
  onStart,
  onEnd,
}: {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (errorMessage: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}): SpeechRecognitionController | null {
  if (!isSpeechRecognitionSupported()) {
    onError("La reconnaissance vocale n'est pas supportée par ce navigateur.");
    return null;
  }

  try {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();

    recognition.lang = 'fr-FR';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let isListening = true;

    recognition.onstart = () => {
      isListening = true;
      if (onStart) onStart();
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart;
        } else {
          interimTranscript += transcriptPart;
        }
      }

      const text = (finalTranscript || interimTranscript).trim();
      if (text) {
        onResult(text, Boolean(finalTranscript));
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition event error:', event.error);
      let message = 'Erreur du micro.';
      if (event.error === 'not-allowed') {
        message = "Accès au microphone refusé. Autorisez l'accès micro dans votre navigateur.";
      } else if (event.error === 'no-speech') {
        message = 'Aucune parole détectée. Rapprochez-vous du micro.';
      } else if (event.error === 'network') {
        message = 'Problème réseau lors de la reconnaissance vocale.';
      }
      onError(message);
    };

    recognition.onend = () => {
      isListening = false;
      if (onEnd) onEnd();
    };

    recognition.start();

    return {
      start: () => {
        try {
          recognition.start();
          isListening = true;
        } catch (e) {}
      },
      stop: () => {
        try {
          recognition.stop();
          isListening = false;
        } catch (e) {}
      },
      get isListening() {
        return isListening;
      },
    };
  } catch (e: any) {
    console.error('Failed to initialize speech recognition:', e);
    onError(e?.message || "Impossible d'activer le microphone.");
    return null;
  }
}

/**
 * Cleans markdown formatting, emojis and code blocks for fluid spoken voice.
 */
export function cleanTextForSpeech(markdown: string): string {
  if (!markdown) return '';
  try {
    return markdown
      .replace(/```[\s\S]*?```/g, 'Bloc de code omis pour la lecture vocale.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[#*_~>|]/g, ' ')
      .replace(/•|\*/g, ', ')
      // Safe replacement of surrogate pairs / emojis
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
      .replace(/[\u2600-\u27BF]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  } catch (e) {
    return (markdown || '').slice(0, 500);
  }
}

let activeUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Speaks text out loud in French using browser SpeechSynthesis.
 */
export function speakText(
  text: string,
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
    rate?: number;
    pitch?: number;
  }
): void {
  if (!isSpeechSynthesisSupported()) return;

  try {
    stopSpeaking();

    const clean = cleanTextForSpeech(text);
    if (!clean) return;

    // Slice to reasonable length to avoid browser synthesis hang
    const clipped = clean.slice(0, 1500);
    const utterance = new SpeechSynthesisUtterance(clipped);

    utterance.lang = 'fr-FR';
    utterance.rate = options?.rate || 1.05;
    utterance.pitch = options?.pitch || 1.0;

    // Pick best French voice if available
    try {
      const voices = window.speechSynthesis.getVoices();
      if (Array.isArray(voices) && voices.length > 0) {
        const frenchVoice = voices.find(
          (v) => v && v.lang && v.lang.startsWith('fr') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Audrey') || v.name.includes('Thomas') || (v as any).localService)
        ) || voices.find((v) => v && v.lang && v.lang.startsWith('fr'));

        if (frenchVoice) {
          utterance.voice = frenchVoice;
        }
      }
    } catch (e) {
      // Voice listing failed, continue with default voice
    }

    utterance.onstart = () => {
      activeUtterance = utterance;
      if (options?.onStart) options.onStart();
    };

    utterance.onend = () => {
      activeUtterance = null;
      if (options?.onEnd) options.onEnd();
    };

    utterance.onerror = (e) => {
      activeUtterance = null;
      if (options?.onError) options.onError();
    };

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    activeUtterance = null;
    if (options?.onError) options.onError();
  }
}

/**
 * Stops any active speech synthesis immediately.
 */
export function stopSpeaking(): void {
  if (!isSpeechSynthesisSupported()) return;
  try {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  } catch (e) {}
}

/**
 * Returns whether speech is currently in progress.
 */
export function isSpeaking(): boolean {
  if (!isSpeechSynthesisSupported()) return false;
  return window.speechSynthesis.speaking;
}
