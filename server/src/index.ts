import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { initDB } from './db/index';
import { sessionsRouter } from './routes/sessions';
import { uploadsRouter } from './routes/uploads';
import { validateRouter } from './routes/validate';

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads directory exists
const UPLOADS_DIR = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static: uploaded photos
app.use('/uploads', express.static(UPLOADS_DIR));

// Static: client production build
const CLIENT_DIST = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
}

// API routes
app.use('/api/sessions', sessionsRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/validate', validateRouter);

// SPA fallback for non-API routes (production)
app.get(/^(?!\/api).*/, (_req, res) => {
  const indexHtml = path.join(CLIENT_DIST, 'index.html');
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.status(404).send('Client build not found. Run `npm run build` in the client directory.');
  }
});

// Initialize DB and start server
initDB();

app.listen(PORT, () => {
  console.log(`Дракоша server running on port ${PORT}`);
});
