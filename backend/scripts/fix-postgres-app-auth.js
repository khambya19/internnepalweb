
const fs = require('fs');
const path = require('path');
const os = require('os');

const supportDir = path.join(
  os.homedir(),
  'Library',
  'Application Support',
  'Postgres'
);

function findPgHbaConf() {
  if (!fs.existsSync(supportDir)) {
    return null;
  }
  const entries = fs.readdirSync(supportDir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory() && e.name.startsWith('var-')) {
      const pgHba = path.join(supportDir, e.name, 'pg_hba.conf');
      if (fs.existsSync(pgHba)) return pgHba;
    }
  }
  return null;
}

function main() {
  const pgHbaPath = findPgHbaConf();
  if (!pgHbaPath) {
    console.error('Postgres.app data not found at:', supportDir);
    console.error('Install Postgres.app or run it once to create the config.');
    process.exit(1);
  }

  let content = fs.readFileSync(pgHbaPath, 'utf8');
  const alreadyMd5 = /127\.0\.0\.1\/32\s+md5/;
  if (alreadyMd5.test(content)) {
    console.log('pg_hba.conf already uses password (md5) for 127.0.0.1. No change needed.');
    return;
  }
  // Match line: host ... 127.0.0.1/32 ... trust
  const ipv4Trust = /^(\s*host\s+all\s+all\s+127\.0\.0\.1\/32\s+)trust\s*$/m;
  if (!ipv4Trust.test(content)) {
    console.error('Could not find "host ... 127.0.0.1/32 trust" in', pgHbaPath);
    process.exit(1);
  }

  const backupPath = pgHbaPath + '.backup.' + Date.now();
  fs.copyFileSync(pgHbaPath, backupPath);
  console.log('Backup written to:', backupPath);

  content = content.replace(ipv4Trust, '$1md5');
  fs.writeFileSync(pgHbaPath, content, 'utf8');
  console.log('Updated', pgHbaPath, ': 127.0.0.1/32 now uses md5 (password) auth.');

  console.log('\nRestart Postgres.app for changes to take effect (quit the app and open it again).');
  console.log('Then run: npm run dev');
}

main();
