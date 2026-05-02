import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../db/index';

export const sessionsRouter = Router();

interface CompletedQuestInput {
  questId: string;
  taskType: string;
  title: string;
  xpEarned: number;
  completedAt: string;
  photoPath?: string;
}

interface CreateSessionBody {
  childName: string;
  completedQuests: CompletedQuestInput[];
  totalXp: number;
  petLevel: number;
}

// POST /api/sessions
sessionsRouter.post('/', (req: Request, res: Response) => {
  const { childName, completedQuests, totalXp, petLevel } = req.body as CreateSessionBody;

  if (!childName || typeof childName !== 'string' || childName.trim() === '') {
    res.status(400).json({ error: 'childName is required' });
    return;
  }

  if (!Array.isArray(completedQuests)) {
    res.status(400).json({ error: 'completedQuests must be an array' });
    return;
  }

  const id = randomUUID();
  const startedAt = new Date().toISOString();

  const insertSession = db.prepare(`
    INSERT INTO sessions (id, child_name, started_at, total_xp, pet_level, quests_count)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertQuest = db.prepare(`
    INSERT INTO completed_quests (id, session_id, quest_id, task_type, title, xp_earned, photo_path, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    insertSession.run(
      id,
      childName.trim(),
      startedAt,
      totalXp ?? 0,
      petLevel ?? 1,
      completedQuests.length
    );

    for (const quest of completedQuests) {
      insertQuest.run(
        randomUUID(),
        id,
        quest.questId,
        quest.taskType,
        quest.title,
        quest.xpEarned ?? 0,
        quest.photoPath ?? null,
        quest.completedAt
      );
    }
  });

  try {
    transaction();
    console.log(`Session created: ${id} for child: ${childName.trim()}`);
    res.status(201).json({ id });
  } catch (err) {
    console.error('Failed to create session:', err);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// GET /api/sessions
sessionsRouter.get('/', (_req: Request, res: Response) => {
  try {
    const sessions = db.prepare(`
      SELECT
        s.id,
        s.child_name,
        s.started_at,
        s.total_xp,
        s.pet_level,
        s.quests_count,
        s.created_at,
        COUNT(cq.id) AS quests_completed
      FROM sessions s
      LEFT JOIN completed_quests cq ON cq.session_id = s.id
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT 10
    `).all();

    res.json(sessions);
  } catch (err) {
    console.error('Failed to fetch sessions:', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// GET /api/sessions/:id
sessionsRouter.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const session = db.prepare(`
      SELECT * FROM sessions WHERE id = ?
    `).get(id);

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const quests = db.prepare(`
      SELECT * FROM completed_quests WHERE session_id = ? ORDER BY completed_at ASC
    `).all(id);

    res.json({ ...session as object, completedQuests: quests });
  } catch (err) {
    console.error('Failed to fetch session:', err);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});
