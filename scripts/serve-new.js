#!/usr/bin/env node
/**
 * 빌드 후 새 포트로 서버 실행 (캐시 회피용)
 * 작업 완료할 때마다 다른 포트(5100→5110→5120...)로 열림
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const portFile = path.join(rootDir, '.last-port');

let port = 5100;
try {
  if (fs.existsSync(portFile)) {
    port = parseInt(fs.readFileSync(portFile, 'utf8'), 10) || 5100;
  }
} catch (_) {}
port += 10;
if (port > 5999) port = 5100;
fs.writeFileSync(portFile, String(port));

const build = spawn('npm', ['run', 'build'], { cwd: rootDir, stdio: 'inherit', shell: true });
build.on('close', (code) => {
  if (code !== 0) process.exit(code);
  const server = spawn('node', ['server/src/index.js'], {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env, PORT: String(port), APPOT_DEV_CODE: '1' },
  });
  const url = `http://localhost:${port}`;
  console.log(`\n✅ ${url}\n`);

  // 기본 브라우저로 미리보기 열기
  try {
    const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    spawn(cmd, [url], { detached: true, stdio: 'ignore' }).unref();
  } catch (_) {}
});
