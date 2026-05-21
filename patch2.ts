import * as fs from 'fs';

const filePath = 'src/pages/MerchantSaaS.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/acc \+ \(p\.stockQuantity \|\| 0\)/g, "acc + Number(p.stockQuantity || 0)");
content = content.replace(/\(p\.price \* \(p\.stockQuantity \|\| 0\)\)/g, "(p.price * Number(p.stockQuantity || 0))");
content = content.replace(/\(product\.price \* \(product\.stockQuantity \|\| 0\)\)/g, "(product.price * Number(product.stockQuantity || 0))");

fs.writeFileSync(filePath, content);
console.log('File patched successfully');
