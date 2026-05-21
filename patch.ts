import * as fs from 'fs';

const filePath = 'src/pages/MerchantSaaS.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace all combinations with Number() to ensure type coercion for comparisons

content = content.replace(/\(p\.stockQuantity \|\| 0\) <= \(p\.minStockLevel \|\| 5\)/g, "Number(p.stockQuantity || 0) <= (p.minStockLevel !== undefined && p.minStockLevel !== '' ? Number(p.minStockLevel) : 5)");
content = content.replace(/\(product\.stockQuantity \|\| 0\) <= \(product\.minStockLevel \|\| 5\)/g, "Number(product.stockQuantity || 0) <= (product.minStockLevel !== undefined && product.minStockLevel !== '' ? Number(product.minStockLevel) : 5)");

content = content.replace(/\(p\.stockQuantity \|\| 0\) > 0/g, "Number(p.stockQuantity || 0) > 0");
content = content.replace(/\(product\.stockQuantity \|\| 0\) > 0/g, "Number(product.stockQuantity || 0) > 0");

content = content.replace(/\(p\.stockQuantity \|\| 0\) <= 0/g, "Number(p.stockQuantity || 0) <= 0");
content = content.replace(/\(product\.stockQuantity \|\| 0\) <= 0/g, "Number(product.stockQuantity || 0) <= 0");

content = content.replace(/\(a\.stockQuantity \|\| 0\) - \(b\.stockQuantity \|\| 0\)/g, "Number(a.stockQuantity || 0) - Number(b.stockQuantity || 0)");

fs.writeFileSync(filePath, content);
console.log('File patched successfully');
