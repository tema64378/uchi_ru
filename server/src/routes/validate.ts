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
  const words = targetText
    .toLowerCase()
    .replace(/[.,!?;:]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  const said = transcript.toLowerCase();
  const matched = words.filter((w: string) => said.includes(w)).length;
  const score = words.length > 0 ? matched / words.length : 1;
  const ok = score > 0.25 || transcript.split(' ').length > 15;
  res.json({
    ok,
    score: Math.round(score * 100),
    message: ok
      ? 'Молодец! Дракоша слушал тебя!'
      : 'Попробуй прочитать ещё раз, чуть громче!',
  });
});
