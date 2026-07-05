import { useState, useEffect, useCallback } from 'react';
import { db } from '../../../db/db';
import { dbService } from '../../../services/dbService';
import { BtpProject, Task, ConstructionLog, BudgetItem } from '../types';

export function useBtpSaaS(merchantId: string) {
  const [projects, setProjects] = useState<BtpProject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    if (!merchantId) return;
    setLoading(true);
    try {
      const localProjects = await db.table('projects')
        .where('merchantId')
        .equals(merchantId)
        .reverse()
        .sortBy('updatedAt');
      setProjects(localProjects as BtpProject[]);
      setError(null);
    } catch (err: any) {
      console.error('[useBtpSaaS] Error loading local projects:', err);
      setError('Erreur lors du chargement des projets BTP.');
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const saveProject = useCallback(async (project: Partial<BtpProject>) => {
    if (!merchantId) throw new Error('Merchant ID is required');
    const projectToSave = {
      ...project,
      merchantId,
      updatedAt: new Date()
    };
    try {
      const savedId = await dbService.projects.save(projectToSave as any);
      await loadProjects();
      return savedId;
    } catch (err) {
      console.error('[useBtpSaaS] Error saving project:', err);
      throw err;
    }
  }, [merchantId, loadProjects]);

  const deleteProject = useCallback(async (id: string) => {
    try {
      await dbService.projects.delete(id);
      await loadProjects();
    } catch (err) {
      console.error('[useBtpSaaS] Error deleting project:', err);
      throw err;
    }
  }, [loadProjects]);

  return {
    projects,
    loading,
    error,
    saveProject,
    deleteProject,
    refresh: loadProjects
  };
}
