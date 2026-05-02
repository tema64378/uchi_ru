import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.resolve(__dirname, '../../data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const db = new Database(path.join(DATA_DIR, 'drakosha.db'));

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDB(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      child_name TEXT NOT NULL,
      started_at TEXT NOT NULL,
      total_xp INTEGER DEFAULT 0,
      pet_level INTEGER DEFAULT 1,
      quests_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS completed_quests (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      quest_id TEXT NOT NULL,
      task_type TEXT NOT NULL,
      title TEXT NOT NULL,
      xp_earned INTEGER DEFAULT 0,
      photo_path TEXT,
      completed_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );
  `);

  console.log('Database initialized');
}
