import fs from 'fs';
import path from 'path';

const sourceDir = path.join('node_modules', '@sqlite.org', 'sqlite-wasm', 'sqlite-wasm', 'jswasm');
const destDir = 'public';

const filesToCopy = [
  'sqlite3.wasm',
  'sqlite3-opfs-async-proxy.js',
  'sqlite3-worker1.mjs'
];

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

filesToCopy.forEach(file => {
  const src = path.join(sourceDir, file);
  const dest = path.join(destDir, file);
  if (fs.existsSync(src)) {
    try {
      fs.copyFileSync(src, dest);
      console.log(`Copied ${file} to ${destDir}/`);
    } catch (err) {
      console.error(`Error copying ${file}:`, err);
    }
  } else {
    // Check other possible folders or just print a warning
    console.warn(`Source file not found: ${src}`);
  }
});
