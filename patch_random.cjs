const fs = require('fs');
const content = fs.readFileSync('src/modules/tailleur/components/TailleurEmbroideryManager.tsx', 'utf8');

const search = `x: Math.cos(i * Math.PI * 2 / 30) * 100 + 10 * Math.random(),
              y: Math.sin(i * Math.PI * 2 / 30) * 100 + 10 * Math.random()`;
const replace = `x: Math.cos(i * Math.PI * 2 / 30) * 100 + 10 * 0.5,
              y: Math.sin(i * Math.PI * 2 / 30) * 100 + 10 * 0.5`;

let newContent = content.replace(search, replace);

if (newContent === content) {
    console.error("NO CHANGES MADE for random");
} else {
    fs.writeFileSync('src/modules/tailleur/components/TailleurEmbroideryManager.tsx', newContent);
    console.log("RANDOM CHANGES APPLIED");
}
