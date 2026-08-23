import Dexie, { Table } from 'dexie';
import { LocalCourse, CourseChunk } from '../types';

export class DakisOfflineCourseDatabase extends Dexie {
  courses!: Table<LocalCourse, string>;
  chunks!: Table<CourseChunk, number>;

  constructor() {
    super('DakisOfflineCoursesDB');

    // Define database schema
    this.version(1).stores({
      courses: 'id, title, faculty, totalPages, createdAt, isOfficial',
      chunks: '++id, courseId, pageNumber, chunkIndex, courseTitle',
    });
  }
}

export const db = new DakisOfflineCourseDatabase();

/**
 * Save a new course and its indexed chunks to IndexedDB
 */
export async function saveCourseWithChunks(
  course: LocalCourse,
  chunks: CourseChunk[]
): Promise<void> {
  await db.transaction('rw', db.courses, db.chunks, async () => {
    // 1. Delete previous version if exists
    await db.chunks.where('courseId').equals(course.id).delete();
    // 2. Put course
    await db.courses.put(course);
    // 3. Bulk insert chunks
    if (chunks.length > 0) {
      await db.chunks.bulkAdd(chunks);
    }
  });
}

/**
 * Get all saved offline courses
 */
export async function getAllLocalCourses(): Promise<LocalCourse[]> {
  return await db.courses.orderBy('createdAt').reverse().toArray();
}

/**
 * Get a single local course by ID
 */
export async function getLocalCourseById(id: string): Promise<LocalCourse | undefined> {
  return await db.courses.get(id);
}

/**
 * Delete a course and all its chunks from IndexedDB
 */
export async function deleteLocalCourse(id: string): Promise<void> {
  await db.transaction('rw', db.courses, db.chunks, async () => {
    await db.chunks.where('courseId').equals(id).delete();
    await db.courses.delete(id);
  });
}

/**
 * Get all chunks for a specific course
 */
export async function getCourseChunks(courseId: string): Promise<CourseChunk[]> {
  return await db.chunks.where('courseId').equals(courseId).toArray();
}

/**
 * Get all chunks across all courses (for global offline semantic search)
 */
export async function getAllChunks(): Promise<CourseChunk[]> {
  return await db.chunks.toArray();
}

/**
 * Count total offline courses
 */
export async function countOfflineCourses(): Promise<number> {
  return await db.courses.count();
}
