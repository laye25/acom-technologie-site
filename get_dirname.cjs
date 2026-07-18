const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
    if (line.includes('dirname')) console.log(`${i+1}: ${line}`);
});
