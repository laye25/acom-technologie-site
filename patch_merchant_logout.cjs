const fs = require('fs');
let code = fs.readFileSync('src/pages/MerchantSaaS.tsx', 'utf8');

code = code.replace(
  "await signOut();",
  "await signOut();\n      sessionStorage.clear();"
);

fs.writeFileSync('src/pages/MerchantSaaS.tsx', code);
