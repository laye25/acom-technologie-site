const fs = require('fs');
let code = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

// Add import
code = code.replace(
  "import { db as localDb } from '../db/db';",
  "import { db as localDb } from '../db/db';\nimport { desktopSessionManager } from '../services/desktopSessionManager';"
);

// Remove isRestoring
code = code.replace(/const \[isRestoring, setIsRestoring\][\s\S]*?\}\);/m, "");
code = code.replace(/const isRestoringRef = useRef\(isRestoring\);/m, "");
code = code.replace(/useEffect\(\(\) => \{\s*isRestoringRef.current = isRestoring;\s*\}, \[isRestoring\]\);/m, "");

// Remove saveSettingsToDesktop
code = code.replace(/const saveSettingsToDesktop = async \([\s\S]*?^\s*\};\n/m, "");

// Remove restoreSession useEffect
code = code.replace(/\/\/ Restaurer immédiatement la session locale[\s\S]*?restoreSession\(\);\s*\}, \[\]\);/m, "");

// Update onAuthStateChanged
code = code.replace(/\/\/ If we are still restoring the physical session from the file system, ignore null events\s*if \(isRestoringRef\.current && !currentUser\) \{\s*console\.log\('\[DIAGNOSTIC\] onAuthStateChanged: Ignorance de l\\'événement null pendant la restauration active\.\.\.'\);\s*return;\s*\}/m, "");

// Add desktopSessionManager.saveSession
code = code.replace(
  /setUser\(currentUser\);/,
  "setUser(currentUser);\n        desktopSessionManager.saveSession(currentUser);"
);

// Update null handling in onAuthStateChanged
// Instead of checking storedSession and mock offline session, just set user to null
// Wait, let's find the exact block for "Firebase a renvoyé un utilisateur null"
const nullBlockRegex = /console\.log\('\[DIAGNOSTIC\] onAuthStateChanged: Firebase a renvoyé un utilisateur null[\s\S]*?\}\n/m;
code = code.replace(nullBlockRegex, `desktopSessionManager.saveSession(null);
          setUser(null);
          setProfile(null);
          setCustomClaims(null);
          setLoading(false);
          // Nettoyage Dexie optionnel ici si nécessaire\n`);

// Remove calls to saveSettingsToDesktop in other places
code = code.replace(/saveSettingsToDesktop\(\);/g, "");
code = code.replace(/await saveSettingsToDesktop\(trimmedEmail, password\);/g, "");

fs.writeFileSync('src/context/AuthContext.tsx', code);
console.log("Done patching AuthContext.tsx");
