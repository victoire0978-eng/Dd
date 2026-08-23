import React, { useState, useEffect } from 'react';
import { DakisMemory, SharedCloudCourse } from '../types';
import {
  getMemory,
  saveMemory,
  saveKnownPerson,
  removeKnownPerson,
  updatePasswords,
  resetMemory,
  verifyAdminPassword,
} from '../utils/memory';
import {
  fetchOfficialCourses,
  fetchStudentSharedCourses,
  addOfficialCourseByAdmin,
  deleteOrCensorCourse,
  exportOfficialCoursesJson,
  getPublicJsonUrl,
  setPublicJsonUrl,
} from '../utils/publicLibrary';
import {
  Shield,
  KeyRound,
  Trash2,
  Lock,
  Save,
  RotateCcw,
  CheckCircle,
  X,
  Heart,
  Crown,
  Eye,
  EyeOff,
  AlertTriangle,
  BookOpen,
  Plus,
  Link,
  Copy,
  Globe,
  FileText,
  Ban,
  Check,
} from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemoryUpdated: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, onMemoryUpdated }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminTab, setAdminTab] = useState<'security' | 'courses'>('security');
  const [authPassword, setAuthPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  const [memory, setMemory] = useState<DakisMemory>(getMemory());
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonInfo, setNewPersonInfo] = useState('');

  // Passwords
  const [magicWordInput, setMagicWordInput] = useState('');
  const [queenPasswordInput, setQueenPasswordInput] = useState('');
  const [bossPasswordInput, setBossPasswordInput] = useState('');
  const [showNewPasswords, setShowNewPasswords] = useState(false);

  const [creatorName, setCreatorName] = useState('');
  const [creatorInfo, setCreatorInfo] = useState('');
  const [girlfriendName, setGirlfriendName] = useState('');
  const [girlfriendInfo, setGirlfriendInfo] = useState('');

  // Course Admin Management (Zero-Config)
  const [officialCoursesList, setOfficialCoursesList] = useState<SharedCloudCourse[]>([]);
  const [studentCoursesList, setStudentCoursesList] = useState<SharedCloudCourse[]>([]);
  const [isAddingOfficial, setIsAddingOfficial] = useState(false);
  const [officialTitle, setOfficialTitle] = useState('');
  const [officialFaculty, setOfficialFaculty] = useState('Polytechnique');
  const [officialPdfUrl, setOfficialPdfUrl] = useState('');
  const [officialDescription, setOfficialDescription] = useState('');
  const [customJsonUrlInput, setCustomJsonUrlInput] = useState('');
  const [jsonCopied, setJsonCopied] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Anti brute force timer
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

  useEffect(() => {
    if (isOpen) {
      const current = getMemory();
      setMemory(current);
      setMagicWordInput('');
      setQueenPasswordInput('');
      setBossPasswordInput('');
      setCreatorName(current.creator.nom);
      setCreatorInfo(current.creator.infos);
      setGirlfriendName(current.girlfriend.nom);
      setGirlfriendInfo(current.girlfriend.infos);
      setCustomJsonUrlInput(getPublicJsonUrl());
      loadCoursesList();
    } else {
      setIsAuthenticated(false);
      setAuthPassword('');
      setShowAuthPassword(false);
      setAuthError(false);
    }
  }, [isOpen]);

  const loadCoursesList = async () => {
    try {
      const officials = await fetchOfficialCourses();
      setOfficialCoursesList(officials);
      const students = fetchStudentSharedCourses();
      setStudentCoursesList(students);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    const trimmed = authPassword.trim();
    if (!trimmed) return;

    if (verifyAdminPassword(trimmed)) {
      setIsAuthenticated(true);
      setAuthError(false);
      setFailedAttempts(0);
    } else {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      setAuthError(true);

      if (nextAttempts >= 5) {
        setLockoutSeconds(30);
      }
    }
  };

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim() || !newPersonInfo.trim()) return;

    const updated = saveKnownPerson(newPersonName.trim(), newPersonInfo.trim());
    setMemory(updated);
    setNewPersonName('');
    setNewPersonInfo('');
    onMemoryUpdated();
    showToast(`Personne "${newPersonName}" ajoutée à la mémoire !`);
  };

  const handleDeletePerson = (name: string) => {
    const updated = removeKnownPerson(name);
    setMemory(updated);
    onMemoryUpdated();
    showToast(`Personne "${name}" supprimée.`);
  };

  const handleUpdatePasswords = (e: React.FormEvent) => {
    e.preventDefault();

    if (!magicWordInput.trim() && !queenPasswordInput.trim() && !bossPasswordInput.trim()) {
      showToast('Aucun nouveau mot de passe saisi.');
      return;
    }

    const updated = updatePasswords(
      magicWordInput.trim() || undefined,
      queenPasswordInput.trim() || undefined,
      bossPasswordInput.trim() || undefined
    );

    setMemory(updated);
    setMagicWordInput('');
    setQueenPasswordInput('');
    setBossPasswordInput('');
    onMemoryUpdated();
    showToast('Mots de passe mis à jour et sécurisés avec SHA-256 !');
  };

  const handleSaveProfiles = () => {
    const updated: DakisMemory = {
      ...memory,
      creator: {
        nom: creatorName.trim() || memory.creator.nom,
        infos: creatorInfo.trim() || memory.creator.infos,
      },
      girlfriend: {
        nom: girlfriendName.trim() || memory.girlfriend.nom,
        infos: girlfriendInfo.trim() || memory.girlfriend.infos,
      },
    };

    saveMemory(updated);
    setMemory(updated);
    onMemoryUpdated();
    showToast('Profils ISMAEL et Daniella mis à jour !');
  };

  const handleResetToDefault = () => {
    if (confirm('Voulez-vous vraiment réinitialiser toute la mémoire DAKIS aux paramètres par défaut ?')) {
      const reset = resetMemory();
      setMemory(reset);
      setCreatorName(reset.creator.nom);
      setCreatorInfo(reset.creator.infos);
      setGirlfriendName(reset.girlfriend.nom);
      setGirlfriendInfo(reset.girlfriend.infos);
      onMemoryUpdated();
      showToast('Mémoire et mots de passe réinitialisés.');
    }
  };

  // Add Official Course by Admin
  const handleAddOfficialCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officialTitle.trim() || !officialPdfUrl.trim()) {
      alert('Veuillez renseigner le titre et l’URL directe du PDF.');
      return;
    }

    addOfficialCourseByAdmin({
      title: officialTitle.trim(),
      faculty: officialFaculty,
      downloadUrl: officialPdfUrl.trim(),
      description: officialDescription.trim() || 'Cours officiel validé par Boss ISMAEL',
      totalPages: 25,
    });

    setOfficialTitle('');
    setOfficialPdfUrl('');
    setOfficialDescription('');
    setIsAddingOfficial(false);
    loadCoursesList();
    showToast('Cours officiel ajouté avec succès à la bibliothèque publique !');
  };

  // Censor or Delete a Course
  const handleDeleteCourse = (courseId: string) => {
    if (!confirm('Supprimer / Censurer ce document de la bibliothèque ?')) return;
    deleteOrCensorCourse(courseId);
    loadCoursesList();
    showToast('Document supprimé de la bibliothèque.');
  };

  // Export JSON
  const handleCopyExportJson = async () => {
    const jsonStr = await exportOfficialCoursesJson();
    try {
      await navigator.clipboard.writeText(jsonStr);
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 3000);
      showToast('JSON copié dans le presse-papier !');
    } catch (e) {
      alert('Contenu JSON :\n' + jsonStr);
    }
  };

  const handleSaveCustomJsonUrl = () => {
    setPublicJsonUrl(customJsonUrlInput);
    loadCoursesList();
    showToast('URL du catalogue JSON mise à jour !');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-[#121214]/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl flex flex-col text-zinc-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                Espace Administrateur (Boss ISMAEL)
              </h2>
              <p className="text-[11px] text-white/40 uppercase tracking-wider font-medium">
                Gestion Système & Bibliothèque Publique
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

        {/* Tabs */}
        {isAuthenticated && (
          <div className="flex items-center gap-2 px-5 pt-3 pb-2 border-b border-white/10 bg-white/5">
            <button
              onClick={() => setAdminTab('security')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                adminTab === 'security'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Sécurité & Profils</span>
            </button>

            <button
              onClick={() => setAdminTab('courses')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                adminTab === 'courses'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Gestion Bibliothèque Publique</span>
            </button>
          </div>
        )}

        {/* Toast */}
        {toastMessage && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in backdrop-blur-md">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {!isAuthenticated ? (
            /* Auth screen */
            <div className="py-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center text-purple-400 mb-3 shadow-lg">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">Authentification Administrateur</h3>
              <p className="text-xs text-white/50 mt-1 max-w-[280px] leading-relaxed">
                Entre le mot de passe Boss ISMAEL (<span className="font-mono text-white/80">bouss2026</span> ou personnalisé).
              </p>

              <form onSubmit={handleAuthenticate} className="w-full max-w-xs mt-5 space-y-3">
                <div className="relative flex items-center">
                  <input
                    type={showAuthPassword ? 'text' : 'password'}
                    autoFocus
                    disabled={lockoutSeconds > 0}
                    value={authPassword}
                    onChange={(e) => {
                      setAuthPassword(e.target.value);
                      setAuthError(false);
                    }}
                    placeholder={lockoutSeconds > 0 ? `Verrouillé (${lockoutSeconds}s)` : 'Mot de passe secret...'}
                    className={`w-full bg-white/5 border rounded-xl pl-4 pr-10 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none backdrop-blur-md transition ${
                      lockoutSeconds > 0
                        ? 'border-rose-500/50 bg-rose-500/5 cursor-not-allowed opacity-70'
                        : 'border-white/10 focus:border-purple-500/60'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAuthPassword(!showAuthPassword)}
                    disabled={lockoutSeconds > 0}
                    className="absolute right-3 p-1 text-white/40 hover:text-white/80 transition"
                  >
                    {showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {authError && lockoutSeconds === 0 && (
                  <p className="text-xs text-rose-400 text-left pl-1 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    <span>Mot de passe incorrect ({failedAttempts}/5 essais).</span>
                  </p>
                )}

                {lockoutSeconds > 0 && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-left">
                    <p className="font-semibold flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" /> Sécurité Anti-Bruteforce Active
                    </p>
                    <p className="text-[11px] text-white/60 mt-0.5">
                      Trop de tentatives échouées. Réessayez dans <span className="font-bold text-rose-300">{lockoutSeconds} secondes</span>.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={lockoutSeconds > 0}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-500 hover:to-orange-400 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition active:scale-95"
                >
                  Déverrouiller l'Admin
                </button>
              </form>
            </div>
          ) : adminTab === 'security' ? (
            /* Tab 1: Security & Profiles */
            <>
              <section className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Mots de Passe Hachés (SHA-256)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewPasswords(!showNewPasswords)}
                    className="text-[11px] text-white/50 hover:text-white flex items-center gap-1 transition"
                  >
                    {showNewPasswords ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showNewPasswords ? 'Masquer' : 'Afficher la saisie'}</span>
                  </button>
                </div>

                <form onSubmit={handleUpdatePasswords} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-white/80 block mb-1">
                      Mot de passe Boss ISMAEL :
                    </label>
                    <input
                      type={showNewPasswords ? 'text' : 'password'}
                      value={bossPasswordInput}
                      onChange={(e) => setBossPasswordInput(e.target.value)}
                      placeholder="Nouveau mot de passe Boss..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-white/80 block mb-1">
                      Mot de passe Reine Daniella :
                    </label>
                    <input
                      type={showNewPasswords ? 'text' : 'password'}
                      value={queenPasswordInput}
                      onChange={(e) => setQueenPasswordInput(e.target.value)}
                      placeholder="Nouveau mot de passe Reine..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-white/80 block mb-1">
                      Mot Magique Famille :
                    </label>
                    <input
                      type={showNewPasswords ? 'text' : 'password'}
                      value={magicWordInput}
                      onChange={(e) => setMagicWordInput(e.target.value)}
                      placeholder="Nouveau mot magique famille..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition active:scale-95 shadow-md"
                  >
                    Enregistrer les Nouveaux Mots de Passe
                  </button>
                </form>
              </section>

              {/* Profiles */}
              <section className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                  <Heart className="w-3.5 h-3.5 fill-rose-400" />
                  <span>Profils Créateur & DAKIS</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-white/80 block mb-1">
                      Créateur (ISMAEL) :
                    </label>
                    <input
                      type="text"
                      value={creatorName}
                      onChange={(e) => setCreatorName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white mb-1.5 focus:outline-none"
                    />
                    <textarea
                      rows={2}
                      value={creatorInfo}
                      onChange={(e) => setCreatorInfo(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white/80 focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-white/80 block mb-1">
                      Meuf (Daniella / DAKIS) :
                    </label>
                    <input
                      type="text"
                      value={girlfriendName}
                      onChange={(e) => setGirlfriendName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white mb-1.5 focus:outline-none"
                    />
                    <textarea
                      rows={2}
                      value={girlfriendInfo}
                      onChange={(e) => setGirlfriendInfo(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white/80 focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveProfiles}
                    className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg shadow-orange-500/20"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Mettre à jour les Profils</span>
                  </button>
                </div>
              </section>

              {/* Reset */}
              <div className="pt-2 flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="flex items-center gap-1 text-white/40 hover:text-rose-400 p-1 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Réinitialiser mémoire par défaut</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAuthenticated(false)}
                  className="text-white/40 hover:text-white p-1"
                >
                  Verrouiller la session
                </button>
              </div>
            </>
          ) : (
            /* Tab 2: Gestion Bibliothèque Publique (Zero-Config) */
            <div className="space-y-4">
              {/* 1. Add Official PDF via direct URL */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Ajouter un Cours Officiel DAKIS</span>
                  </h4>
                  <p className="text-[11px] text-white/60 mt-0.5">
                    Ajoutez un PDF public par lien direct .pdf pour tous les étudiants.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingOfficial(!isAddingOfficial)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingOfficial ? 'Fermer' : 'Ajouter'}</span>
                </button>
              </div>

              {/* Add Official Form */}
              {isAddingOfficial && (
                <form onSubmit={handleAddOfficialCourse} className="p-4 rounded-2xl bg-black/40 border border-amber-500/40 space-y-3">
                  <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Link className="w-4 h-4 text-amber-400" />
                    <span>Lien Public du Nouveau Cours</span>
                  </h5>

                  <div>
                    <label className="text-[10.5px] text-white/60 block mb-1">Titre du cours :</label>
                    <input
                      type="text"
                      value={officialTitle}
                      onChange={(e) => setOfficialTitle(e.target.value)}
                      placeholder="Ex: Traité de Béton Armé & Eurocode 2"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] text-white/60 block mb-1">Lien direct URL du PDF (.pdf) :</label>
                    <input
                      type="url"
                      value={officialPdfUrl}
                      onChange={(e) => setOfficialPdfUrl(e.target.value)}
                      placeholder="https://ia800200.us.archive.org/.../cours.pdf"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10.5px] text-white/60 block mb-1">Faculté :</label>
                      <select
                        value={officialFaculty}
                        onChange={(e) => setOfficialFaculty(e.target.value)}
                        className="w-full px-3 py-2 bg-[#18181b] border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                      >
                        <option value="Polytechnique">Polytechnique</option>
                        <option value="Droit">Droit</option>
                        <option value="Médecine">Médecine</option>
                        <option value="Économie">Économie</option>
                        <option value="Sciences">Sciences</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10.5px] text-white/60 block mb-1">Description courte :</label>
                      <input
                        type="text"
                        value={officialDescription}
                        onChange={(e) => setOfficialDescription(e.target.value)}
                        placeholder="Ex: Formulaire et cours de calcul..."
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingOfficial(false)}
                      className="px-3 py-1.5 text-xs text-white/50 hover:text-white"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md active:scale-95 transition"
                    >
                      Publier dans la Bibliothèque Publique
                    </button>
                  </div>
                </form>
              )}

              {/* 2. Public Catalog Hosting & Export */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>Catalogue JSON Public (GitHub / jsDelivr)</span>
                  </h4>
                  <button
                    onClick={handleCopyExportJson}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 text-[11px] font-semibold flex items-center gap-1 transition"
                  >
                    {jsonCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{jsonCopied ? 'Copié !' : 'Copier JSON'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-white/50 leading-relaxed">
                  Pour héberger votre catalogue sur GitHub : créez un fichier <span className="font-mono text-white/80">cours.json</span>, collez le contenu JSON ci-dessus, et collez l'URL CDN jsDelivr ci-dessous.
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customJsonUrlInput}
                    onChange={(e) => setCustomJsonUrlInput(e.target.value)}
                    placeholder="https://cdn.jsdelivr.net/gh/user/repo/cours.json"
                    className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomJsonUrl}
                    className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs"
                  >
                    Enregistrer URL
                  </button>
                </div>
              </div>

              {/* 3. List of Official and Shared Courses with Censor/Delete button */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center justify-between">
                  <span>Modération des Cours Publics ({officialCoursesList.length + studentCoursesList.length})</span>
                </h4>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {officialCoursesList.map((course) => (
                    <div
                      key={course.id}
                      className="p-3 rounded-xl bg-black/30 border border-amber-500/20 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-white truncate">{course.title}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Officiel
                          </span>
                        </div>
                        <p className="text-[10.5px] text-white/40 truncate">
                          {course.faculty} • {course.uploaderName}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition"
                        title="Censurer / Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {studentCoursesList.map((course) => (
                    <div
                      key={course.id}
                      className="p-3 rounded-xl bg-black/30 border border-purple-500/20 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-white truncate">{course.title}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Étudiant
                          </span>
                        </div>
                        <p className="text-[10.5px] text-white/40 truncate">
                          {course.faculty} • {course.uploaderName}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition"
                        title="Censurer / Supprimer"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
