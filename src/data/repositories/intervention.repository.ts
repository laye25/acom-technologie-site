import { BaseRepository } from './base.repository';
import { ServiceIntervention } from '../../types';

class InterventionRepository extends BaseRepository<ServiceIntervention> {
  protected collectionName = 'interventions';
}

export const interventionRepository = new InterventionRepository();
