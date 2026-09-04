const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 1. Sanitize & Normalize DATABASE_URL
let rawUrl = (process.env.DATABASE_URL || '').trim();

// Strip any surrounding quotes, escaped quotes, or backslashes
let dbUrl = rawUrl.replace(/^["'\s\\]+|["'\s\\]+$/g, '');

// If it contains "file:", extract starting from file:
const fileIndex = dbUrl.indexOf('file:');
if (fileIndex !== -1) {
  dbUrl = dbUrl.substring(fileIndex).replace(/["'\s\\]+$/g, '');
} else if (dbUrl.startsWith('sqlite://')) {
  dbUrl = `file:${dbUrl.replace(/^sqlite:\/\//, '')}`;
} else if (dbUrl.startsWith('sqlite:')) {
  dbUrl = `file:${dbUrl.replace(/^sqlite:/, '')}`;
} else if (
  dbUrl.startsWith('/data/') ||
  dbUrl === '/data/orbit.db' ||
  dbUrl.startsWith('./') ||
  dbUrl.startsWith('../') ||
  (dbUrl.endsWith('.db') && !dbUrl.startsWith('file:'))
) {
  dbUrl = `file:${dbUrl}`;
}

// Check for Render persistent disk
const hasRenderDisk = fs.existsSync('/data');

// If missing or non-file (e.g. postgresql URL accidentally attached to an SQLite schema)
if (!dbUrl.startsWith('file:')) {
  if (hasRenderDisk) {
    console.warn(`[Bootstrap] Notice: DATABASE_URL ('${rawUrl}') does not start with 'file:'. Using Render persistent disk: file:/data/orbit.db`);
    dbUrl = 'file:/data/orbit.db';
  } else if (!dbUrl) {
    console.warn(`[Bootstrap] DATABASE_URL not set. Falling back to local file:./orbit.db`);
    dbUrl = 'file:./orbit.db';
  } else {
    // If user provided a postgres:// url or other external url on SQLite schema
    console.warn(`[Bootstrap] WARNING: Received non-SQLite database URL '${rawUrl}'. Orbit requires SQLite ('file:'). Falling back to file:/data/orbit.db or file:./orbit.db`);
    dbUrl = hasRenderDisk ? 'file:/data/orbit.db' : 'file:./orbit.db';
  }
}

console.log(`[Bootstrap] Target Database: ${dbUrl}`);
process.env.DATABASE_URL = dbUrl;

// Ensure target directory exists for SQLite if writable
try {
  const filePath = dbUrl.replace(/^file:/, '');
  const dir = path.dirname(filePath);
  if (dir && dir !== '.' && dir !== '/' && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
} catch (e) {
  // Directory might be root-managed or already exists, continue
}

// 2. Run Prisma DB Push
console.log('[Bootstrap] Syncing Prisma schema with database...');
const pushProcess = spawn('npx', ['prisma', 'db', 'push', '--skip-generate'], {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: dbUrl },
  shell: true,
});

pushProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`[Bootstrap] prisma db push exited with code ${code}`);
    process.exit(code || 1);
  }

  console.log('[Bootstrap] Schema in sync. Starting Orbit Backend...');
  const serverProcess = spawn('node', ['dist/index.js'], {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: dbUrl },
    shell: true,
  });

  serverProcess.on('exit', (serverCode) => {
    process.exit(serverCode ?? 0);
  });
});
