import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { initDb } from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = join(__dirname, '../../data');
const dbPath = join(dataDir, 'apppot.db');

let db;

async function init() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    db = new SQL.Database(buf);
    migrate(db);
    save();
  } else {
    db = new SQL.Database();
    initDb(db);
    save();
  }
}

function migrate(database) {
  try {
    database.exec(`ALTER TABLE users ADD COLUMN recovery_email TEXT`);
  } catch (_) {}
  try {
    database.exec(`ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1`);
  } catch (_) {}
  try {
    database.exec(`
      CREATE TABLE IF NOT EXISTS password_reset_codes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        code TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (_) {}
  try {
    database.exec(`ALTER TABLE users ADD COLUMN name_change_count INTEGER DEFAULT 0`);
  } catch (_) {}
  try {
    database.exec(`ALTER TABLE users ADD COLUMN name_last_changed TEXT`);
  } catch (_) {}
  try {
    database.exec(`ALTER TABLE users ADD COLUMN email_last_changed TEXT`);
  } catch (_) {}
  try {
    database.exec(`ALTER TABLE projects ADD COLUMN is_draft INTEGER DEFAULT 0`);
  } catch (_) {}
  try {
    database.exec(`ALTER TABLE projects ADD COLUMN is_commission INTEGER DEFAULT 0`);
  } catch (_) {}
  try {
    database.exec(`ALTER TABLE projects ADD COLUMN thumbnail_url TEXT`);
  } catch (_) {}
  try {
    database.exec(`ALTER TABLE projects ADD COLUMN start_price INTEGER`);
  } catch (_) {}
  try {
    database.exec(`ALTER TABLE projects ADD COLUMN options_json TEXT`);
  } catch (_) {}
}

let saveTimer = null;
function save() {
  if (!db) return;
  if (saveTimer) return; // 디바운스
  saveTimer = setImmediate(() => {
    saveTimer = null;
    try {
      fs.writeFileSync(dbPath, Buffer.from(db.export()));
    } catch (e) {
      console.error('DB save error:', e.message);
    }
  });
}

function prepare(sql) {
  return {
    run: (...params) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      stmt.step();
      stmt.free();
      save();
    },
    get: (...params) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const result = stmt.step() ? stmt.getAsObject() : undefined;
      stmt.free();
      return result;
    },
    all: (...params) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      return rows;
    }
  };
}

// Init is async - we need to call it before using
await init();

export default { prepare, exec: (s) => { db.exec(s); save(); } };
