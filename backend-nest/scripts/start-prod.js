#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { join, resolve } = require('node:path');

const projectRoot = resolve(__dirname, '..');
const distMain = join(projectRoot, 'dist', 'main.js');

function buildIfNeeded() {
  if (existsSync(distMain)) {
    return true;
  }

  console.log('dist/main.js not found. Running "npm run build" to compile the project...');
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npmCmd, ['run', 'build'], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    console.error('\nFailed to compile the backend. See the build output above for details.');
    return false;
  }

  if (!existsSync(distMain)) {
    console.error('\nThe build completed but dist/main.js is still missing. Confirm that tsconfig.build.json outputs to ./dist.');
    return false;
  }

  return true;
}

if (!buildIfNeeded()) {
  process.exit(1);
}

const nodeArgs = [distMain, ...process.argv.slice(2)];
const runResult = spawnSync(process.execPath, nodeArgs, {
  cwd: projectRoot,
  stdio: 'inherit',
  env: process.env,
});

if (runResult.error) {
  throw runResult.error;
}

process.exit(runResult.status ?? 0);
