const fs = require('fs');
const lines = fs.readFileSync('webapp/src/app/(dashboard)/tools/up-to-reels/page.tsx', 'utf8').split('\n');
fs.writeFileSync('webapp/src/app/(dashboard)/tools/up-to-reels/page.tsx', lines.slice(0, 810).join('\n'));
