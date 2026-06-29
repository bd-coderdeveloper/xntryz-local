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

console.log('Static assets copied successfully.');
