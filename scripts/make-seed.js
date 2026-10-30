const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'seed.db');
const buf = fs.readFileSync(dbPath);
const b64 = buf.toString('base64');
const outPath = path.join(__dirname, '..', 'src', 'lib', 'db', 'seedBase64.ts');

fs.writeFileSync(outPath, `// Auto-generated embedded seed database\nexport const SEED_DB_BASE64 = "${b64}";\n`);
console.log('Successfully generated seedBase64.ts with size:', buf.length, 'bytes');
