import fs from 'fs';
import path from 'path';

const configPath = path.resolve('firebase-applet-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

async function testFetch() {
  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId || '(default)'}/documents/settings/global`;
  console.log("Fetching", url);
  const response = await fetch(url);
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

testFetch();
