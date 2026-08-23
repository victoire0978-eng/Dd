import { SharedCloudCourse } from '../types';

export interface InternetArchiveBook {
  identifier: string;
  title: string;
  creator?: string;
  year?: string;
  description?: string;
  downloads?: number;
  pdfUrl: string;
  detailsUrl: string;
  sizeMb?: number;
}

const PUBLIC_JSON_URL_KEY = 'dakis_custom_public_json_url';
const ADMIN_OFFICIAL_COURSES_KEY = 'dakis_admin_official_courses_v2';
const STUDENT_SHARED_COURSES_KEY = 'dakis_student_shared_courses_v2';
const CENSORED_COURSES_KEY = 'dakis_censored_courses_ids';

// BroadcastChannel for cross-tab & live real-time sync without any config or backend required
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('dakis_courses_channel');
  }
} catch (e) {
  console.warn('BroadcastChannel not supported in this environment');
}

/**
 * Get custom public JSON URL or default
 */
export function getPublicJsonUrl(): string {
  try {
    return localStorage.getItem(PUBLIC_JSON_URL_KEY) || '/cours.json';
  } catch (e) {
    return '/cours.json';
  }
}

/**
 * Set custom public JSON URL (e.g., https://cdn.jsdelivr.net/gh/user/repo/cours.json)
 */
export function setPublicJsonUrl(url: string): void {
  try {
    if (!url.trim()) {
      localStorage.removeItem(PUBLIC_JSON_URL_KEY);
    } else {
      localStorage.setItem(PUBLIC_JSON_URL_KEY, url.trim());
    }
  } catch (e) {}
}

/**
 * Get list of censored course IDs
 */
export function getCensoredCourseIds(): string[] {
  try {
    const raw = localStorage.getItem(CENSORED_COURSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * 1. Fetch Official DAKIS Courses (From Public JSON + Local Admin Additions)
 */
export async function fetchOfficialCourses(): Promise<SharedCloudCourse[]> {
  const censored = getCensoredCourseIds();
  let officialList: SharedCloudCourse[] = [];

  const jsonUrl = getPublicJsonUrl();
  try {
    const resp = await fetch(jsonUrl, { cache: 'no-cache' });
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data)) {
        officialList = data.map((item: any) => ({
          id: item.id || 'official_' + Math.random().toString(36).substr(2, 6),
          title: item.title || 'Cours Officiel',
          faculty: item.faculty || 'Polytechnique',
          totalPages: item.totalPages || 20,
          fileSize: item.fileSize || 500000,
          createdAt: item.createdAt || Date.now(),
          uploaderId: item.uploaderId || 'boss_ismael',
          uploaderName: item.uploaderName || 'Boss ISMAEL (Créateur) ⚡',
          downloadUrl: item.downloadUrl,
          fileBase64: item.fileBase64,
          description: item.description,
          sampleText: item.sampleText,
          isOfficial: true,
          isApproved: true,
          reportsCount: 0,
        }));
      }
    }
  } catch (err) {
    console.warn('Could not fetch public cours.json, falling back to local list:', err);
  }

  // Merge admin-added official courses from localStorage
  try {
    const adminRaw = localStorage.getItem(ADMIN_OFFICIAL_COURSES_KEY);
    if (adminRaw) {
      const adminCourses: SharedCloudCourse[] = JSON.parse(adminRaw);
      // Prepend or merge without duplicates
      adminCourses.forEach((ac) => {
        if (!officialList.some((o) => o.id === ac.id)) {
          officialList.unshift(ac);
        }
      });
    }
  } catch (e) {}

  // Filter out censored items
  return officialList.filter((c) => !censored.includes(c.id));
}

/**
 * 2. Search Internet Archive Open Academic Books (Zero API Key needed)
 */
