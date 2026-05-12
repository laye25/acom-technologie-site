const fs = require('fs');

const filesToFix = [
  'src/pages/MerchantSaaS.tsx',
  'src/pages/ServiceDetails.tsx',
  'src/components/chat/PartnerChat.tsx',
  'src/components/admin/MessageManager.tsx',
  'src/components/NotificationCenter.tsx'
];

let totalFixed = 0;

filesToFix.forEach(file => {
   if (!fs.existsSync(file)) return;
   let content = fs.readFileSync(file, 'utf8');
   
   // Multiline regex replace:
   // useLiveQuery(() => 
   //    db.xxxx.toArray()
   // )
   // to
   // useLiveQuery(() => 
   //    db.xxxx.toArray(), []
   // )
   
   let newContent = content.replace(/(useLiveQuery\(\s*(?:async\s+)?(?:[a-zA-Z0-9_\s{}]*)?=>.*?toArray\(\))(\s*\))/gs, (match, p1, p2) => {
       totalFixed++;
       return p1 + ', []' + p2;
   });

   if (newContent !== content) {
       fs.writeFileSync(file, newContent);
       console.log('Fixed multiline in', file);
   }
});

console.log('Total multiline lines fixed:', totalFixed);
