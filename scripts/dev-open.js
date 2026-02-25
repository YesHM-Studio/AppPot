#!/usr/bin/env node
/**
 * 개발 서버 실행 + 브라우저 열기
 * 포트 3001, 코드 변경 시 핫 리로드
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const dev = spawn('npm', ['run', 'dev'], { cwd: rootDir, stdio: 'inherit', shell: true });

setTimeout(() => {
  try {
    const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    spawn(cmd, ['http://localhost:5173'], { detached: true, stdio: 'ignore' }).unref();
    console.log('\n브라우저: http://localhost:5173 (Vite 직접) 또는 http://localhost:3001 (프록시)\n');
  } catch (_) {}
}, 6000);
