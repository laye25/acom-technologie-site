import { ATIR } from '../ATIR';

export interface MachineBackend {
  name: string;
  extension: string;
  generate(ir: ATIR): Uint8Array;
}
