import { BaseRepository } from './base.repository';
import { ConstructionProject } from '../../types';

class ProjectRepository extends BaseRepository<ConstructionProject> {
  protected collectionName = 'projects';
}

export const projectRepository = new ProjectRepository();
