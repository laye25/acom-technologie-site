import { BaseRepository } from './base.repository';
import { Template } from '../../types';

export class TemplateRepository extends BaseRepository<Template> {
  protected collectionName = 'templates';
}

export const templateRepository = new TemplateRepository();
