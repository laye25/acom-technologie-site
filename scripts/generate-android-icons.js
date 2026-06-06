import { Jimp } from 'jimp';
import * as fs from 'fs';
import * as path from 'path';

const rawSourceIcon = 'src/assets/images/app_desktop_icon_1779399956954.png';
const targetIcon = 'public/icon.png';

async function generate() {
  console.log(`Copying clean source icon from ${rawSourceIcon} to ${targetIcon}...`);
  if (!fs.existsSync(rawSourceIcon)) {
    console.error(`Clean source icon ${rawSourceIcon} not found!`);
    process.exit(1);
  }

  // Perform clean binary copy to replace any corrupted public/icon.png
  fs.copyFileSync(rawSourceIcon, targetIcon);
  console.log('✓ Icon copied successfully.');

  const targets = [
    { dir: 'mipmap-mdpi', size: 48, foreSize: 108 },
    { dir: 'mipmap-hdpi', size: 72, foreSize: 162 },
    { dir: 'mipmap-xhdpi', size: 96, foreSize: 216 },
    { dir: 'mipmap-xxhdpi', size: 144, foreSize: 324 },
    { dir: 'mipmap-xxxhdpi', size: 192, foreSize: 432 },
  ];

  const resPath = 'android/app/src/main/res';
  const buffer = fs.readFileSync(targetIcon);

  for (const t of targets) {
    const mipmapDir = path.join(resPath, t.dir);
    if (!fs.existsSync(mipmapDir)) {
      console.log(`Creating directory ${mipmapDir}...`);
      fs.mkdirSync(mipmapDir, { recursive: true });
    }

    // 1. ic_launcher.png
    console.log(`Processing ic_launcher.png for ${t.dir}...`);
    const imgNormal = await Jimp.read(buffer);
    imgNormal.resize({ w: t.size, h: t.size });
    await imgNormal.write(path.join(mipmapDir, 'ic_launcher.png'));
    console.log(`✓ Generated ic_launcher.png (${t.size}x${t.size}) in ${t.dir}`);

    // 2. ic_launcher_round.png
    console.log(`Processing ic_launcher_round.png for ${t.dir}...`);
    const imgRound = await Jimp.read(buffer);
    imgRound.resize({ w: t.size, h: t.size });
    await imgRound.write(path.join(mipmapDir, 'ic_launcher_round.png'));
    console.log(`✓ Generated ic_launcher_round.png (${t.size}x${t.size}) in ${t.dir}`);

    // 3. ic_launcher_foreground.png
    console.log(`Processing ic_launcher_foreground.png for ${t.dir}...`);
    const imgForeground = await Jimp.read(buffer);
    imgForeground.resize({ w: t.foreSize, h: t.foreSize });
    await imgForeground.write(path.join(mipmapDir, 'ic_launcher_foreground.png'));
    console.log(`✓ Generated ic_launcher_foreground.png (${t.foreSize}x${t.foreSize}) in ${t.dir}`);
  }

  console.log('Android assets generated successfully!');
}

generate().catch((err) => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
