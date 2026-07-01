const fs = require('fs');

let code = fs.readFileSync('src/pages/MerchantSaaS.tsx', 'utf8');
code = code.replace(/<input\s*$/i, '');

let append = fs.readFileSync('append.txt', 'utf8');
fs.writeFileSync('src/pages/MerchantSaaS.tsx', code + append);
