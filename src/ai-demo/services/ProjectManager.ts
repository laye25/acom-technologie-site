// src/ai-demo/services/ProjectManager.ts
/**
 * ProjectManager - Course & Curriculum Training Project Manager
 * Groups multiple SAI scenarios into structured educational courses/curricula
 * (e.g., Introduction -> Chapter 1: Reception -> Chapter 2: Acompte -> Conclusion).
 */

import { ScenarioApplicationIntelligent } from '../types/sai';

export interface CourseChapter {
  id: string;
  chapterNumber: number;
  title: string;
  description: string;
  scenarioId?: string;
  scenarioTitle?: string;
  estimatedDurationMin: number;
  completed: boolean;
}

export interface DemoCourseProject {
  id: string;
  title: string;
  description: string;
  domainId: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  chapters: CourseChapter[];
  targetAudience: string;
  status: 'draft' | 'in_review' | 'published';
  totalDurationMin: number;
}

export class ProjectManager {
  private static projects: Map<string, DemoCourseProject> = new Map();

  public static createCourse(params: {
    title: string;
    description: string;
    domainId: string;
    author: string;
    targetAudience: string;
    scenarios?: ScenarioApplicationIntelligent[];
  }): DemoCourseProject {
    const id = `course-${Date.now()}`;
    const chapters: CourseChapter[] = (params.scenarios || []).map((sc, idx) => ({
      id: `chap-${idx + 1}`,
      chapterNumber: idx + 1,
      title: sc.metadata.title || `Chapitre ${idx + 1}`,
      description: sc.metadata.description || '',
      scenarioId: sc.id,
      scenarioTitle: sc.metadata.title,
      estimatedDurationMin: Math.max(1, Math.round((sc.timeline || []).reduce((a, b) => a + (b.durationSec || 0), 0) / 60)),
      completed: false
    }));

    if (chapters.length === 0) {
      chapters.push({
        id: 'chap-1',
        chapterNumber: 1,
        title: 'Introduction & Prise en Main',
        description: 'Découverte de l\'interface et des premiers paramètres.',
        estimatedDurationMin: 5,
        completed: false
      });
    }

    const totalDurationMin = chapters.reduce((a, c) => a + c.estimatedDurationMin, 0);

    const project: DemoCourseProject = {
      id,
      title: params.title,
      description: params.description,
      domainId: params.domainId,
      author: params.author,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chapters,
      targetAudience: params.targetAudience,
      status: 'draft',
      totalDurationMin
    };

    this.projects.set(id, project);
    return project;
  }

  public static getProject(id: string): DemoCourseProject | undefined {
    return this.projects.get(id);
  }

  public static getAllProjects(): DemoCourseProject[] {
    return Array.from(this.projects.values());
  }

  public static addChapterToCourse(courseId: string, chapter: Omit<CourseChapter, 'id' | 'chapterNumber' | 'completed'>): DemoCourseProject | undefined {
    const proj = this.projects.get(courseId);
    if (!proj) return undefined;

    const chapterNumber = proj.chapters.length + 1;
    const newChap: CourseChapter = {
      ...chapter,
      id: `chap-${chapterNumber}`,
      chapterNumber,
      completed: false
    };

    proj.chapters.push(newChap);
    proj.totalDurationMin = proj.chapters.reduce((a, c) => a + c.estimatedDurationMin, 0);
    proj.updatedAt = new Date().toISOString();

    return proj;
  }
}
