const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(function(childItemName) {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else if (exists) {
    fs.copyFileSync(src, dest);
  }
}

const standaloneDir = path.join(__dirname, '.next', 'standalone');
const publicDir = path.join(__dirname, 'public');
const staticDir = path.join(__dirname, '.next', 'static');

console.log('Copying static assets to standalone directory...');

if (fs.existsSync(publicDir)) {
  copyRecursiveSync(publicDir, path.join(standaloneDir, 'public'));
  console.log('Copied public directory.');
}

if (fs.existsSync(staticDir)) {
  copyRecursiveSync(staticDir, path.join(standaloneDir, '.next', 'static'));
  console.log('Copied .next/static directory.');
}

const envLocalPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envLocalPath)) {
  fs.copyFileSync(envLocalPath, path.join(standaloneDir, '.env.local'));
  console.log('Copied .env.local.');
}

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.copyFileSync(envPath, path.join(standaloneDir, '.env'));
  console.log('Copied .env.');
}

console.log('Static assets copied successfully.');
