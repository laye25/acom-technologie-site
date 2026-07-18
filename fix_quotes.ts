import fs from 'fs';
const file = 'src/application/CompilationApplicationService.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "log: 'Squelettisation et calcul de l'axe neutre (Medial Axis).'",
  "log: \"Squelettisation et calcul de l'axe neutre (Medial Axis).\""
);
content = content.replace(
  "log: 'Test d'élasticité et détection de collision (Échec anticipé = 0%).'",
  "log: \"Test d'élasticité et détection de collision (Échec anticipé = 0%).\""
);

fs.writeFileSync(file, content);
