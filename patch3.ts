import * as fs from 'fs';

const filePath = 'src/pages/MerchantSaaS.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Simplify and correct the conditions!
content = content.replace(/\(p\.minStockLevel !== undefined && p\.minStockLevel !== '' \? Number\(p\.minStockLevel\) : 5\)/g, "(Number(p.minStockLevel) || 5)");
content = content.replace(/\(product\.minStockLevel !== undefined && product\.minStockLevel !== '' \? Number\(product\.minStockLevel\) : 5\)/g, "(Number(product.minStockLevel) || 5)");

fs.writeFileSync(filePath, content);
console.log('File patched successfully');
