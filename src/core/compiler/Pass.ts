import { ATIR } from './ATIR';

export interface CompilerPass {
  name: string;
  execute(ir: ATIR, params?: any): ATIR;
}
