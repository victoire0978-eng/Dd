/* eslint-disable @typescript-eslint/no-explicit-any */
import { LocalCourse, CourseChunk } from '../types';
import { v4 as uuidv4 } from 'uuid';
import Dexie from 'dexie';

class DdDatabase extends Dexie {
  courses: Dexie.Table<LocalCourse, string>;
  chunks: Dexie.Table<CourseChunk, string>;

  constructor() {
    super('DdCoursesDB');
    this.version(1).stores({
      courses: 'id,title,faculty,createdAt',
      chunks: 'id,courseId,pageNumber,chunkIndex',
    });
    this.courses = this.table('courses');
    this.chunks = this.table('chunks');
  }
}

const db = new DdDatabase();

export async function saveCourseWithChunks(course: LocalCourse, chunks: CourseChunk[]) {
  await db.courses.put(course);
  if (chunks && chunks.length > 0) {
    await db.chunks.bulkPut(chunks as any);
  }
}

export async function getAllLocalCourses(): Promise<LocalCourse[]> {
  return await db.courses.toArray();
}

export async function deleteLocalCourse(courseId: string) {
  await db.chunks.where('courseId').equals(courseId).delete();
  await db.courses.delete(courseId);
}

export async function getCourseChunks(courseId: string): Promise<CourseChunk[]> {
  return await db.chunks.where('courseId').equals(courseId).toArray();
}

export async function getAllChunks(): Promise<CourseChunk[]> {
  return await db.chunks.toArray();
}

export async function saveChunkEmbedding(chunkId: string, embedding: number[] | null): Promise<void> {
  const existing = await db.chunks.get(chunkId);
  if (existing) {
    existing.embedding = embedding;
    await db.chunks.put(existing as any);
  }
}

export async function getCourseById(courseId: string): Promise<LocalCourse | undefined> {
  return await db.courses.get(courseId);
}

export async function addPlaceholderCourse(course: Partial<LocalCourse> & { id?: string }) {
  const id = course.id || 'course_' + Date.now() + '_' + uuidv4().slice(0, 6);
  const entry: LocalCourse = {
    id,
    title: course.title || 'Cours importé',
    faculty: course.faculty || 'Général',
    totalPages: course.totalPages || 0,
    fileSize: course.fileSize || 0,
    createdAt: course.createdAt || Date.now(),
    summary: course.summary || [],
    formulas: course.formulas || [],
    isOfficial: !!course.isOfficial,
    sharedOnline: !!course.sharedOnline,
  };
  await db.courses.put(entry);
  return entry;
}
