import { ATIR } from '../ATIR';
import { EmbroideryPoint } from '../../../modules/tailleur/services/embroideryServices';
import { MachineBackend } from './MachineBackend';

export class PESBackend implements MachineBackend {
  name = 'Brother PES';
  extension = 'pes';
  
  /**
   * Translates ATIR stitches into Brother .PES format (V6).
   * PES is a complex format containing PEC (stitch data) and CEQ (object data).
   * This is a simplified PEC-only generator for testing.
   */
  generate(ir: ATIR): Uint8Array {
    const stitches = ir.metadata.travelMetrics?.finalStitches || PESBackend.flattenStitches(ir);
    
    // PES Header (usually 22 bytes + PEC pointer)
    const header = PESBackend.generateHeader();
    
    // PEC Data (Stitches)
    const pec = PESBackend.generatePEC(stitches);
    
    // Write PEC offset into Header (bytes 8-11, little endian)
    const pecOffset = header.length;
    header[8] = pecOffset & 0xFF;
    header[9] = (pecOffset >> 8) & 0xFF;
    header[10] = (pecOffset >> 16) & 0xFF;
    header[11] = (pecOffset >> 24) & 0xFF;

    const result = new Uint8Array(header.length + pec.length);
    result.set(header, 0);
    result.set(pec, header.length);
    
    return result;
  }
  
  static generate(ir: ATIR): Uint8Array {
    return new PESBackend().generate(ir);
  }

  private static flattenStitches(ir: ATIR): EmbroideryPoint[] {
    const all: EmbroideryPoint[] = [];
    ir.contours.forEach(contour => all.push(...contour));
    return all;
  }

  private static generateHeader(): Uint8Array {
    const header = new Uint8Array(22);
    // #PES0060
    header.set([0x23, 0x50, 0x45, 0x53, 0x30, 0x30, 0x36, 0x30], 0);
    // bytes 8-11 will be PEC offset
    return header;
  }

  private static generatePEC(stitches: EmbroideryPoint[]): Uint8Array {
    // Simplified PEC generation
    // Real PEC has a large color palette header and image data
    // We will generate a minimal valid PEC block
    
    const maxStitches = stitches.length;
    // Estimate buffer size: 512 header + (stitches * 2) bytes
    const buffer = new Uint8Array(512 + maxStitches * 2 + 10);
    let offset = 0;
    
    // 'LA:' header identifier for PEC
    buffer.set([0x4C, 0x41, 0x3A], offset);
    offset += 16; // Skip name
    
    // Skip palette and image data for simplicity in this stub
    offset = 512; 
    
    let lastX = 0;
    let lastY = 0;
    
    for (const point of stitches) {
      let dx = Math.round((point.x - lastX) * 10);
      let dy = Math.round((point.y - lastY) * 10);
      
      // PES uses 12-bit signed integers for jumps, 7-bit for normal stitches
      if (Math.abs(dx) > 63 || Math.abs(dy) > 63 || point.type === 2) {
        // Long jump or trim
        dx = Math.max(-2048, Math.min(2047, dx));
        dy = Math.max(-2048, Math.min(2047, dy));
        
        // 0x90 means jump, followed by 12-bit x and 12-bit y
        const valX = dx & 0x0FFF;
        const valY = dy & 0x0FFF;
        
        buffer[offset++] = 0x90 | ((valX >> 8) & 0x0F);
        buffer[offset++] = valX & 0xFF;
        buffer[offset++] = 0x90 | ((valY >> 8) & 0x0F);
        buffer[offset++] = valY & 0xFF;
      } else {
        // Normal stitch (7-bit signed)
        buffer[offset++] = dx & 0x7F;
        buffer[offset++] = dy & 0x7F;
      }
      
      lastX = point.x;
      lastY = point.y;
    }
    
    // End sequence
    buffer[offset++] = 0xFF;
    
    return buffer.slice(0, offset);
  }
}