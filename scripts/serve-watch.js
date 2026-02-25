#!/usr/bin/env node
/**
 * 빌드 후 서버 실행 + 파일 변경 시 자동 재빌드
 * 코드 저장 → 자동 빌드 → 새로고침만 하면 최신 반영
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const port = 5180;

// 1) 초기 빌드
const build = spawn('npm', ['run', 'build'], { cwd: rootDir, stdio: 'inherit', shell: true });
build.on('close', (code) => {
  if (code !== 0) process.exit(code);

  // 2) 서버 실행 (캐시 비활성화)
  const server = spawn('node', ['server/src/index.js'], {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env, PORT: String(port), APPOT_DEV_CODE: '1' },
  });

  // 3) Vite watch 모드 - client 변경 시 자동 재빌드 → server/public 갱신
  const clientDir = path.join(rootDir, 'client');
  spawn('npx', ['vite', 'build', '--watch', '--outDir', '../server/public'], {
    cwd: clientDir,
    stdio: 'inherit',
  });

  const url = `http://localhost:${port}`;
  console.log(`\n✅ ${url}`);
  console.log('   파일 저장 시 자동 빌드 → 새로고침하면 최신 반영\n');

  try {
    const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    spawn(cmd, [url], { detached: true, stdio: 'ignore' }).unref();
  } catch (_) {}
});
