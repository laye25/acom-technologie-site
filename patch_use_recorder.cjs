const fs = require('fs');
const file = 'src/ai-demo/hooks/useDemoRecorder.ts';
let code = fs.readFileSync(file, 'utf8');

const target = `
      if (screenOk) {
        toast.success('Capture vidéo de l\\'écran activée !');
      }
    } else {
`;

const replace = `
      if (screenOk) {
        toast.success('Capture vidéo de l\\'écran activée !');
      } else {
        toast.error('Impossible de démarrer la capture d\\'écran.');
      }
    } else {
`;

code = code.replace(target.trim(), replace.trim());
fs.writeFileSync(file, code);
