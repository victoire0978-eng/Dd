import React from 'react';
import { Download, Smartphone, Share, PlusSquare, Check, X } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstalled: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstalled,
}) => {
  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        onInstalled();
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-md bg-[#121214]/90 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl flex flex-col text-zinc-100 overflow-hidden">
        {/* Subtle glow orb */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                Installer DAKIS AI (PWA)
              </h2>
              <p className="text-[11px] text-white/40 uppercase tracking-wider font-medium">Sur iPhone, iPad & Android</p>
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
        <div className="p-5 space-y-4 text-xs leading-relaxed">
          {/* Quick Native Install button if available */}
          {deferredPrompt && (
            <button
              onClick={handleNativeInstall}
              className="w-full py-3 bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Installer instantanément sur cet appareil</span>
            </button>
          )}

          {/* iOS Instructions */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-2.5 shadow-md">
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <Smartphone className="w-4 h-4 text-rose-400" />
              <span className="text-white">Guide iPhone / Safari (iOS)</span>
            </div>
            <ol className="space-y-2 text-white/80 text-[11.5px]">
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center text-[10px] font-bold mt-0.5 flex-shrink-0">
                  1
                </span>
                <span>Ouvre cette page dans <strong>Safari</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center text-[10px] font-bold mt-0.5 flex-shrink-0">
                  2
                </span>
                <span className="flex items-center gap-1">
                  Touche le bouton <strong>Partager</strong> <Share className="w-3.5 h-3.5 text-blue-400 inline" /> en bas de l'écran.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center text-[10px] font-bold mt-0.5 flex-shrink-0">
                  3
                </span>
                <span className="flex items-center gap-1">
                  Sélectionne <strong>Sur l'écran d'accueil</strong> <PlusSquare className="w-3.5 h-3.5 text-white/80 inline" />.
                </span>
              </li>
            </ol>
          </div>

          {/* Android Instructions */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-2.5 shadow-md">
            <div className="flex items-center gap-2 text-orange-400 font-bold">
              <Smartphone className="w-4 h-4 text-orange-400" />
              <span className="text-white">Guide Android / Chrome</span>
            </div>
            <p className="text-white/80 text-[11.5px] leading-relaxed">
              Appuie sur les <strong>trois points verticaux (⋮)</strong> en haut à droite du navigateur, puis sélectionne <strong>"Installer l'application"</strong> ou <strong>"Ajouter à l'écran d'accueil"</strong>.
            </p>
          </div>

          {/* Advantages */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 text-emerald-300 text-[11px] backdrop-blur-md">
            <Check className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>Expérience plein écran 100% fluide sans barre d'adresse comme une vraie application native !</span>
          </div>
        </div>
      </div>
    </div>
  );
};
