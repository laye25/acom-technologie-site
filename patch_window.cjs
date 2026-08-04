const fs = require('fs');
const content = fs.readFileSync('src/vite-env.d.ts', 'utf8');

if (!content.includes('__SENTINEL_HASHES')) {
  const replace = content + `\n
interface Window {
  __BRIDGE_STATS?: any;
  __SENTINEL_HASHES?: any;
  __SENTINEL_STATE_HASH?: any;
  __SENTINEL_RENDER_HASH?: any;
  __SENTINEL_EMBROIDERY_HASH?: any;
}`;
  fs.writeFileSync('src/vite-env.d.ts', replace);
  console.log("WINDOW TYPES APPLIED");
} else {
  console.log("ALREADY APPLIED");
}
