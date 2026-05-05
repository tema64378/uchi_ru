import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const validateRouter = Router();

validateRouter.post('/photo', upload.single('photo'), async (req, res): Promise<void> => {
  try {
    const { prompt = 'рисунок или поделка' } = req.body as { prompt?: string };

    if (!req.file) {
      res.json({ ok: false, message: 'Фото не получено' });
      return;
    }

    // If no API key, use offline fallback
    if (!process.env.ANTHROPIC_API_KEY) {
      res.json({ ok: true, message: 'Отлично! Дракоша видит твою работу!' });
      return;
    }

    const imageData = fs.readFileSync(req.file.path);
    const base64 = imageData.toString('base64');
    const mediaType = (req.file.mimetype || 'image/jpeg') as
      | 'image/jpeg'
      | 'image/png'
      | 'image/gif'
      | 'image/webp';

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: `Ты помощник в детской образовательной игре. Посмотри на фото и ответь ТОЛЬКО: "ДА" или "НЕТ".
Вопрос: На фото есть ${prompt}?
Ответь одним словом: ДА или НЕТ.`,
            },
          ],
        },
      ],
    });

    const answer = (response.content[0] as { text: string }).text.trim().toUpperCase();
    const ok = answer.includes('ДА') || answer.includes('YES') || answer.includes('ЕСТЬ');

    res.json({
      ok,
      message: ok
        ? 'Дракоша видит твою работу! Молодец!'
        : 'Попробуй сфотографировать чётче или сделать задание заново!',
    });
  } catch (err) {
    console.error('Photo validation error:', err);
    // Graceful fallback — always accept if validation fails
    res.json({ ok: true, message: 'Отлично! Дракоша доволен!' });
  }
});

validateRouter.post('/speech', (req, res): void => {
  const { transcript = '', targetText = '' } = req.body as { transcript?: string; targetText?: string };

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[^а-яa-z0-9\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const distance = (a: string, b: string): number => {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i += 1) {
      const current = [i];
      for (let j = 1; j <= b.length; j += 1) {
        current[j] = Math.min(
          prev[j] + 1,
          current[j - 1] + 1,
          prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
        );
      }
      for (let j = 0; j <= b.length; j += 1) prev[j] = current[j];
    }
    return prev[b.length];
  };

  const normalizedTarget = normalize(targetText);
  const normalizedTranscript = normalize(transcript);
  const targetWords = normalizedTarget.split(' ').filter(word => word.length > 2);
  const spokenWords = normalizedTranscript.split(' ').filter(Boolean);
  const targetPool = targetWords.length > 0 ? targetWords : normalizedTarget.split(' ').filter(Boolean);
  const spokenPool = spokenWords.length > 0 ? spokenWords : normalizedTranscript.split(' ').filter(Boolean);

  let ok = false;
  let score = 0;

  if (targetPool.length > 0 && spokenPool.length > 0) {
    const used = new Set<number>();
    let matched = 0;

    for (const targetWord of targetPool) {
      const exactIndex = spokenPool.findIndex((word, index) => !used.has(index) && word === targetWord);
      if (exactIndex >= 0) {
        used.add(exactIndex);
        matched += 1;
        continue;
      }

      const softIndex = spokenPool.findIndex((word, index) => {
        if (used.has(index)) return false;
        const shortEnough = Math.abs(word.length - targetWord.length) <= 2;
        const closeEnough = distance(word, targetWord) <= 2;
        const prefixMatch = word.length >= 4 && targetWord.length >= 4 && (word.startsWith(targetWord.slice(0, 3)) || targetWord.startsWith(word.slice(0, 3)));
        return shortEnough && (closeEnough || prefixMatch);
      });

      if (softIndex >= 0) {
        used.add(softIndex);
        matched += 1;
      }
    }

    const wordScore = matched / targetPool.length;
    const phraseScore = 1 - (distance(normalizedTranscript, normalizedTarget) / Math.max(normalizedTranscript.length, normalizedTarget.length, 1));
    const speechLengthScore = spokenPool.length / Math.max(targetPool.length, 1);
    const aggregate = Math.max(wordScore, phraseScore, speechLengthScore * 0.7);

    score = Math.round(aggregate * 100);
    ok = aggregate >= 0.58;
  }

  if (!ok && transcript.split(' ').length > targetPool.length + 4) {
    ok = true;
    score = Math.max(score, 65);
  }

  res.json({
    ok,
    score,
    message: ok
      ? 'Молодец! Дракоша слушал тебя!'
      : 'Попробуй прочитать ещё раз, чуть громче!',
  });
});
