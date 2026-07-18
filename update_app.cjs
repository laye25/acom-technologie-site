const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace synchronous imports with React.lazy
const importsToLazy = [
  'Chat', 'OrderDetails', 'OrderQuote', 'OrderInvoice', 'Portfolio', 
  'QuoteRequest', 'Contact', 'Blog', 'BlogPost', 'POS',
  'Pricing', 'SaaSSolutions', 'ServiceDetails', 'EmailPreview',
  'ReleaseNotes', 'About', 'BecomePartner', 'PartnerTerms', 'FAQ',
  'Terms', 'Privacy', 'Home', 'Login', 'OrderForm', 'Dashboard'
];

importsToLazy.forEach(comp => {
  const regex = new RegExp(`import ${comp} from '\\.\\/pages\\/${comp}';`, 'g');
  if (regex.test(code)) {
    code = code.replace(regex, `const ${comp} = React.lazy(() => import('./pages/${comp}'));`);
  }
});

// Also PartnerPortal
code = code.replace(/import { PartnerPortal } from '\.\/pages\/PartnerPortal';/g, "const PartnerPortal = React.lazy(() => import('./pages/PartnerPortal').then(module => ({ default: module.PartnerPortal })));");


fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx updated');
