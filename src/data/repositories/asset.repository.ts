import { BaseRepository } from './base.repository';
import { Asset } from '../../types';

export class AssetRepository extends BaseRepository<Asset> {
  protected collectionName = 'assets';
}

export const assetRepository = new AssetRepository();
