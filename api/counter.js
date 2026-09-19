// Vercel Serverless Function: Continuous Atomic Sequential Filename Counter
let memoryCounter = 3; // Start after existing initial captures

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { searchParams } = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const ext = (searchParams.get('ext') || 'jpg').replace(/^\./, '').toLowerCase();

  memoryCounter += 1;
  const numStr = String(memoryCounter).padStart(4, '0');
  const filename = `HKCCAMERA_${numStr}.${ext}`;

  res.status(200).json({
    counter: memoryCounter,
    filename,
    id: `HKCCAMERA_${numStr}`
  });
}
