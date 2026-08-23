import React, { useState } from 'react';
import { ChatSession } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  Search,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface SessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
  onDeleteSession: (sessionId: string) => void;
  isIsmaelBoss?: boolean;
  isDakisQueen?: boolean;
}

export const SessionsModal: React.FC<SessionsModalProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onRenameSession,
  onDeleteSession,
  isIsmaelBoss,
  isDakisQueen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredSessions = sessions.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const matchTitle = (s.title || '').toLowerCase().includes(q);
    const matchMessages = s.messages.some((m) =>
      (m.content || '').toLowerCase().includes(q)
    );
    return matchTitle || matchMessages;
  });

  const startEditing = (s: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(s.id);
    setEditTitle(s.title);
  };

  const saveEditing = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingId === id) {
      onDeleteSession(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
    }
  };

  const formatSessionDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const now = new Date();
    const diffHours = (now.getTime() - d.getTime()) / (1000 * 3600);

    if (diffHours < 24 && d.getDate() === now.getDate()) {
      return `Aujourd'hui à ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffHours < 48 && d.getDate() === now.getDate() - 1) {
      return `Hier à ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-full max-w-lg max-h-[85vh] flex flex-col bg-[#121214] border rounded-3xl shadow-2xl overflow-hidden z-10 ${
            isIsmaelBoss
              ? 'border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.15)]'
              : isDakisQueen
              ? 'border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.15)]'
              : 'border-white/10 shadow-[0_0_40px_rgba(249,115,22,0.1)]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-2xl ${
                  isIsmaelBoss
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : isDakisQueen
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'bg-orange-500/10 text-orange-400'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  Historique des Discussions
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/60 font-normal">
                    {sessions.length}
                  </span>
                </h3>
                <p className="text-xs text-white/40">
                  Reprends tes conversations avec DAKIS AI à tout moment
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  onNewSession();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-orange-500 hover:bg-orange-400 text-white transition active:scale-95 shadow-md shadow-orange-500/20"
                title="Créer une nouvelle discussion"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Nouveau chat</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-5 pt-3.5 pb-2 bg-white/[0.01]">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une discussion ou un message..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-white/30 hover:text-white text-xs"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 divide-y-0">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Clock className="w-10 h-10 mx-auto text-white/20 mb-3" />
                <p className="text-sm font-medium text-white/60">
                  {searchQuery
                    ? 'Aucune discussion ne correspond à votre recherche.'
                    : 'Aucune discussion enregistrée pour le moment.'}
                </p>
                <button
                  onClick={() => {
                    onNewSession();
                    onClose();
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 text-orange-400" />
                  Démarrer une nouvelle discussion
                </button>
              </div>
            ) : (
              filteredSessions.map((s) => {
                const isActive = s.id === activeSessionId;
                const isEditing = editingId === s.id;
                const isDeleting = deletingId === s.id;
                const messageCount = s.messages.length;
                const lastMsg = s.messages[s.messages.length - 1]?.content || '';
                const previewText = lastMsg.replace(/[#*_`]/g, '').slice(0, 75);

                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      if (!isEditing) {
                        onSelectSession(s.id);
                        onClose();
                      }
                    }}
                    className={`group relative flex flex-col p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isActive
                        ? isIsmaelBoss
                          ? 'bg-cyan-500/10 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                          : isDakisQueen
                          ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/10'
                          : 'bg-orange-500/10 border-orange-500/40 shadow-lg shadow-orange-500/10'
                        : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {/* Title or Edit Field */}
                        {isEditing ? (
                          <form
                            onSubmit={(e) => saveEditing(s.id, e)}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 mb-1"
                          >
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              autoFocus
                              className="flex-1 bg-white/10 border border-orange-500/50 rounded-lg px-2 py-1 text-xs sm:text-sm text-white focus:outline-none"
                            />
                            <button
                              type="submit"
                              className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                              title="Valider"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="p-1 rounded-lg bg-white/10 text-white/60 hover:text-white"
                              title="Annuler"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </form>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm text-white truncate group-hover:text-orange-300 transition-colors">
                              {s.title}
                            </h4>
                            {isActive && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isIsmaelBoss
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                    : isDakisQueen
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                }`}
                              >
                                En cours
                              </span>
                            )}
                          </div>
                        )}

                        {/* Last message preview */}
                        {!isEditing && previewText && (
                          <p className="text-xs text-white/45 truncate mt-1">
                            {previewText}...
                          </p>
                        )}

                        {/* Metadata row */}
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-white/35">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatSessionDate(s.updatedAt || s.createdAt)}
                          </span>
                          <span>•</span>
                          <span>{messageCount} message{messageCount > 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div
                        className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!isEditing && (
                          <button
                            onClick={(e) => startEditing(s, e)}
                            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
                            title="Renommer la discussion"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={(e) => handleDelete(s.id, e)}
                          className={`p-1.5 rounded-lg transition ${
                            isDeleting
                              ? 'bg-red-500 text-white shadow-md'
                              : 'text-white/40 hover:text-red-400 hover:bg-white/10'
                          }`}
                          title={isDeleting ? 'Confirmer la suppression' : 'Supprimer la discussion'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Delete Confirmation Banner */}
                    {isDeleting && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2.5 pt-2 border-t border-red-500/20 flex items-center justify-between text-xs"
                      >
                        <span className="text-red-400 flex items-center gap-1 font-medium">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Supprimer définitivement ?
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(s.id);
                              setDeletingId(null);
                            }}
                            className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition"
                          >
                            Supprimer
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingId(null);
                            }}
                            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                          >
                            Annuler
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          <div className="px-5 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-white/40">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              Sauvegarde automatique instantanée
            </span>
            <button
              onClick={onClose}
              className="hover:text-white transition font-medium"
            >
              Fermer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
