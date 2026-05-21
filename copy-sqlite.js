import fs from 'fs';
import path from 'path';

const sourceDir = path.join(process.cwd(), 'node_modules', '@sqlite.org', 'sqlite-wasm', 'dist');
const destDir = path.join(process.cwd(), 'public');

const filesToCopy = [
  'sqlite3.wasm',
  'sqlite3-opfs-async-proxy.js',
  'sqlite3-worker1.mjs'
];

async function copyFiles() {
  console.log('Copying SQLite WASM assets to public directory...');
  
  if (!fs.existsSync(sourceDir)) {
    console.error(`Source directory not found: ${sourceDir}`);
    process.exit(1);
  }

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  for (const filename of filesToCopy) {
    const src = path.join(sourceDir, filename);
    const dest = path.join(destDir, filename);
    
    if (fs.existsSync(src)) {
      try {
        fs.copyFileSync(src, dest);
        console.log(`Copied ${filename} to public/`);
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
