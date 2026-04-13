import { BaseRepository } from './base.repository';
import { TransportVehicle } from '../../types';

class VehicleRepository extends BaseRepository<TransportVehicle> {
  protected collectionName = 'vehicles';
}

export const vehicleRepository = new VehicleRepository();
