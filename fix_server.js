const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');
content = content.replace(
  "const __filename = fileURLToPath(import.meta.url);\nconst __dirname = path.dirname(__filename);",
  "const __filename = typeof import.meta.url !== 'undefined' ? fileURLToPath(import.meta.url) : __filename;\nconst __dirname = typeof import.meta.url !== 'undefined' ? path.dirname(__filename) : __dirname;"
);
fs.writeFileSync('server.ts', content);
