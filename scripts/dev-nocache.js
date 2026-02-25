#!/usr/bin/env node
/**
 * 개발 서버 + 캐시 없는 Chrome 프로필로 열기
 * 임시 프로필 = 기존 캐시 무시 → 업데이트 항상 보임
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const tmpDir = path.join(rootDir, '.chrome-dev-session');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const dev = spawn('npm', ['run', 'dev'], { cwd: rootDir, stdio: 'inherit', shell: true });

setTimeout(() => {
  try {
    if (process.platform === 'darwin') {
      spawn('open', ['-na', 'Google Chrome', '--args',
        `--user-data-dir=${tmpDir}`,
        '--disable-http-cache',
        'http://localhost:3001'
      ], { detached: true, stdio: 'ignore' }).unref();
      console.log('\n✅ Chrome 임시 프로필로 열림 (캐시 없음) → http://localhost:3001\n');
    } else {
      const cmd = process.platform === 'win32' ? 'start' : 'xdg-open';
      spawn(cmd, ['http://localhost:3001'], { detached: true, stdio: 'ignore' }).unref();
      console.log('\n→ http://localhost:3001\n');
    }
  } catch (_) {
    console.log('\n→ http://localhost:3001\n');
  }
}, 6000);
