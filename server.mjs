import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;

// Directories
const DIRS = {
  mediaPhotos: path.join(__dirname, 'media', 'photos'),
  mediaVideos: path.join(__dirname, 'media', 'videos'),
  mediaThumbs: path.join(__dirname, 'media', 'thumbnails'),
  backendData: path.join(__dirname, 'backend', 'data')
};

// Ensure all directories exist (safely ignore errors on read-only environments like Vercel)
try {
  for (const dir of Object.values(DIRS)) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
} catch (_) {}

const COUNTER_FILE = path.join(DIRS.backendData, 'counter.json');
const MEDIA_INDEX_FILE = path.join(DIRS.backendData, 'media-index.json');

// Initialize counter file if missing
try {
  if (!fs.existsSync(COUNTER_FILE)) {
    fs.writeFileSync(COUNTER_FILE, JSON.stringify({ current: 0 }, null, 2));
  }
} catch (_) {}

// Initialize media index file if missing
try {
  if (!fs.existsSync(MEDIA_INDEX_FILE)) {
    fs.writeFileSync(MEDIA_INDEX_FILE, JSON.stringify([], null, 2));
  }
} catch (_) {}

function getNextCounter(ext = 'jpg') {
  let counterData = { current: 0 };
  try {
    const raw = fs.readFileSync(COUNTER_FILE, 'utf8');
    counterData = JSON.parse(raw);
  } catch (_) {}

  counterData.current = (counterData.current || 0) + 1;
  try {
    fs.writeFileSync(COUNTER_FILE, JSON.stringify(counterData, null, 2));
  } catch (_) {}

  const cleanExt = ext.replace(/^\./, '').toLowerCase();
  const numStr = String(counterData.current).padStart(4, '0');
  const filename = `HKCCAMERA_${numStr}.${cleanExt}`;

  return {
    counter: counterData.current,
    filename,
    id: `HKCCAMERA_${numStr}`
  };
}

function getMediaIndex() {
  try {
    const raw = fs.readFileSync(MEDIA_INDEX_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (_) {
    return [];
  }
}

function saveMediaIndex(items) {
  try {
    fs.writeFileSync(MEDIA_INDEX_FILE, JSON.stringify(items, null, 2));
  } catch (_) {}
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*'
  });
  res.end(JSON.stringify(data));
}

// Ensure Vercel NFT (Node File Trace) bundles all static assets into serverless bundle
if (false) {
  path.join(__dirname, 'style.css');
  path.join(__dirname, 'script.js');
  path.join(__dirname, 'sw.js');
  path.join(__dirname, 'manifest.json');
  path.join(__dirname, 'index.html');
  path.join(__dirname, 'icons', 'camera-icon.svg');
  path.join(__dirname, 'icons', 'favicon.png');
  path.join(__dirname, 'icons', 'icon-192.png');
  path.join(__dirname, 'icons', 'icon-512.png');
}

