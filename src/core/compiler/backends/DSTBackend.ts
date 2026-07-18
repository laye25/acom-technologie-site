import { ATIR } from '../ATIR';
import { EmbroideryPoint } from '../../../modules/tailleur/services/embroideryServices';
import { MachineBackend } from './MachineBackend';

export class DSTBackend implements MachineBackend {
  name = 'Tajima DST';
  extension = 'dst';
  
  /**
   * Translates the final ATIR stitches into the Tajima .DST binary format.
   * Tajima DST uses a 3-byte ternary encoding system per stitch.
   * X and Y movements are mapped to specific bits across the 3 bytes.
   */
  generate(ir: ATIR): Uint8Array {
    const stitches = ir.metadata.travelMetrics?.finalStitches || DSTBackend.flattenStitches(ir);
    
    // Header is always 512 bytes in Tajima DST
    const header = DSTBackend.generateHeader(ir, stitches.length);
    
    // Body contains the ternary encoded stitches
    const body = DSTBackend.generateBody(stitches);
    
    // Combine header and body
    const result = new Uint8Array(header.length + body.length);
    result.set(header, 0);
    result.set(body, header.length);
    
    return result;
  }
  
  static generate(ir: ATIR): Uint8Array {
    return new DSTBackend().generate(ir);
  }

  private static flattenStitches(ir: ATIR): EmbroideryPoint[] {
    const all: EmbroideryPoint[] = [];
    ir.contours.forEach(contour => all.push(...contour));
    return all;
  }

  private static generateHeader(ir: ATIR, stitchCount: number): Uint8Array {
    const header = new Uint8Array(512);
    // Standard DST Header fields (LA, ST, CO, etc.)
    // Fill with spaces first (ASCII 32)
    header.fill(32);
    
    const writeString = (str: string, offset: number) => {
      for (let i = 0; i < str.length && offset + i < 512; i++) {
        header[offset + i] = str.charCodeAt(i);
      }
    };
    
    // Label (Name)
    writeString('LA:ATCP_V1\r', 0);
    // Stitch count
    const stStr = stitchCount.toString().padStart(7, ' ');
    writeString(`ST:${stStr}\r`, 16);
    // Color changes
    writeString('CO:  0\r', 32); 
    // +X Extent
    writeString('+X:   0\r', 39);
    // -X Extent
    writeString('-X:   0\r', 47);
    // +Y Extent
    writeString('+Y:   0\r', 55);
    // -Y Extent
    writeString('-Y:   0\r', 63);
    
    // Terminate header with Ctrl+Z (ASCII 26)
    header[511] = 26;
    
    return header;
  }

  private static generateBody(stitches: EmbroideryPoint[]): Uint8Array {
    const buffer = new Uint8Array(stitches.length * 3 + 3); // 3 bytes per stitch + end sequence
    let offset = 0;
    
    let lastX = 0;
    let lastY = 0;
    
    for (const point of stitches) {
      // 1 unit in JS = 0.1mm in DST (standard)
      // We assume standard scaling is already applied by Travel Optimizer
      let dx = Math.round((point.x - lastX) * 10);
      let dy = Math.round((point.y - lastY) * 10);
      
      // Clamp to max DST jump (+121/-121)
      dx = Math.max(-121, Math.min(121, dx));
      dy = Math.max(-121, Math.min(121, dy));
      
      const [b1, b2, b3] = this.encodeStitch(dx, dy, point.type);
      buffer[offset++] = b1;
      buffer[offset++] = b2;
      buffer[offset++] = b3;
      
      lastX = point.x;
      lastY = point.y;
    }
    
    // End sequence: 0x00 0x00 0xF3
    buffer[offset++] = 0x00;
    buffer[offset++] = 0x00;
    buffer[offset++] = 0xF3;
    
    return buffer.slice(0, offset);
  }

  private static encodeStitch(dx: number, dy: number, type: number): [number, number, number] {
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    
    // Trims/Jumps/Color Changes
    if (type === 2) { // TRIM or JUMP
      b3 |= 0b10000011; // Jump bit
    }

    // Y Encoding (note: DST Y is inverted compared to screen Y)
    dy = -dy; 

    if (dx >= 41) { b3 |= 0b00000100; dx -= 81; }
    if (dx <= -41) { b3 |= 0b00001000; dx += 81; }
    if (dx >= 13) { b2 |= 0b00000100; dx -= 27; }
    if (dx <= -13) { b2 |= 0b00001000; dx += 27; }
    if (dx >= 4) { b1 |= 0b00000100; dx -= 9; }
    if (dx <= -4) { b1 |= 0b00001000; dx += 9; }
    if (dx >= 1) { b2 |= 0b00000001; dx -= 3; }
    if (dx <= -1) { b2 |= 0b00000010; dx += 3; }
    if (dx >= 1) { b1 |= 0b00000001; dx -= 1; }
    if (dx <= -1) { b1 |= 0b00000010; dx += 1; }

    if (dy >= 41) { b3 |= 0b00100000; dy -= 81; }
    if (dy <= -41) { b3 |= 0b01000000; dy += 81; }
    if (dy >= 13) { b2 |= 0b00100000; dy -= 27; }
    if (dy <= -13) { b2 |= 0b01000000; dy += 27; }
    if (dy >= 4) { b1 |= 0b00100000; dy -= 9; }
    if (dy <= -4) { b1 |= 0b01000000; dy += 9; }
    if (dy >= 1) { b2 |= 0b10000000; dy -= 3; }
    if (dy <= -1) { b2 |= 0b01000000; dy += 3; } // Note: bit 6 for -3y, bit 7 for +3y
    if (dy >= 1) { b1 |= 0b10000000; dy -= 1; }
    if (dy <= -1) { b1 |= 0b01000000; dy += 1; }

    // Set bit 3 to 1 for all bytes
    b1 |= 0b00000011; // Setting the parity bits
    b2 |= 0b00000011;
    
    if (type !== 2) {
      b3 |= 0b00000011;
    }

    return [b1, b2, b3];
  }
}