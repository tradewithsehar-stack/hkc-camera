export default function handler(req, res) {
  // CORS Preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  res.status(200).json({
    status: 'ok',
    version: '3.0.0',
    platform: 'vercel-serverless',
    timestamp: new Date().toISOString(),
    features: {
      pwa: true,
      indexedDB: true,
      verticalReels: true,
      cameraCapture: true
    }
  });
}
