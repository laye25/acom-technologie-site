const { execSync } = require('child_process');
execSync('git checkout src/pages/MerchantSaaS.tsx');
console.log("Reverted");
