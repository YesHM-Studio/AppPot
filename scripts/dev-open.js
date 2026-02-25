#!/usr/bin/env node
/**
 * 개발 서버 실행 + 시크릿 창으로 열기 (캐시 없음 → 업데이트 바로 보임)
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const dev = spawn('npm', ['run', 'dev'], { cwd: rootDir, stdio: 'inherit', shell: true });

setTimeout(() => {
  try {
    const url = 'http://localhost:3001';
    if (process.platform === 'darwin') {
      // 시크릿 창 = 캐시 없음, 항상 최신 반영
      spawn('open', ['-na', 'Google Chrome', '--args', '--incognito', url], { detached: true, stdio: 'ignore' }).unref();
    } else {
      const cmd = process.platform === 'win32' ? 'start' : 'xdg-open';
      spawn(cmd, [url], { detached: true, stdio: 'ignore' }).unref();
    }
    console.log('\n✅ → http://localhost:3001\n');
  } catch (_) {
    console.log('\n→ http://localhost:3001 로 접속하세요\n');
  }
}, 6000);
