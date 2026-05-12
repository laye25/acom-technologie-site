const fs = require('fs');
const glob = require('glob'); // Not available? Just use standard fs

const filesToFix = [
  'src/pages/AdminDashboard.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/Home.tsx',
  'src/pages/Portfolio.tsx',
  'src/pages/ServiceDetails.tsx',
  'src/pages/PartnerPortal.tsx',
  'src/pages/Contact.tsx',
  'src/pages/OrderInvoice.tsx',
  'src/pages/OrderQuote.tsx',
  'src/pages/Chat.tsx',
  'src/pages/Blog.tsx',
  'src/pages/POS.tsx',
  'src/pages/OrderDetails.tsx',
  'src/pages/MerchantSaaS.tsx',
  'src/components/admin/PartnerReputationManager.tsx',
  'src/components/admin/UserManager.tsx',
  'src/components/admin/StudioAcomManager.tsx',
  'src/components/admin/MessageManager.tsx',
  'src/components/admin/AcomSaaSManager.tsx',
  'src/components/admin/PartnerMessageManager.tsx',
  'src/components/admin/BlogManager.tsx',
  'src/components/admin/AdminChat.tsx',
  'src/components/admin/PortfolioManager.tsx',
  'src/components/admin/ServiceManager.tsx',
  'src/components/admin/BusinessInsights.tsx',
  'src/components/NotificationCenter.tsx',
  'src/components/chat/PartnerChat.tsx',
  'src/components/AIAssistant.tsx',
  'src/hooks/useStudioAcom.ts'
];

let totalFixed = 0;

filesToFix.forEach(file => {
   if (!fs.existsSync(file)) return;
   let content = fs.readFileSync(file, 'utf8');
   let lines = content.split('\n');
   let changed = false;
   
   for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      // Target `useLiveQuery(() => db.XXX.toArray()) || [];`
      if (line.includes('useLiveQuery(() =>') && line.includes('toArray()) || [];') && !line.includes(', []')) {
          lines[i] = line.replace('toArray()) || [];', 'toArray(), []) || [];');
          changed = true;
          totalFixed++;
      }
      else if (line.includes('useLiveQuery(() =>') && line.includes('toArray().then(') && line.includes(')) || [];') && !line.includes(', []')) {
          lines[i] = line.replace(')) || [];', '), []) || [];');
          changed = true;
          totalFixed++;
      }
      else if (line.includes('useLiveQuery(() => dexieDb') && line.includes('toArray()) || [];') && !line.includes(', []')) {
          lines[i] = line.replace('toArray()) || [];', 'toArray(), []) || [];');
          changed = true;
          totalFixed++;
      }
      else if (line.includes('useLiveQuery(() => db.settings.toArray()) || [];') && !line.includes(', []')) {
          lines[i] = line.replace('toArray()) || [];', 'toArray(), []) || [];');
          changed = true;
          totalFixed++;
      }
   }
   
   if (changed) {
       fs.writeFileSync(file, lines.join('\n'));
       console.log('Fixed', file);
   }
});

console.log('Total lines fixed:', totalFixed);
