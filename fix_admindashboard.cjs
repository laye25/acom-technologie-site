const fs = require('fs');

let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const importsToLazy = [
  { name: 'ServiceManager', path: '../components/admin/ServiceManager', default: true },
  { name: 'BlogManager', path: '../components/admin/BlogManager', default: true },
  { name: 'SettingsManager', path: '../components/admin/SettingsManager', default: true },
  { name: 'PortfolioManager', path: '../components/admin/PortfolioManager', default: true },
  { name: 'MessageManager', path: '../components/admin/MessageManager', default: true },
  { name: 'UserManager', path: '../components/admin/UserManager', default: true },
  { name: 'DesignRequestManager', path: '../components/admin/DesignRequestManager', default: true },
  { name: 'ExpenseManager', path: '../components/admin/ExpenseManager', default: false },
  { name: 'StudioAcomManager', path: '../components/admin/StudioAcomManager', default: true },
  { name: 'PlatformAIInsights', path: '../components/admin/PlatformAIInsights', default: false },
  { name: 'AcomSaaSManager', path: '../components/admin/AcomSaaSManager', default: false },
  { name: 'AcomSaaSSettings', path: '../components/admin/AcomSaaSSettings', default: false }
];

importsToLazy.forEach(({ name, path, default: isDefault }) => {
  // First, comment out or remove the static import
  let regex;
  if (isDefault) {
    regex = new RegExp(`import ${name} from '${path}';`, 'g');
    code = code.replace(regex, `const ${name} = React.lazy(() => import('${path}'));`);
  } else {
    regex = new RegExp(`import { ${name} } from '${path}';`, 'g');
    code = code.replace(regex, `const ${name} = React.lazy(() => import('${path}').then(m => ({ default: m.${name} })));`);
  }
});

// Since they are lazy loaded, they need to be wrapped in Suspense if they aren't already.
// Actually, usually in a Dashboard we have a switch/if statements for tabs. We can wrap the tab content rendering area in Suspense.
if (!code.includes('<React.Suspense fallback={<div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center"><Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />Chargement du module...</div>}>')) {
   // Let's find where the components are rendered. 
   // We will just do a simple replace for the main content area in the AdminDashboard.
   // Wait, if it's dynamic rendering `renderContent()`, we can just wrap the result of `renderContent()` in Suspense.
   code = code.replace(
      /{renderContent\(\)}/,
      '<React.Suspense fallback={<div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center"><Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />Chargement du module...</div>}>{renderContent()}</React.Suspense>'
   );
}

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log('AdminDashboard.tsx updated with React.lazy');
