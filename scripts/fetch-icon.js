import fs from 'fs';
import path from 'path';
import { Jimp } from 'jimp';

// Read config from firebase-applet-config.json
const configPath = path.resolve('firebase-applet-config.json');
if (!fs.existsSync(configPath)) {
  console.log('No firebase config found, skipping icon fetch.');
  process.exit(0);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const PROJECT_ID = config.projectId;
const DATABASE_ID = config.firestoreDatabaseId || '(default)';

async function fetchIcon() {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/settings/global`;
    console.log(`Fetching icon from REST API: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`Failed to fetch from REST API: ${response.status} ${response.statusText}`);
      process.exit(0);
    }

    const data = await response.json();
    
    // Check if the desktopLogo field exists
    const desktopLogoObj = data?.fields?.data?.mapValue?.fields?.desktopLogo || data?.fields?.desktopLogo;
    const base64Data = desktopLogoObj?.stringValue;

    if (base64Data && base64Data.startsWith('data:image/')) {
      const matches = base64Data.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const buffer = Buffer.from(matches[2], 'base64');
        
        // Use Jimp to read the buffer, resize to 256x256, and save as PNG
        console.log('Processing image with Jimp...');
        const image = await Jimp.read(buffer);
        
        // Provide a white background if original has transparency but user uploaded something weird,
        // though jimp handles PNG transparency well. We just resize and format as PNG.
        image.resize({ w: 256, h: 256 }); // resize to square 256x256
        
        const outPath = path.resolve('public', 'icon.png');
        await image.write(outPath);
        console.log(`Successfully saved processed db icon to ${outPath}`);
        
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
      console.log('No custom base64 desktopLogo found in db. Using default electron icon.');
    }
  } catch (error) {
    console.error('Error fetching icon from db:', error);
  }
  process.exit(0);
}

fetchIcon();
