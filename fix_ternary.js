const fs = require('fs');
const file = 'src/modules/tailleur/services/embroideryServices.ts';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `      } else if (remainder < -p / 2) {
        coefs[i] = -1;
        remainder -= p;
      }`;
const replaceStr = `      } else if (remainder < -p / 2) {
        coefs[i] = -1;
        remainder += p;
      }`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replaceStr);
    fs.writeFileSync(file, content);
    console.log("Success");
} else {
    console.log("Could not find target string.");
}
