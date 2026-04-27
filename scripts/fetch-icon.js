import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Need to read the config
const configPath = path.resolve('firebase-applet-config.json');
if (!fs.existsSync(configPath)) {
  console.log('No firebase config found, skipping icon fetch.');
  process.exit(0);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function fetchIcon() {
  try {
    const docRef = doc(db, 'settings', 'global');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const settings = data.data || data;
      const base64Data = settings.desktopLogo;

      if (base64Data && base64Data.startsWith('data:image/')) {
        // e.g. data:image/png;base64,iVBORw0KGgo...
        const matches = base64Data.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const extension = matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          
          const outPath = path.resolve('public', 'icon.png');
          fs.writeFileSync(outPath, buffer);
          console.log(`Successfully saved db icon to ${outPath}`);
          
          // Overwrite package.json to point to icon.png
          const packageJsonPath = path.resolve('package.json');
          const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          if (pkg.build && pkg.build.win) {
            pkg.build.win.icon = "public/icon.png";
            pkg.build.files = pkg.build.files || [];
            if (!pkg.build.files.includes("public/icon.png")) {
              pkg.build.files.push("public/icon.png");
            }
            fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
            console.log('Updated package.json to use public/icon.png');
          }
        }
      } else {
        console.log('No custom base64 desktopLogo found in db.');
      }
    } else {
      console.log('No global settings found in db.');
    }
  } catch (error) {
    console.error('Error fetching icon from db:', error);
  }
  process.exit(0);
}

fetchIcon();
