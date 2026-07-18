import fs from 'fs';

const file = 'src/application/CompilationApplicationService.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "log: 'Remplissage Tatami (Densité = ${reasoningResult.suggestions[0]?.match(/[0-9.]+/)?.[0] || 0.40}mm, ${reasoningResult.decisions[0] || \"Angle=45°\"}).'",
  "log: \`Remplissage Tatami (Densité = \${reasoningResult.suggestions[0]?.match(/[0-9.]+/)?.[0] || 0.40}mm, \${reasoningResult.decisions[0] || \"Angle=45°\"}).\`"
);

fs.writeFileSync(file, content);
