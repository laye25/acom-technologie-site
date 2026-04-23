import { BaseRepository } from './base.repository';
import { PartnerRating } from '../../types';

class PartnerRatingRepository extends BaseRepository<PartnerRating> {
  protected collectionName = 'partner_ratings';
}

export const partnerRatingRepository = new PartnerRatingRepository();
