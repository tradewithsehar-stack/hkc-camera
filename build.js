import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');

// Clean and recreate dist
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Static files to copy
const files = [
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'sw.js',
  'supabase.js'
];

for (const file of files) {
  const src = path.join(__dirname, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(distDir, file));
    console.log(`Copied ${file} -> dist/${file}`);
  }
}

// Copy icons directory
const iconsSrc = path.join(__dirname, 'icons');
const iconsDest = path.join(distDir, 'icons');
if (fs.existsSync(iconsSrc)) {
  fs.cpSync(iconsSrc, iconsDest, { recursive: true });
  console.log('Copied icons/ -> dist/icons/');
}

console.log('HKC Camera static build complete: dist/ ready.');
