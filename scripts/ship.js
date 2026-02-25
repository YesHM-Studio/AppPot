#!/usr/bin/env node
/**
 * 원클릭 푸시: add + commit + push
 * npm run ship → Render 배포 트리거
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const msg = process.argv[2] || `wip ${new Date().toLocaleTimeString('ko-KR')}`;

const add = spawnSync('git', ['add', '-A'], { cwd: rootDir, stdio: 'inherit' });
if (add.status !== 0) process.exit(add.status);

const status = spawnSync('git', ['status', '--short'], { cwd: rootDir, encoding: 'utf8' });
if (!status.stdout.trim()) {
  console.log('변경 없음');
  process.exit(0);
}

const commit = spawnSync('git', ['commit', '-m', msg], { cwd: rootDir, stdio: 'inherit' });
if (commit.status !== 0) process.exit(commit.status);

const branch = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: rootDir, encoding: 'utf8' }).stdout.trim();
const push = spawnSync('git', ['push', 'origin', branch], { cwd: rootDir, stdio: 'inherit' });
if (push.status !== 0) process.exit(push.status);

console.log('\n✅ 푸시 완료 → Render 배포 진행 중\n');
