import fs from 'fs';
import path from 'path';
import https from 'https';

const PROJECT_ID = "gen-lang-client-0320127599";
const DB_ID = "ai-studio-f5fb1c01-450f-4857-a562-ec04eda58049";
const URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DB_ID}/documents/settings/global`;

https.get(URL, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json && json.fields && json.fields.desktopLogo && json.fields.desktopLogo.stringValue) {
        let base64 = json.fields.desktopLogo.stringValue;
        if (base64.startsWith('data:image/')) {
          const parts = base64.split(',');
          if (parts.length > 1) {
            base64 = parts[1];
          }
        }
        
        const buffer = Buffer.from(base64, 'base64');
        const iconPath = path.join(process.cwd(), 'public', 'icon.png');
        
        fs.writeFileSync(iconPath, buffer);
        console.log('[Build] Downloaded and applied custom desktop logo from settings to public/icon.png');
      } else {
        console.log('[Build] No custom desktop logo found in settings. Proceeding with default.');
      }
    } catch (e) {
      console.error('[Build] Failed to parse desktop logo from settings:', e.message);
    }
  });

}).on("error", (err) => {
  console.error('[Build] Failed to fetch desktop logo:', err.message);
});
