import { EmbroideryPoint } from '@/src/modules/tailleur/services/embroideryServices';
import { Region } from '../topology/TopologyGraph';
import { TatamiConfig } from './types';

export class UnderlayBuilder {
    public static build(region: Region, config: TatamiConfig): EmbroideryPoint[][] {
        const underlay: EmbroideryPoint[][] = [];
        if (config.underlay === 'edge') {
            underlay.push(region.polygon); // edge walk
        }
        return underlay;
    }
}