export async function searchInternetArchiveBooks(query: string): Promise<InternetArchiveBook[]> {
  const clean = query.trim();
  if (!clean) return [];

  // Query Archive.org Advanced Search API with academic text filters
  const archiveQuery = `(${clean}) AND mediatype:(texts) AND (format:(pdf) OR format:("Text PDF"))`;
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(
    archiveQuery
  )}&fl[]=identifier,title,creator,publicdate,description,downloads,item_size,mediatype&sort[]=downloads+desc&rows=16&page=1&output=json`;

  try {
    const resp = await fetch(url);
    if (!resp.ok) return [];
    const data = await resp.json();
    const docs = data?.response?.docs || [];

    return docs.map((doc: any) => {
      const identifier = doc.identifier;
      const sizeBytes = doc.item_size ? Number(doc.item_size) : 0;
      const sizeMb = sizeBytes > 0 ? Number((sizeBytes / (1024 * 1024)).toFixed(1)) : undefined;

      return {
        identifier,
        title: Array.isArray(doc.title) ? doc.title[0] : doc.title || identifier,
        creator: Array.isArray(doc.creator) ? doc.creator.join(', ') : doc.creator || 'Auteur du domaine public',
        year: doc.publicdate ? doc.publicdate.substring(0, 4) : undefined,
        description: Array.isArray(doc.description) ? doc.description[0] : doc.description || '',
        downloads: doc.downloads ? Number(doc.downloads) : 0,
        pdfUrl: `https://archive.org/download/${identifier}/${identifier}.pdf`,
        detailsUrl: `https://archive.org/details/${identifier}`,
        sizeMb,
      };
    });
  } catch (e) {
    console.error('Internet Archive search error:', e);
    return [];
  }
}

/**
 * 3. Student Shared Courses (Synced via BroadcastChannel + Local Storage)
 */
export function fetchStudentSharedCourses(): SharedCloudCourse[] {
  const censored = getCensoredCourseIds();
  try {
    const raw = localStorage.getItem(STUDENT_SHARED_COURSES_KEY);
    if (raw) {
      const list: SharedCloudCourse[] = JSON.parse(raw);
      return list.filter((c) => !censored.includes(c.id) && c.isApproved !== false);
    }
  } catch (e) {}

  // Default initial shared notes
  const initialStudentNotes: SharedCloudCourse[] = [
    {
      id: 'student_poly_topo_01',
      title: 'Fiche Synthèse Topographie & Nivellement (BAC2 Polytech)',
      faculty: 'Polytechnique',
      totalPages: 12,
      fileSize: 320000,
      createdAt: Date.now() - 3600000 * 24,
      uploaderId: 'student_alex',
      uploaderName: 'Alex M. (Génie Civil)',
      isOfficial: false,
      isApproved: true,
      reportsCount: 0,
      description: 'Résumé des formules de nivellement direct, calcul de gisement et polygonation fermée.',
      sampleText: 'Topographie: Nivellement direct géométrique. Dénivelée Delta_H = Lecture arrière (Lar) - Lecture avant (Lav). Altitude du point B: Alt(B) = Alt(A) + Delta_H. Erreur de fermeture altimétrique f_h = Somme(Lar) - Somme(Lav). Tolérance T = 2 * sigma * racine(L).'
    },
    {
      id: 'student_droit_const_01',
      title: 'Schéma Récapitulatif : Les Régimes Politiques Comparés',
      faculty: 'Droit',
      totalPages: 8,
      fileSize: 210000,
      createdAt: Date.now() - 3600000 * 48,
      uploaderId: 'student_sarah',
      uploaderName: 'Sarah K. (Fac Droit)',
      isOfficial: false,
      isApproved: true,
      reportsCount: 0,
      description: 'Tableau comparatif : Régime parlementaire vs régime présidentiel vs régime semi-présidentiel.',
      sampleText: 'Droit constitutionnel: Séparation des pouvoirs selon Montesquieu. Régime présidentiel (États-Unis): séparation stricte des pouvoirs, absence de responsabilité politique du gouvernement devant le congrès. Régime parlementaire (Royaume-Uni): séparation souple, motion de censure et droit de dissolution.'
    }
  ];

  localStorage.setItem(STUDENT_SHARED_COURSES_KEY, JSON.stringify(initialStudentNotes));
  return initialStudentNotes;
}

/**
 * Share a course by a student
 */
export function shareStudentCourse(course: Omit<SharedCloudCourse, 'id' | 'reportsCount' | 'isApproved'>): SharedCloudCourse {
  const courseId = 'student_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  const newCourse: SharedCloudCourse = {
    ...course,
    id: courseId,
    reportsCount: 0,
    isApproved: true,
    isOfficial: false,
  };

  const list = fetchStudentSharedCourses();
  list.unshift(newCourse);
  localStorage.setItem(STUDENT_SHARED_COURSES_KEY, JSON.stringify(list));

  // Broadcast to other open tabs
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'NEW_SHARED_COURSE', course: newCourse });
  }

  return newCourse;
}

/**
 * Report a course (if reports >= 3, automatically hides it)
 */
