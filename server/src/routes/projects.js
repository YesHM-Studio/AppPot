import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import db from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMMISSION_OPTIONS_PATH = path.join(__dirname, '../../data/commission-options.json');

function getCommissionOptions() {
  try {
    if (fs.existsSync(COMMISSION_OPTIONS_PATH)) {
      const raw = fs.readFileSync(COMMISSION_OPTIONS_PATH, 'utf8');
      return JSON.parse(raw);
    }
  } catch (_) {}
  return null;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

const router = Router();

router.get('/commission/design', (req, res) => {
  const p = db.prepare('SELECT id FROM projects WHERE is_commission = 1 AND category = ? LIMIT 1').get('디자인');
  if (!p) return res.status(404).json({ error: '디자인 커미션을 찾을 수 없습니다.' });
  res.json({ id: p.id });
});

router.get('/', (req, res) => {
  const { status, category, page = 1, limit = 12 } = req.query;
  let sql = 'SELECT p.*, u.name as client_name FROM projects p JOIN users u ON p.client_id = u.id WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND p.status = ?'; params.push(status); }
  if (category) { sql += ' AND p.category = ?'; params.push(category); }
  sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
  const rows = db.prepare(sql).all(...params);
  const projects = rows.map((p) => ({ ...p, client_name: (p.is_commission ? 'AppPot' : p.client_name) || 'AppPot' }));
  let countSql = 'SELECT COUNT(*) as c FROM projects WHERE 1=1';
  const countParams = [];
  if (status) { countSql += ' AND status = ?'; countParams.push(status); }
  if (category) { countSql += ' AND category = ?'; countParams.push(category); }
  const { c } = db.prepare(countSql).get(...countParams) || {};
  res.json({ projects, total: c || 0 });
});

router.get('/:id', (req, res) => {
  const project = db.prepare(`
    SELECT p.*, u.name as client_name, u.email as client_email
    FROM projects p JOIN users u ON p.client_id = u.id
    WHERE p.id = ?
  `).get(req.params.id);
  if (!project) return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다.' });
  const clientName = project.is_commission ? 'AppPot' : project.client_name;
  const files = db.prepare('SELECT * FROM project_files WHERE project_id = ?').all(project.id);
  const estimates = db.prepare(`
    SELECT e.*, u.name as seller_name, sp.rating, sp.review_count
    FROM estimates e
    JOIN users u ON e.seller_id = u.id
    LEFT JOIN seller_profiles sp ON sp.user_id = u.id
    WHERE e.project_id = ?
  `).all(project.id);
  const out = { ...project, client_name: clientName, files, estimates };
  if (project.is_commission) {
    const opts = getCommissionOptions();
    if (opts) out.options_json = JSON.stringify(opts);
  }
  res.json(out);
});

router.post('/', authMiddleware, upload.array('files', 5), (req, res) => {
  const { title, category, budget, deadline, description } = req.body;
  if (!title || !category || !budget) {
    return res.status(400).json({ error: '제목, 카테고리, 예산은 필수입니다.' });
  }
  const budgetNum = parseInt(budget, 10);
  if (isNaN(budgetNum) || budgetNum < 100000) {
    return res.status(400).json({ error: '예산은 최소 10만원 이상이어야 합니다.' });
  }
  if (deadline) {
    const todayKST = new Date().toLocaleDateString('fr-CA', { timeZone: 'Asia/Seoul' });
    if (deadline < todayKST) {
      return res.status(400).json({ error: '마감일은 오늘 이후로 선택해주세요.' });
    }
  }
  const id = uuidv4();
  db.prepare(`
    INSERT INTO projects (id, client_id, title, category, budget, deadline, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, title, category, parseInt(budget), deadline || null, description || '');

  if (req.files?.length) {
    const insert = db.prepare('INSERT INTO project_files (id, project_id, filename, url) VALUES (?, ?, ?, ?)');
    for (const f of req.files) {
      insert.run(uuidv4(), id, f.filename, `/uploads/${f.filename}`);
    }
  }
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.status(201).json(project);
});

export default router;
