import fs from 'fs';
let content = fs.readFileSync('src/services/syncService.ts', 'utf8');

content = content.replace(/localStorage\.setItem\(lastSyncKey, (.*)\);\n      \} else if \(\!lastSyncStr\) \{\n        localStorage\.setItem\(lastSyncKey, .*\);\n      \}/g, (match, p1) => {
  return `localStorage.setItem(lastSyncKey, ${p1});\n      } else {\n        localStorage.setItem(lastSyncKey, Date.now().toString());\n      }`;
});

fs.writeFileSync('src/services/syncService.ts', content);
