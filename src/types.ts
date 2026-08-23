export interface CreatorProfile {
  nom: string;
  infos: string;
}

export interface GirlfriendProfile {
  nom: string;
  infos: string;
}

export interface DakisMemory {
  // SHA-256 hashed passwords
  magic_word_hash: string;
  queen_password_hash: string;
  boss_password_hash: string;

  // Optional legacy fields for automatic migration
  magic_word?: string;
  queen_password?: string;
  boss_password?: string;

  creator: CreatorProfile;
  girlfriend: GirlfriendProfile;
  personnes_autorisees: string[];
  personnes_connues: Record<string, string>;
  unlocked_users: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  isUnlockedSecret?: boolean;
  isLockedNotice?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// 📚 OFFLINE COURSES & CHUNKS TYPES
export interface CourseChunk {
  id?: number;
  courseId: string;
  courseTitle: string;
  pageNumber: number;
  chunkIndex: number;
  text: string;
  embedding?: number[]; // Local vector representation for cosine similarity
}

export interface LocalCourse {
  id: string;
  title: string;
  faculty: string;
  totalPages: number;
  fileSize: number; // in bytes
  createdAt: number;
  pdfData?: ArrayBuffer | string; // Stored offline in IndexedDB
  summary?: string[];
  formulas?: string[];
  isOfficial?: boolean;
  sharedOnline?: boolean;
}

export interface SharedCloudCourse {
  id: string;
  title: string;
  faculty: string;
  totalPages: number;
  fileSize: number;
  createdAt: number;
  uploaderId: string;
  uploaderName?: string;
  downloadUrl?: string;
  fileBase64?: string;
  reportsCount: number;
  isApproved: boolean;
  isOfficial: boolean;
  description?: string;
  sampleText?: string;
}

export interface SearchResultMatch {
  courseId: string;
  courseTitle: string;
  pageNumber: number;
  text: string;
  score: number; // 0 to 1 (Cosine similarity or matching confidence)
  highlight?: string;
  calculationDetail?: string;
  calculatedValue?: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sourcePage?: number;
}