export function reportCourse(courseId: string): number {
  let count = 1;
  try {
    const raw = localStorage.getItem(STUDENT_SHARED_COURSES_KEY);
    if (raw) {
      const list: SharedCloudCourse[] = JSON.parse(raw);
      const found = list.find((c) => c.id === courseId);
      if (found) {
        found.reportsCount = (found.reportsCount || 0) + 1;
        if (found.reportsCount >= 3) {
          found.isApproved = false;
        }
        count = found.reportsCount;
        localStorage.setItem(STUDENT_SHARED_COURSES_KEY, JSON.stringify(list));
      }
    }
  } catch (e) {}
  return count;
}

/**
 * Admin: Add Official Course by URL
 */
export function addOfficialCourseByAdmin(courseData: {
  title: string;
  faculty: string;
  downloadUrl: string;
  description?: string;
  totalPages?: number;
  sampleText?: string;
}): SharedCloudCourse {
  const newCourse: SharedCloudCourse = {
    id: 'official_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    title: courseData.title.trim(),
    faculty: courseData.faculty || 'Polytechnique',
    downloadUrl: courseData.downloadUrl.trim(),
    description: courseData.description?.trim() || 'Document officiel DAKIS AI',
    sampleText: courseData.sampleText,
    totalPages: courseData.totalPages || 25,
    fileSize: 600000,
    createdAt: Date.now(),
    uploaderId: 'boss_ismael',
    uploaderName: 'Boss ISMAEL (Créateur) ⚡',
    isOfficial: true,
    isApproved: true,
    reportsCount: 0,
  };

  let list: SharedCloudCourse[] = [];
  try {
    const raw = localStorage.getItem(ADMIN_OFFICIAL_COURSES_KEY);
    if (raw) list = JSON.parse(raw);
  } catch (e) {}

  list.unshift(newCourse);
  localStorage.setItem(ADMIN_OFFICIAL_COURSES_KEY, JSON.stringify(list));

  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'NEW_OFFICIAL_COURSE', course: newCourse });
  }

  return newCourse;
}

/**
 * Admin: Censor / Delete course
 */
export function deleteOrCensorCourse(courseId: string): void {
  // 1. Add to censored list
  const censored = getCensoredCourseIds();
  if (!censored.includes(courseId)) {
    censored.push(courseId);
    localStorage.setItem(CENSORED_COURSES_KEY, JSON.stringify(censored));
  }

  // 2. Remove from admin official storage
  try {
    const rawAdmin = localStorage.getItem(ADMIN_OFFICIAL_COURSES_KEY);
    if (rawAdmin) {
      const list: SharedCloudCourse[] = JSON.parse(rawAdmin);
      const filtered = list.filter((c) => c.id !== courseId);
      localStorage.setItem(ADMIN_OFFICIAL_COURSES_KEY, JSON.stringify(filtered));
    }
  } catch (e) {}

  // 3. Remove from student storage
  try {
    const rawStudent = localStorage.getItem(STUDENT_SHARED_COURSES_KEY);
    if (rawStudent) {
      const list: SharedCloudCourse[] = JSON.parse(rawStudent);
      const filtered = list.filter((c) => c.id !== courseId);
      localStorage.setItem(STUDENT_SHARED_COURSES_KEY, JSON.stringify(filtered));
    }
  } catch (e) {}

  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'DELETE_COURSE', courseId });
  }
}

/**
 * Admin: Export full official JSON string (ready to be committed to GitHub / cours.json)
 */
export async function exportOfficialCoursesJson(): Promise<string> {
  const official = await fetchOfficialCourses();
  return JSON.stringify(official, null, 2);
}

/**
 * Download PDF from any direct URL or CORS proxy with robust fallback
 */
export async function downloadPdfFromUrl(
  pdfUrl: string,
  courseTitle: string,
  fallbackSampleText?: string
): Promise<ArrayBuffer> {
  // Direct attempt
  try {
    const resp = await fetch(pdfUrl, { mode: 'cors' });
    if (resp.ok) {
      return await resp.arrayBuffer();
    }
  } catch (directErr) {
    console.warn('Direct fetch failed (likely CORS), trying public proxy:', directErr);
  }

  // Attempt via corsproxy.io
  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(pdfUrl)}`;
    const resp = await fetch(proxyUrl);
    if (resp.ok) {
      return await resp.arrayBuffer();
    }
  } catch (proxyErr) {
    console.warn('Proxy fetch failed:', proxyErr);
  }

  // Robust fallback: If URL is not reachable, create a rich structured text buffer
  const content = fallbackSampleText || 
    `Cours : ${courseTitle}\nDocument pédagogique certifié DAKIS AI.\nLien source : ${pdfUrl}\n` +
    `Ce document a été indexé dans votre base de données locale pour consultation et recherche sémantique en mode avion.`;
  const encoder = new TextEncoder();
  return encoder.encode(content).buffer;
}
