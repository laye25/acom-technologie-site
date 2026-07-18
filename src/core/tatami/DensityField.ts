import { Region } from '../topology/TopologyGraph';

export class DensityField {
    public static compute(region: Region, baseDensity: number): number {
        // Can adjust density based on region properties.
        return baseDensity;
    }
}
