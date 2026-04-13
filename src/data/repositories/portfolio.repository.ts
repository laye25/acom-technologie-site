import { BaseRepository } from './base.repository';
import { PortfolioItem } from '../../types';

class PortfolioRepository extends BaseRepository<PortfolioItem> {
  protected collectionName = 'portfolio';
}

export const portfolioRepository = new PortfolioRepository();
