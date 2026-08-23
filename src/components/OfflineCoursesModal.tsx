import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  UploadCloud,
  FileText,
  Search,
  Calculator,
  BrainCircuit,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Layers,
  GraduationCap,
  X,
  Plus,
  RefreshCw,
  Globe,
  Lock,
  Share2,
  Zap,
  HelpCircle,
  Sigma,
  Eye,
  Crown,
  Link,
  Users,
  ExternalLink,
  BookMarked,
  Filter,
} from 'lucide-react';
import {
  LocalCourse,
  CourseChunk,
  SharedCloudCourse,
  SearchResultMatch,
  QuizQuestion,
} from '../types';
import {
  getAllLocalCourses,
  saveCourseWithChunks,
  deleteLocalCourse,
  getCourseChunks,
  getAllChunks,
} from '../utils/courseDb';
import { extractPdfContent } from '../utils/pdfExtractor';
import { searchOfflineChunks } from '../utils/offlineSearchEngine';
import { solveOfflineMath, MathCalculationResult } from '../utils/offlineMathEngine';
import {
  generateOffline10PointSummary,
  generateOfflineQuiz,
  extractOfflineFormulas,
} from '../utils/offlineStudyTools';
import {
  fetchOfficialCourses,
  searchInternetArchiveBooks,
  fetchStudentSharedCourses,
  shareStudentCourse,
  reportCourse,
  downloadPdfFromUrl,
  InternetArchiveBook,
} from '../utils/publicLibrary';
import { getDeviceId } from '../utils/memory';

interface OfflineCoursesModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIsmaelBoss?: boolean;
  isDakisQueen?: boolean;
}

type TabType = 'my_courses' | 'search_math' | 'shared_library' | 'study_tools';
type SharedSubSection = 'official' | 'internet_archive' | 'students';

