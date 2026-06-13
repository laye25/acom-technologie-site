import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// CRC-32 utilities for PNG chunk calculation
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i++) {
    crc = crcTable[(crc ^ buffer[i]) & 0xFF] ^ (crc >>> 8);
  }
  return crc ^ -1;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32BE(data.length, 0);
  
  const crcContent = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcContent);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeInt32BE(crcVal, 0);
  
  return Buffer.concat([lengthBuf, crcContent, crcBuf]);
}

function createSolidPng(width, height, r, g, b) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 2; // Color type: 2 (RGB)
  ihdrData[10] = 0; // Compression method: 0
  ihdrData[11] = 0; // Filter method: 0
  ihdrData[12] = 0; // Interlace method: 0
  const ihdrChunk = createChunk('IHDR', ihdrData);
  
  const rowSize = 1 + width * 3;
  const uncompressed = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    const rowStart = y * rowSize;
    uncompressed[rowStart] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelStart = rowStart + 1 + x * 3;
      uncompressed[pixelStart] = r;
      uncompressed[pixelStart + 1] = g;
      uncompressed[pixelStart + 2] = b;
    }
  }
  
  const compressed = zlib.deflateSync(uncompressed);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function ensurePngExists() {
  const outPath = path.resolve('public', 'icon.png');
  if (!fs.existsSync(outPath)) {
    console.log('Creating simple default fallback icon...');
    try {
      const fallbackImage = createSolidPng(512, 512, 75, 85, 99); // Slate-600 color
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, fallbackImage);
      console.log('Saved basic native fallback icon to', outPath);
    } catch (err) {
      console.error('Failed to create fallback icon:', err);
    }
  }
}

// Read config from firebase-applet-config.json
const configPath = path.resolve('firebase-applet-config.json');
if (!fs.existsSync(configPath)) {
  console.log('No firebase config found, skipping icon fetch.');
  ensurePngExists();
  process.exit(0);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const PROJECT_ID = config.projectId;
const DATABASE_ID = config.firestoreDatabaseId || '(default)';

async function fetchIcon() {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/settings/global`;
    console.log(`Fetching icon from REST API: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`Failed to fetch from REST API: ${response.status} ${response.statusText}`);
      ensurePngExists();
      process.exit(0);
    }

    const data = await response.json();
    
    // Check if the desktopLogo field exists
    const desktopLogoObj = data?.fields?.data?.mapValue?.fields?.desktopLogo || data?.fields?.desktopLogo;
    const base64Data = desktopLogoObj?.stringValue;

    if (base64Data && base64Data.startsWith('data:image/')) {
      const matches = base64Data.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const buffer = Buffer.from(matches[2], 'base64');
        
        console.log('Writing custom DB database logo directly to public/icon.png...');
        const outPath = path.resolve('public', 'icon.png');
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, buffer);
        console.log(`Successfully saved processed db icon to ${outPath}`);
        
        // Overwrite package.json to point to icon.png
        const packageJsonPath = path.resolve('package.json');
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (pkg.build) {
          pkg.build.icon = "public/icon.png";
          if (pkg.build.win) pkg.build.win.icon = "public/icon.png";
          if (pkg.build.mac) pkg.build.mac.icon = "public/icon.png";
          
          pkg.build.files = pkg.build.files || [];
          if (!pkg.build.files.includes("public/icon.png")) {
            pkg.build.files.push("public/icon.png");
          }
          fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
          console.log('Updated package.json to use public/icon.png for all build configurations');
        }
      }
    } else {
      console.log('No custom base64 desktopLogo found in db. Ensuring default icon is present.');
      ensurePngExists();
    }
  } catch (error) {
    console.error('Error fetching icon from db:', error);
    ensurePngExists();
  }
  process.exit(0);
}

fetchIcon();

