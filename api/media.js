import fs from 'node:fs';
import path from 'node:path';

let inMemoryItems = [];

// Try to seed initial items from local backend data if available
try {
  const localIndexPath = path.join(process.cwd(), 'backend', 'data', 'media-index.json');
  if (fs.existsSync(localIndexPath)) {
    const raw = fs.readFileSync(localIndexPath, 'utf8');
    inMemoryItems = JSON.parse(raw);
  }
} catch (_) {}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // DELETE single item
  if (req.method === 'DELETE') {
    const id = url.pathname.replace('/api/media/', '').replace('/api/media', '').trim();
    if (!id) {
      return res.status(400).json({ error: 'Missing media ID' });
    }
    inMemoryItems = inMemoryItems.filter(item => item.id !== id && item.filename !== id);
    return res.status(200).json({ success: true, deletedId: id });
  }

  // GET media list
  let remoteItems = [];
  try {
    const ghRes = await fetch(`https://raw.githubusercontent.com/tradewithsehar-stack/hkc-camera/main/backend/data/media-index.json?_t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (ghRes.ok) {
      remoteItems = await ghRes.json();
    }
  } catch (_) {}

  // Merge items (in-memory + GitHub remote, avoiding duplicates)
  const seen = new Set();
  const merged = [];

  for (const item of inMemoryItems) {
    if (item && item.filename && !seen.has(item.filename)) {
      seen.add(item.filename);
      merged.push(item);
    }
  }

  for (const item of remoteItems) {
    if (item && item.filename && !seen.has(item.filename)) {
      seen.add(item.filename);
      merged.push(item);
    }
  }

  merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  res.status(200).json(merged);
}
