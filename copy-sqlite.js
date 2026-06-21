import fs from 'fs';
import path from 'path';

let sourceDir = path.join(process.cwd(), 'node_modules', '@sqlite.org', 'sqlite-wasm', 'dist');
const destDir = path.join(process.cwd(), 'public');

const filesToCopy = [
  'sqlite3.wasm',
  'sqlite3-opfs-async-proxy.js',
  'sqlite3-worker1.mjs'
];

async function copyFiles() {
  console.log('Copying SQLite WASM assets to public directory...');
  
  if (!fs.existsSync(sourceDir)) {
    const fallbackDir = path.join(process.cwd(), 'node_modules', '@sqlite.org', 'sqlite-wasm', 'sqlite-wasm', 'jswasm');
    if (fs.existsSync(fallbackDir)) {
      console.log(`Main source directory not found. Using fallback directory: ${fallbackDir}`);
      sourceDir = fallbackDir;
    } else {
      console.error(`Source directory not found: ${sourceDir}`);
      process.exit(1);
    }
  }

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  for (const filename of filesToCopy) {
    let src = path.join(sourceDir, filename);
    const dest = path.join(destDir, filename);
    
    // Support files with slightly different names in older versions
    if (!fs.existsSync(src) && filename === 'sqlite3-worker1.mjs') {
      const altSrc = path.join(sourceDir, 'sqlite3-worker1-bundler-friendly.mjs');
      if (fs.existsSync(altSrc)) {
        src = altSrc;
      }
    }
    
    if (fs.existsSync(src)) {
      try {
        fs.copyFileSync(src, dest);
        console.log(`Copied ${path.basename(src)} to public/${filename}`);
      } catch (err) {
        console.error(`Error copying ${filename}:`, err);
      }
    } else {
      console.warn(`Warning: Source file not found: ${src}`);
    }
  }
  
  console.log('SQLite assets copy complete.');
}

copyFiles();