const server = http.createServer({ maxHeaderSize: 1048576 }, (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // --------------------------------------------------------------------------
  // API Endpoints
  // --------------------------------------------------------------------------

  // 1. Health & Server Status
  if (pathname === '/api/status' && req.method === 'GET') {
    const items = getMediaIndex();
    let currentCounter = 0;
    try {
      currentCounter = JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf8')).current || 0;
    } catch (_) {}

    return sendJson(res, 200, {
      status: 'ok',
      version: '3.0.0',
      cloudStorage: 'active',
      totalItems: items.length,
      currentCounter
    });
  }

  // 2. Atomic Sequential Filename Reservation
  if (pathname === '/api/counter/next' && req.method === 'GET') {
    const ext = parsedUrl.searchParams.get('ext') || 'jpg';
    const nextInfo = getNextCounter(ext);
    return sendJson(res, 200, nextInfo);
  }

  // 3. Central Media Library Index
  if (pathname === '/api/media' && req.method === 'GET') {
    const items = getMediaIndex();
    items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return sendJson(res, 200, items);
  }

  // 4. Delete Media Item
  if (pathname.startsWith('/api/media/') && req.method === 'DELETE') {
    const id = pathname.replace('/api/media/', '').trim();
    if (!id) return sendJson(res, 400, { error: 'Missing media ID' });

    let items = getMediaIndex();
    const target = items.find(item => item.id === id || item.filename === id);

    if (!target) {
      return sendJson(res, 404, { error: 'Media not found' });
    }

    if (target.storagePath && fs.existsSync(target.storagePath)) {
      try { fs.unlinkSync(target.storagePath); } catch (_) {}
    }
    if (target.thumbnailStoragePath && fs.existsSync(target.thumbnailStoragePath)) {
      try { fs.unlinkSync(target.thumbnailStoragePath); } catch (_) {}
    }

    items = items.filter(item => item.id !== target.id);
    saveMediaIndex(items);

    return sendJson(res, 200, { success: true, deletedId: target.id });
  }

  // 5. Upload Media Stream (Binary Stream with Metadata Headers)
  if (pathname === '/api/upload' && req.method === 'POST') {
    let filename = req.headers['x-filename'];
    const mediaType = req.headers['x-type'] || 'photo';
    const mimeType = req.headers['x-mime-type'] || (mediaType === 'video' ? 'video/webm' : 'image/jpeg');
    const width = parseInt(req.headers['x-width'], 10) || 1920;
    const height = parseInt(req.headers['x-height'], 10) || 1080;
    const fps = parseInt(req.headers['x-fps'], 10) || 30;
    const duration = req.headers['x-duration'] || '';
    const aspectRatio = req.headers['x-aspect-ratio'] || '9:16';
    const thumbBase64 = req.headers['x-thumbnail-base64'] || '';

    if (!filename) {
      const ext = mediaType === 'video' ? (mimeType.includes('mp4') ? 'mp4' : 'webm') : 'jpg';
      filename = getNextCounter(ext).filename;
    }

    const id = filename.substring(0, filename.lastIndexOf('.')) || filename;
    const targetDir = mediaType === 'video' ? DIRS.mediaVideos : DIRS.mediaPhotos;
    const filePath = path.join(targetDir, filename);
    const thumbFilename = `${id}_thumb.jpg`;
    const thumbFilePath = path.join(DIRS.mediaThumbs, thumbFilename);

    let writeStream;
    try {
      writeStream = fs.createWriteStream(filePath);
    } catch (err) {
      return sendJson(res, 500, { error: 'Storage write not supported on read-only serverless: ' + err.message });
    }

    let bytesReceived = 0;
    req.on('data', chunk => {
      bytesReceived += chunk.length;
      if (writeStream) writeStream.write(chunk);
    });

    req.on('end', () => {
      if (writeStream) writeStream.end();

      let hasThumb = false;
      if (thumbBase64) {
        try {
          const thumbBuffer = Buffer.from(thumbBase64, 'base64');
          fs.writeFileSync(thumbFilePath, thumbBuffer);
          hasThumb = true;
        } catch (_) {}
      }

      const now = new Date();
      const relativeUrl = mediaType === 'video' ? `/media/videos/${filename}` : `/media/photos/${filename}`;
      const thumbUrl = hasThumb ? `/media/thumbnails/${thumbFilename}` : relativeUrl;

      const record = {
        id,
        filename,
        type: mediaType,
        url: relativeUrl,
        thumbnailUrl: thumbUrl,
        storagePath: filePath,
        thumbnailStoragePath: hasThumb ? thumbFilePath : null,
        width,
        height,
        fps,
        duration,
        aspectRatio,
        fileSize: bytesReceived,
        mimeType,
        timestamp: Date.now(),
        captureDate: now.toISOString().split('T')[0],
        captureTime: now.toTimeString().split(' ')[0],
        createdAt: now.toISOString()
      };

      const items = getMediaIndex();
      items.unshift(record);
      saveMediaIndex(items);

      return sendJson(res, 200, { success: true, item: record });
    });

    req.on('error', err => {
      console.error('Upload stream error:', err);
      if (writeStream) writeStream.destroy();
      return sendJson(res, 500, { error: err.message });
    });

    return;
  }

  // --------------------------------------------------------------------------
  // Static Media Serving with Byte-Range Streaming
  // --------------------------------------------------------------------------
  if (pathname.startsWith('/media/')) {
    const relPath = pathname.replace('/media/', '');
    const fullPath = path.join(__dirname, 'media', relPath);

    if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Media Not Found');
      return;
    }

    const stat = fs.statSync(fullPath);
    const fileSize = stat.size;
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(fullPath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400'
      });
      fs.createReadStream(fullPath).pipe(res);
    }
    return;
  }

  // --------------------------------------------------------------------------
  // Static Web App Serving
  // --------------------------------------------------------------------------
  let reqPath = pathname;
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.join(__dirname, reqPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Server Error: ' + err.code);
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.css' || ext === '.js' ? 'public, max-age=0, must-revalidate' : 'no-cache',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content);
    }
  });
});

export default server;

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`HKC_CAMERA_CENTRAL_SERVER_RUNNING on http://localhost:${PORT}`);
  });
}
