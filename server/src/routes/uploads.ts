import { Router, Request, Response } from 'express';
import path from 'path';
import { db } from '../db/index';

export const uploadsRouter = Router();

// GET /api/uploads
uploadsRouter.get('/', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT photo_path, title, completed_at
      FROM completed_quests
      WHERE photo_path IS NOT NULL
      ORDER BY completed_at DESC
      LIMIT 20
    `).all() as Array<{ photo_path: string; title: string; completed_at: string }>;

    const result = rows.map((row) => ({
      url: '/uploads/' + path.basename(row.photo_path),
      questTitle: row.title,
      completedAt: row.completed_at,
    }));

    res.json(result);
  } catch (err) {
    console.error('Failed to fetch uploads:', err);
    res.status(500).json({ error: 'Failed to fetch uploads' });
  }
});
