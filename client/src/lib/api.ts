const BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:3001');

export async function validatePhoto(file: File, prompt: string): Promise<{ ok: boolean; message: string }> {
  const form = new FormData();
  form.append('photo', file);
  form.append('prompt', prompt);
  const res = await fetch(`${BASE}/api/validate/photo`, { method: 'POST', body: form });
  if (!res.ok) throw new Error('Server error');
  return res.json();
}

export async function validateSpeech(transcript: string, targetText: string): Promise<{ ok: boolean; score: number; message: string }> {
  const res = await fetch(`${BASE}/api/validate/speech`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, targetText }),
  });
  if (!res.ok) throw new Error('Server error');
  return res.json();
}

export async function saveSession(data: {
  childName: string;
  completedQuests: unknown[];
  totalXp: number;
  petLevel: number;
  ageGroup?: string;
  streak?: number;
  questTypeCounts?: unknown;
  badges?: unknown;
  lifetimeQuestsCompleted?: number;
  lifetimeXpEarned?: number;
}): Promise<{ id: string }> {
  const res = await fetch(`${BASE}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Server error');
  return res.json();
}

export async function getSessions(): Promise<unknown[]> {
  const res = await fetch(`${BASE}/api/sessions`);
  if (!res.ok) throw new Error('Server error');
  return res.json();
}

export async function getUploads(): Promise<{ url: string; questTitle: string; completedAt: string }[]> {
  const res = await fetch(`${BASE}/api/uploads`);
  if (!res.ok) return [];
  return res.json();
}