export const OfflineCoursesModal: React.FC<OfflineCoursesModalProps> = ({
  isOpen,
  onClose,
  isIsmaelBoss,
  isDakisQueen,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('my_courses');
  const [sharedSubSection, setSharedSubSection] = useState<SharedSubSection>('official');

  const [localCourses, setLocalCourses] = useState<LocalCourse[]>([]);
  const [allChunksList, setAllChunksList] = useState<CourseChunk[]>([]);
  const [officialCourses, setOfficialCourses] = useState<SharedCloudCourse[]>([]);
  const [studentCourses, setStudentCourses] = useState<SharedCloudCourse[]>([]);

  // Internet Archive Books
  const [archiveSearchQuery, setArchiveSearchQuery] = useState<string>('Résistance des matériaux');
  const [archiveBooks, setArchiveBooks] = useState<InternetArchiveBook[]>([]);
  const [isSearchingArchive, setIsSearchingArchive] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');

  // Search & Math query
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [searchResults, setSearchResults] = useState<SearchResultMatch[]>([]);
  const [activeMathResult, setActiveMathResult] = useState<MathCalculationResult | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Import Modal State (2 choices: Local PDF or Direct URL)
  const [showImportChooser, setShowImportChooser] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'file' | 'url' | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [importUrl, setImportUrl] = useState<string>('');
  const [courseTitleInput, setCourseTitleInput] = useState<string>('');
  const [facultyInput, setFacultyInput] = useState<string>('Polytechnique');
  const [shareWithStudents, setShareWithStudents] = useState<boolean>(false);
  const [courseDescription, setCourseDescription] = useState<string>('');

  // Study Tools state
  const [selectedStudyCourseId, setSelectedStudyCourseId] = useState<string>('');
  const [studyToolView, setStudyToolView] = useState<'summary' | 'quiz' | 'formulas'>('summary');
  const [activeSummary, setActiveSummary] = useState<string[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion[]>([]);
  const [activeFormulas, setActiveFormulas] = useState<{ formula: string; page: number }[]>([]);
  const [quizUserAnswers, setQuizUserAnswers] = useState<Record<number, number>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // Shared library search & filter
  const [sharedSearchQuery, setSharedSearchQuery] = useState<string>('');
  const [sharedFacultyFilter, setSharedFacultyFilter] = useState<string>('all');
  const [reportedIds, setReportedIds] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      performArchiveSearch('Résistance des matériaux');
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const courses = await getAllLocalCourses();
      setLocalCourses(courses);
      const chunks = await getAllChunks();
      setAllChunksList(chunks);

      if (courses.length > 0 && !selectedStudyCourseId) {
        setSelectedStudyCourseId(courses[0].id);
      }

      // Load official & student courses without requiring any API keys
      const officials = await fetchOfficialCourses();
      setOfficialCourses(officials);

      const students = fetchStudentSharedCourses();
      setStudentCourses(students);
    } catch (err) {
      console.error('Error loading offline courses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const performArchiveSearch = async (term: string) => {
    if (!term.trim()) return;
    setIsSearchingArchive(true);
    try {
      const results = await searchInternetArchiveBooks(term);
      setArchiveBooks(results);
    } catch (e) {
      console.error('Archive search failed:', e);
    } finally {
      setIsSearchingArchive(false);
    }
  };

  // Perform instant offline search & math calculations
  const handlePerformSearch = (queryText: string) => {
    setSearchQuery(queryText);
    const clean = queryText.trim();
    if (!clean) {
      setSearchResults([]);
      setActiveMathResult(null);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    const courseFilter = selectedCourseFilter === 'all' ? undefined : selectedCourseFilter;
    const { matches, mathResult } = searchOfflineChunks(clean, allChunksList, courseFilter);

    setSearchResults(matches);
    setActiveMathResult(mathResult);
  };

  // Handle PDF file selection from phone or PC
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      alert('Veuillez sélectionner un fichier au format .PDF');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      alert('Le fichier dépasse la limite autorisée de 25 Mo.');
      return;
    }

    setUploadFile(file);
    setCourseTitleInput(file.name.replace(/\.pdf$/i, ''));
    setImportMode('file');
    setShowImportChooser(false);
  };

  // Save imported PDF (from File or from URL)
  const handleSaveImport = async () => {
    setIsLoading(true);
    setLoadingStatus('Extraction du texte et indexation sémantique...');

    try {
      let pdfBuffer: ArrayBuffer;
      let title = courseTitleInput.trim();

      if (importMode === 'file') {
        if (!uploadFile) throw new Error('Aucun fichier sélectionné.');
        pdfBuffer = await uploadFile.arrayBuffer();
        if (!title) title = uploadFile.name.replace(/\.pdf$/i, '');
      } else {
        if (!importUrl.trim()) throw new Error('Veuillez renseigner une URL valide.');
        setLoadingStatus(`Téléchargement depuis l'URL...`);
        pdfBuffer = await downloadPdfFromUrl(importUrl.trim(), title || 'Cours Web');
        if (!title) title = 'Cours Web Téléchargé';
      }

      const courseId = 'course_' + Date.now();
      const extracted = await extractPdfContent(
        pdfBuffer,
        title,
        courseId,
        facultyInput
      );

      const newLocalCourse: LocalCourse = {
        id: courseId,
        title: title || extracted.title,
        faculty: facultyInput,
        totalPages: extracted.totalPages,
        fileSize: extracted.fileSize,
        createdAt: Date.now(),
        summary: extracted.summaryPoints,
        formulas: extracted.formulas,
        isOfficial: isIsmaelBoss,
        sharedOnline: shareWithStudents,
      };

      // 1. Save to local IndexedDB (100% offline)
      await saveCourseWithChunks(newLocalCourse, extracted.chunks);

      // 2. If student wants to share with peers
      if (shareWithStudents) {
        const uploaderId = getDeviceId();
        const uploaderName = isIsmaelBoss
          ? 'Boss ISMAEL (Créateur) ⚡'
          : isDakisQueen
          ? 'Reine Daniella (DAKIS) 👑'
          : 'Étudiant DAKIS';

        shareStudentCourse({
          title: newLocalCourse.title,
          faculty: newLocalCourse.faculty,
          totalPages: newLocalCourse.totalPages,
          fileSize: newLocalCourse.fileSize,
          createdAt: Date.now(),
          uploaderId,
          uploaderName,
          isOfficial: !!isIsmaelBoss,
          description: courseDescription || `Cours partagé de ${facultyInput}`,
        });
      }

      await loadInitialData();
      setImportMode(null);
      setUploadFile(null);
      setImportUrl('');
      setCourseTitleInput('');
      setCourseDescription('');
      setActiveTab('my_courses');
    } catch (err: any) {
      console.error('Import error:', err);
      alert("Erreur lors de l'importation : " + (err.message || 'Impossible d’extraire le document'));
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  // Delete a local course
  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce cours de votre mémoire locale ?')) return;
    try {
      await deleteLocalCourse(courseId);
      await loadInitialData();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Download a course from Public Library into local IndexedDB for airplane mode
  const handleDownloadPublicCourse = async (course: SharedCloudCourse) => {
    setIsLoading(true);
    setLoadingStatus(`Téléchargement de "${course.title}" pour le mode avion...`);

    try {
      let pdfBuffer: ArrayBuffer;

      if (course.downloadUrl) {
        pdfBuffer = await downloadPdfFromUrl(course.downloadUrl, course.title, course.sampleText);
      } else {
        const text = course.sampleText || `Cours : ${course.title}\nFaculté : ${course.faculty}\n${course.description || ''}`;
        pdfBuffer = new TextEncoder().encode(text).buffer;
      }

      const extracted = await extractPdfContent(
        pdfBuffer,
        course.title,
        course.id,
        course.faculty
      );

      const localCourse: LocalCourse = {
        id: course.id,
        title: course.title,
        faculty: course.faculty,
        totalPages: course.totalPages || extracted.totalPages,
        fileSize: course.fileSize || extracted.fileSize,
        createdAt: Date.now(),
        summary: extracted.summaryPoints,
        formulas: extracted.formulas,
        isOfficial: course.isOfficial,
        sharedOnline: true,
      };

      await saveCourseWithChunks(localCourse, extracted.chunks);
      await loadInitialData();
      alert(`"${course.title}" est maintenant disponible 100% hors-ligne en mode avion !`);
      setActiveTab('my_courses');
    } catch (err: any) {
      console.error('Download error:', err);
      alert('Impossible de télécharger ce cours : ' + err.message);
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  // Download Internet Archive book directly to offline IndexedDB
  const handleDownloadArchiveBook = async (book: InternetArchiveBook) => {
    setIsLoading(true);
    setLoadingStatus(`Téléchargement du livre "${book.title}" depuis Internet Archive...`);

    try {
      const pdfBuffer = await downloadPdfFromUrl(book.pdfUrl, book.title, book.description);
      const courseId = 'archive_' + book.identifier;

      const extracted = await extractPdfContent(
        pdfBuffer,
        book.title,
        courseId,
        'Sciences & Bibliothèque'
      );

      const localCourse: LocalCourse = {
        id: courseId,
        title: book.title,
        faculty: 'Sciences & Bibliothèque',
        totalPages: extracted.totalPages,
        fileSize: extracted.fileSize,
        createdAt: Date.now(),
        summary: extracted.summaryPoints,
        formulas: extracted.formulas,
        isOfficial: false,
        sharedOnline: true,
      };

      await saveCourseWithChunks(localCourse, extracted.chunks);
      await loadInitialData();
      alert(`Le livre "${book.title}" a été indexé avec succès en 100% hors-ligne !`);
      setActiveTab('my_courses');
    } catch (err: any) {
      console.error('Archive book download error:', err);
      alert('Erreur lors du téléchargement : ' + err.message);
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  // Report a shared course
  const handleReportCourse = (courseId: string) => {
    if (reportedIds.includes(courseId)) {
      alert('Vous avez déjà signalé ce document.');
      return;
    }
    if (!confirm('Signaler ce cours pour contenu inapproprié ?')) return;

    const count = reportCourse(courseId);
    setReportedIds((prev) => [...prev, courseId]);
    alert(`Signalement enregistré (${count}/3).`);
    loadInitialData();
  };

  // Run study tools on selected course
  const handleRunStudyTool = async (courseId: string, toolType: 'summary' | 'quiz' | 'formulas') => {
    setSelectedStudyCourseId(courseId);
    setStudyToolView(toolType);
    setActiveTab('study_tools');

    const chunks = await getCourseChunks(courseId);

    if (toolType === 'summary') {
      const summary = generateOffline10PointSummary(chunks);
      setActiveSummary(summary);
    } else if (toolType === 'quiz') {
      const quiz = generateOfflineQuiz(chunks);
      setActiveQuiz(quiz);
      setQuizUserAnswers({});
      setQuizScore(null);
    } else if (toolType === 'formulas') {
      const formulas = extractOfflineFormulas(chunks);
      setActiveFormulas(formulas);
    }
  };

  // Handle quiz option select
  const handleQuizAnswer = (qId: number, optionIdx: number) => {
    if (quizScore !== null) return;
    setQuizUserAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  // Submit Quiz
  const handleSubmitQuiz = () => {
    let score = 0;
    activeQuiz.forEach((q) => {
      if (quizUserAnswers[q.id] === q.correctIndex) {
        score++;
      }
    });
    setQuizScore(score);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-4xl h-[92vh] max-h-[850px] bg-[#0c0c0e]/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl flex flex-col text-zinc-100 overflow-hidden">
        {/* Top Header & Navigation */}
        <div className="flex flex-col border-b border-white/10 bg-white/5 backdrop-blur-xl">
          {/* Main Title Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-inner">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  Mes Cours & Bibliothèque Publique
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    🟢 100% Mode Avion
                  </span>
                </h2>
                <p className="text-[11px] text-white/50">
                  {localCourses.length} cours en local • Recherche sémantique • Moteur mathématique • Livres libres
                </p>
              </div>
            </div>

            {/* Plus / Import Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImportChooser(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs shadow-lg shadow-orange-500/20 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Ajouter un cours</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 overflow-x-auto no-scrollbar pb-2">
            <button
              onClick={() => setActiveTab('my_courses')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'my_courses'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Mes Cours ({localCourses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('search_math')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'search_math'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Recherche & Calculs</span>
            </button>

            <button
              onClick={() => setActiveTab('shared_library')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'shared_library'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span>Bibliothèque Commune 🌍</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('study_tools');
                if (localCourses.length > 0 && !selectedStudyCourseId) {
                  handleRunStudyTool(localCourses[0].id, 'summary');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === 'study_tools'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5 text-rose-400" />
              <span>Outils d'Étude (Quiz / Résumé)</span>
            </button>
          </div>
        </div>

        {/* Global Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-3 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            <p className="text-sm font-semibold text-white/90">{loadingStatus || 'Chargement en cours...'}</p>
          </div>
        )}

        {/* Main Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: MES COURS OFFLINE */}
          {activeTab === 'my_courses' && (
            <div className="space-y-4">
              {localCourses.length === 0 ? (
                <div className="p-8 rounded-3xl bg-white/5 border border-dashed border-white/20 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Aucun cours dans votre stockage local</h3>
                    <p className="text-xs text-white/50 mt-1 max-w-md mx-auto">
                      Importez un PDF depuis votre appareil, collez un lien URL ou explorez la Bibliothèque Commune 🌍 pour télécharger des cours prêts à l'emploi.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => setShowImportChooser(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter un cours</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('shared_library')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition active:scale-95"
                    >
                      <Globe className="w-4 h-4" />
                      <span>Explorer la Bibliothèque Commune</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {localCourses.map((course) => (
                    <div
                      key={course.id}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between group shadow-lg"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                              <FileText className="w-4 h-4" />
                            </span>
                            <div>
                              <h4 className="text-sm font-bold text-white group-hover:text-orange-300 transition">
                                {course.title}
                              </h4>
                              <span className="text-[10.5px] px-2 py-0.5 rounded-md bg-white/5 text-white/60 border border-white/10">
                                {course.faculty}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteCourse(course.id)}
                            className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition"
                            title="Supprimer ce cours du stockage local"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-white/40 pt-1">
                          <span>📄 {course.totalPages} pages</span>
                          <span>💾 {(course.fileSize / 1024).toFixed(0)} Ko</span>
                          <span>📅 {new Date(course.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Action quick buttons */}
                      <div className="grid grid-cols-3 gap-1.5 mt-4 pt-3 border-t border-white/10">
                        <button
                          onClick={() => {
                            setSelectedCourseFilter(course.id);
                            setActiveTab('search_math');
                          }}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 text-[11px] font-medium transition"
                        >
                          <Search className="w-3 h-3 text-cyan-400" />
                          <span>Chercher</span>
                        </button>

                        <button
                          onClick={() => handleRunStudyTool(course.id, 'summary')}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 text-[11px] font-medium transition"
                        >
                          <FileText className="w-3 h-3 text-amber-400" />
                          <span>Résumé</span>
                        </button>

                        <button
                          onClick={() => handleRunStudyTool(course.id, 'quiz')}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 text-[11px] font-medium transition"
                        >
                          <BrainCircuit className="w-3 h-3 text-rose-400" />
                          <span>Quiz (5 Q)</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RECHERCHE & CALCULS OFFLINE */}
          {activeTab === 'search_math' && (
            <div className="space-y-4">
              {/* Big Comfortable Search Bar */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 shadow-xl">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-orange-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handlePerformSearch(e.target.value)}
                    placeholder="Pose ta question, formule ou calcul... (ex: c koi RDM, q*L^2/8 avec q=10 L=4, 2500kg en tonne, 2x+5=15)"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-orange-500 text-sm text-white placeholder-white/30 focus:outline-none transition shadow-inner"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-white/40 font-medium">Filtrer par cours :</span>
                    <select
                      value={selectedCourseFilter}
                      onChange={(e) => {
                        setSelectedCourseFilter(e.target.value);
                        if (searchQuery) handlePerformSearch(searchQuery);
                      }}
                      className="bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none"
                    >
                      <option value="all">Tous les cours ({localCourses.length})</option>
                      {localCourses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} ({c.faculty})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Similarité Cosinus & Moteur Math.js actif</span>
                  </div>
                </div>
              </div>

              {/* Offline Math Calculation Card */}
              {activeMathResult && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/40 border border-cyan-500/40 space-y-3 shadow-xl animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
                      <Calculator className="w-4 h-4 text-cyan-400" />
                      <span>
                        {activeMathResult.type === 'equation'
                          ? 'Résolution d’équation'
                          : activeMathResult.type === 'unit_conversion'
                          ? 'Conversion d’unités'
                          : activeMathResult.type === 'pdf_formula'
                          ? 'Application de formule du cours'
                          : 'Calcul Mathématique Direct'}
                      </span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">
                      Résultat : {activeMathResult.result}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-xs text-zinc-300 font-mono">
                    <p className="text-white/50 text-[11px] font-sans font-semibold uppercase tracking-wider">
                      Détail du calcul étape par étape :
                    </p>
                    {activeMathResult.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">➔</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results List */}
              {hasSearched && searchResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white/50">
                    Résultats trouvés dans vos cours ({searchResults.length})
                  </h3>

                  {searchResults.map((match, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-orange-500/30 transition-all space-y-2 shadow-md"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-orange-400">📄 {match.courseTitle}</span>
                          <span className="text-white/40">•</span>
                          <span className="text-white/60 font-semibold">Page {match.pageNumber}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold text-[10.5px]">
                          {(match.score * 100).toFixed(0)}% pertinence
                        </span>
                      </div>

                      <p className="text-xs text-white/85 leading-relaxed bg-black/20 p-2.5 rounded-xl border border-white/5 font-sans">
                        "{match.highlight || match.text}"
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {hasSearched && searchResults.length === 0 && !activeMathResult && (
                <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <p className="text-sm font-semibold text-white/70">Aucun extrait correspondant trouvé</p>
                  <p className="text-xs text-white/40">
                    Essayez avec d'autres mots-clés ou importez le syllabus complet du cours.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BIBLIOTHÈQUE COMMUNE 🌍 (3 SECTIONS SANS CONFIGURATION) */}
          {activeTab === 'shared_library' && (
            <div className="space-y-4">
              {/* 3 Sub-Sections Switcher */}
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setSharedSubSection('official')}
                  className={`flex-1 min-w-[170px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    sharedSubSection === 'official'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>📚 Cours Officiels DAKIS ({officialCourses.length})</span>
                </button>

                <button
                  onClick={() => setSharedSubSection('internet_archive')}
                  className={`flex-1 min-w-[170px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    sharedSubSection === 'internet_archive'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <BookMarked className="w-4 h-4 text-cyan-400" />
                  <span>🌐 Livres Publics Gratuits</span>
                </button>

                <button
                  onClick={() => setSharedSubSection('students')}
                  className={`flex-1 min-w-[170px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    sharedSubSection === 'students'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>👥 Cours Partagés Étudiants ({studentCourses.length})</span>
                </button>
              </div>

              {/* SUB-SECTION 1: COURS OFFICIELS DAKIS */}
              {sharedSubSection === 'official' && (
                <div className="space-y-4">
                  {/* Filter bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 flex-1 max-w-sm">
                      <Search className="w-4 h-4 text-amber-400" />
                      <input
                        type="text"
                        value={sharedSearchQuery}
                        onChange={(e) => setSharedSearchQuery(e.target.value)}
                        placeholder="Rechercher parmi les cours officiels..."
                        className="w-full bg-transparent text-xs text-white placeholder-white/30 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/40">Faculté :</span>
                      <select
                        value={sharedFacultyFilter}
                        onChange={(e) => setSharedFacultyFilter(e.target.value)}
                        className="bg-[#18181b] border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none"
                      >
                        <option value="all">Toutes</option>
                        <option value="Polytechnique">Polytechnique</option>
                        <option value="Droit">Droit</option>
                        <option value="Médecine">Médecine</option>
                        <option value="Économie">Économie</option>
                        <option value="Sciences">Sciences</option>
                      </select>
                    </div>
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {officialCourses
                      .filter((c) =>
                        sharedFacultyFilter === 'all' ? true : c.faculty === sharedFacultyFilter
                      )
                      .filter((c) =>
                        sharedSearchQuery
                          ? c.title.toLowerCase().includes(sharedSearchQuery.toLowerCase())
                          : true
                      )
                      .map((course) => {
                        const alreadyDownloaded = localCourses.some((lc) => lc.id === course.id);

                        return (
                          <div
                            key={course.id}
                            className="p-4 rounded-2xl bg-white/5 border border-amber-500/20 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-3 shadow-lg"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    <Crown className="w-4 h-4" />
                                  </span>
                                  <div>
                                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                                      {course.title}
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                        Officiel
                                      </span>
                                    </h4>
                                    <span className="text-[10.5px] text-amber-300/80 font-medium">
                                      {course.faculty}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {course.description && (
                                <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                                  {course.description}
                                </p>
                              )}

                              <div className="flex items-center justify-between text-[11px] text-white/40 pt-1">
                                <span>Certifié {course.uploaderName}</span>
                                <span>📄 {course.totalPages} pages</span>
                              </div>
                            </div>

                            {/* Download Button */}
                            <div className="pt-3 border-t border-white/10 flex justify-end">
                              <button
                                onClick={() => handleDownloadPublicCourse(course)}
                                disabled={alreadyDownloaded}
                                className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition active:scale-95 ${
                                  alreadyDownloaded
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-lg shadow-amber-500/20'
                                }`}
                              >
                                {alreadyDownloaded ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Déjà dans mes cours offline</span>
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Télécharger en 1 clic (Offline)</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* SUB-SECTION 2: LIVRES PUBLICS GRATUITS (INTERNET ARCHIVE & OPEN BOOKS) */}
              {sharedSubSection === 'internet_archive' && (
                <div className="space-y-4">
                  {/* Search Bar & Preset Chips */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        performArchiveSearch(archiveSearchQuery);
                      }}
                      className="flex items-center gap-2"
                    >
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-3 w-4 h-4 text-cyan-400" />
                        <input
                          type="text"
                          value={archiveSearchQuery}
                          onChange={(e) => setArchiveSearchQuery(e.target.value)}
                          placeholder="Rechercher des livres universitaires gratuits (ex: Béton armé, Droit civil, Électronique, Anatomie...)"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500 text-xs text-white placeholder-white/30 focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSearchingArchive}
                        className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
                      >
                        {isSearchingArchive ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Search className="w-3.5 h-3.5" />
                        )}
                        <span>Chercher</span>
                      </button>
                    </form>

                    {/* Fast Search Suggestions */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-white/40">Suggestions rapides :</span>
                      {[
                        'Béton armé',
                        'Résistance des matériaux',
                        'Droit civil',
                        'Mécanique des fluides',
                        'Algèbre linéaire',
                        'Anatomie humaine',
                      ].map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => {
                            setArchiveSearchQuery(term);
                            performArchiveSearch(term);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-white/70 hover:text-cyan-300 border border-white/10 text-[10.5px] font-medium transition"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Books Results */}
                  {isSearchingArchive ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />
                      <p className="text-xs text-white/60">Interrogation de la bibliothèque Internet Archive...</p>
                    </div>
                  ) : archiveBooks.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/10 space-y-2">
                      <p className="text-sm font-semibold text-white/70">Aucun livre trouvé pour cette recherche</p>
                      <p className="text-xs text-white/40">
                        Essayez avec d'autres termes comme "Résistance des matériaux", "Béton armé" ou "Droit civil".
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {archiveBooks.map((book) => {
                        const alreadyDownloaded = localCourses.some(
                          (lc) => lc.id === 'archive_' + book.identifier
                        );

                        return (
                          <div
                            key={book.identifier}
                            className="p-4 rounded-2xl bg-white/5 border border-cyan-500/20 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3 shadow-lg"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                    <BookMarked className="w-4 h-4" />
                                  </span>
                                  <div>
                                    <h4 className="text-sm font-bold text-white line-clamp-1">
                                      {book.title}
                                    </h4>
                                    <p className="text-[10.5px] text-cyan-300 truncate max-w-[200px]">
                                      {book.creator} {book.year ? `(${book.year})` : ''}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {book.description && (
                                <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                                  {book.description}
                                </p>
                              )}

                              <div className="flex items-center justify-between text-[11px] text-white/40 pt-1">
                                <span>⬇ {book.downloads || 0} lectures</span>
                                {book.sizeMb && <span>💾 {book.sizeMb} Mo</span>}
                              </div>
                            </div>

                            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                              <a
                                href={book.detailsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-white/40 hover:text-cyan-300 flex items-center gap-1"
                              >
                                <span>Consulter fiche</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>

                              <button
                                onClick={() => handleDownloadArchiveBook(book)}
                                disabled={alreadyDownloaded}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition active:scale-95 ${
                                  alreadyDownloaded
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                                    : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-md'
                                }`}
                              >
                                {alreadyDownloaded ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Déjà en local</span>
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Télécharger en offline</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SUB-SECTION 3: COURS PARTAGÉS PAR LES ÉTUDIANTS */}
              {sharedSubSection === 'students' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-purple-400" />
                        <span>Partage Direct entre Étudiants</span>
                      </h4>
                      <p className="text-[11px] text-white/60 mt-0.5">
                        Synchronisé instantanément via BroadcastChannel sans inscription ni mot de passe.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowImportChooser(true)}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Partager mes notes</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {studentCourses.map((shared) => {
                      const alreadyDownloaded = localCourses.some((lc) => lc.id === shared.id);

                      return (
                        <div
                          key={shared.id}
                          className="p-4 rounded-2xl bg-white/5 border border-purple-500/20 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-3 shadow-lg"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                  <Users className="w-4 h-4" />
                                </span>
                                <div>
                                  <h4 className="text-sm font-bold text-white">
                                    {shared.title}
                                  </h4>
                                  <span className="text-[10px] text-purple-300 font-medium">
                                    {shared.faculty}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {shared.description && (
                              <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                                {shared.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between text-[11px] text-white/40 pt-1">
                              <span>Par {shared.uploaderName || 'Étudiant DAKIS'}</span>
                              <span>📄 {shared.totalPages} pages</span>
                            </div>
                          </div>

                          {/* Download & Report */}
                          <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/10">
                            <button
                              onClick={() => handleReportCourse(shared.id)}
                              className="text-[11px] text-white/40 hover:text-red-400 flex items-center gap-1 transition"
                              title="Signaler ce cours"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              <span>Signaler</span>
                            </button>

                            <button
                              onClick={() => handleDownloadPublicCourse(shared)}
                              disabled={alreadyDownloaded}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition active:scale-95 ${
                                alreadyDownloaded
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                              }`}
                            >
                              {alreadyDownloaded ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Déjà en local</span>
                                </>
                              ) : (
                                <>
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Télécharger en offline</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: OUTILS D'ÉTUDE (QUIZ, RÉSUMÉ, FORMULES) */}
          {activeTab === 'study_tools' && (
            <div className="space-y-4">
              {/* Course Selector & Tool Switcher */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50">Cours cible :</span>
                  <select
                    value={selectedStudyCourseId}
                    onChange={(e) => handleRunStudyTool(e.target.value, studyToolView)}
                    className="bg-[#18181b] border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs font-semibold focus:outline-none"
                  >
                    {localCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.faculty})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleRunStudyTool(selectedStudyCourseId, 'summary')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      studyToolView === 'summary'
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-white/70'
                    }`}
                  >
                    📄 Résumé 10 Points
                  </button>

                  <button
                    onClick={() => handleRunStudyTool(selectedStudyCourseId, 'quiz')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      studyToolView === 'quiz'
                        ? 'bg-rose-500 text-white shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-white/70'
                    }`}
                  >
                    ❓ Quiz QCM (5 Q)
                  </button>

                  <button
                    onClick={() => handleRunStudyTool(selectedStudyCourseId, 'formulas')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      studyToolView === 'formulas'
                        ? 'bg-cyan-500 text-white shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-white/70'
                    }`}
                  >
                    📐 Formules Clés
                  </button>
                </div>
              </div>

              {/* View 1: 10-Point Summary */}
              {studyToolView === 'summary' && (
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3 shadow-xl">
                  <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Résumé Synthétique en 10 Points (Généré 100% Hors-Ligne)</span>
                  </h3>
                  <div className="space-y-2.5 pt-2">
                    {activeSummary.map((pt, i) => (
                      <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl bg-black/20 border border-white/5">
                        <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-xs text-white/90 leading-relaxed pt-0.5">{pt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View 2: Interactive 5-Question Quiz */}
              {studyToolView === 'quiz' && (
                <div className="space-y-4">
                  {activeQuiz.map((q, qIndex) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 shadow-md"
                    >
                      <h4 className="text-xs sm:text-sm font-bold text-white flex items-start gap-2">
                        <span className="text-rose-400">Q{qIndex + 1}.</span>
                        <span>{q.question}</span>
                      </h4>

                      <div className="space-y-1.5 pt-1">
                        {q.options.map((opt, optIndex) => {
                          const isSelected = quizUserAnswers[q.id] === optIndex;
                          const isCorrect = optIndex === q.correctIndex;
                          const showResult = quizScore !== null;

                          let btnStyle = 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80';
                          if (isSelected) {
                            btnStyle = 'bg-rose-500/20 border-rose-500/50 text-rose-200 font-semibold';
                          }
                          if (showResult) {
                            if (isCorrect) {
                              btnStyle = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold';
                            } else if (isSelected && !isCorrect) {
                              btnStyle = 'bg-red-500/20 border-red-500/50 text-red-300 line-through';
                            }
                          }

                          return (
                            <button
                              key={optIndex}
                              onClick={() => handleQuizAnswer(q.id, optIndex)}
                              className={`w-full text-left p-2.5 rounded-xl border text-xs transition flex items-center justify-between ${btnStyle}`}
                            >
                              <span>{opt}</span>
                              {showResult && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                            </button>
                          );
                        })}
                      </div>

                      {quizScore !== null && (
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11.5px] text-white/70">
                          💡 <span className="font-semibold text-white/90">Explication :</span> {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                    {quizScore === null ? (
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={Object.keys(quizUserAnswers).length < activeQuiz.length}
                        className={`px-4 py-2 rounded-xl font-bold text-xs transition ${
                          Object.keys(quizUserAnswers).length >= activeQuiz.length
                            ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/25 active:scale-95'
                            : 'bg-white/5 text-white/20 cursor-not-allowed'
                        }`}
                      >
                        Valider mes réponses ({Object.keys(quizUserAnswers).length}/{activeQuiz.length})
                      </button>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-white">
                          Score : <span className="text-rose-400">{quizScore} / {activeQuiz.length}</span>
                        </span>
                        <button
                          onClick={() => {
                            setQuizUserAnswers({});
                            setQuizScore(null);
                          }}
                          className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-medium"
                        >
                          Recommencer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* View 3: Formulas */}
              {studyToolView === 'formulas' && (
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3 shadow-xl">
                  <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                    <Sigma className="w-4 h-4" />
                    <span>Formules & Équations Détectées dans ce cours ({activeFormulas.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {activeFormulas.map((f, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
                        <p className="font-mono text-xs text-cyan-300 font-bold">{f.formula}</p>
                        <span className="text-[10px] text-white/40">Page {f.page}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL 1: IMPORT CHOOSER (2 CHOICES: PHONE/PC OR URL) */}
        {showImportChooser && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xl p-4 flex items-center justify-center animate-in fade-in">
            <div className="w-full max-w-sm bg-[#18181b] border border-white/15 rounded-3xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-orange-400" />
                  <span>Ajouter un Cours</span>
                </h3>
                <button
                  onClick={() => setShowImportChooser(false)}
                  className="p-1 rounded-lg text-white/40 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={() => {
                    setShowImportChooser(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full p-4 rounded-2xl bg-white/5 hover:bg-orange-500/15 border border-white/10 hover:border-orange-500/40 text-left flex items-center gap-3 transition group active:scale-98"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-orange-300">
                      Importer PDF de mon téléphone / PC
                    </h4>
                    <p className="text-[10.5px] text-white/50 mt-0.5">
                      Fichier local .PDF (jusqu'à 25 Mo)
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowImportChooser(false);
                    setImportMode('url');
                  }}
                  className="w-full p-4 rounded-2xl bg-white/5 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-500/40 text-left flex items-center gap-3 transition group active:scale-98"
                >
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition">
                    <Link className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-cyan-300">
                      Importer depuis lien URL
                    </h4>
                    <p className="text-[10.5px] text-white/50 mt-0.5">
                      Lien direct .pdf, Archive.org ou web
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden File Input for Phone/PC */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* MODAL 2: IMPORT CONFIG & DETAILS */}
        {importMode && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xl p-4 sm:p-6 flex items-center justify-center animate-in fade-in">
            <div className="w-full max-w-md bg-[#18181b] border border-white/15 rounded-3xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-orange-400" />
                  <span>
                    {importMode === 'file' ? 'Importer PDF Local' : 'Importer depuis URL'}
                  </span>
                </h3>
                <button
                  onClick={() => {
                    setImportMode(null);
                    setUploadFile(null);
                  }}
                  className="p-1 rounded-lg text-white/40 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {importMode === 'url' && (
                  <div>
                    <label className="block text-white/60 mb-1 font-medium">Lien URL du PDF :</label>
                    <input
                      type="url"
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      placeholder="https://.../cours.pdf"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-500 font-mono text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-white/60 mb-1 font-medium">Titre du cours :</label>
                  <input
                    type="text"
                    value={courseTitleInput}
                    onChange={(e) => setCourseTitleInput(e.target.value)}
                    placeholder="Ex: Résistance des matériaux - Chapitre 2"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-white/60 mb-1 font-medium">Faculté :</label>
                  <select
                    value={facultyInput}
                    onChange={(e) => setFacultyInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#121214] border border-white/10 text-white focus:outline-none"
                  >
                    <option value="Polytechnique">Polytechnique</option>
                    <option value="Droit">Droit</option>
                    <option value="Médecine">Médecine</option>
                    <option value="Économie">Économie</option>
                    <option value="Sciences">Sciences</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">Partager avec les autres étudiants</p>
                    <p className="text-[10px] text-white/40">Visible dans la Bibliothèque Commune</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={shareWithStudents}
                    onChange={(e) => setShareWithStudents(e.target.checked)}
                    className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                  />
                </div>

                {shareWithStudents && (
                  <div>
                    <label className="block text-white/60 mb-1 font-medium">Description (optionnelle) :</label>
                    <input
                      type="text"
                      value={courseDescription}
                      onChange={(e) => setCourseDescription(e.target.value)}
                      placeholder="Ex: Résumé pour l'examen de session 1"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setImportMode(null);
                    setUploadFile(null);
                  }}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-xs font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveImport}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs shadow-lg shadow-orange-500/25 active:scale-95 transition"
                >
                  Indexer et Sauvegarder en Offline
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
