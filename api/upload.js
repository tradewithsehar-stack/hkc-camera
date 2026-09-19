export const config = {
  api: {
    bodyParser: false
  }
};

async function readStreamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const filename = req.headers['x-filename'] || `HKCCAMERA_${Date.now()}.jpg`;
    const mediaType = req.headers['x-type'] || 'photo';
    const mimeType = req.headers['x-mime-type'] || (mediaType === 'video' ? 'video/webm' : 'image/jpeg');
    const width = parseInt(req.headers['x-width'], 10) || 1920;
    const height = parseInt(req.headers['x-height'], 10) || 1080;
    const fps = parseInt(req.headers['x-fps'], 10) || 30;
    const duration = req.headers['x-duration'] || '';
    const aspectRatio = req.headers['x-aspect-ratio'] || '9:16';
    const thumbBase64 = req.headers['x-thumbnail-base64'] || '';
    const ghToken = req.headers['x-github-token'] || process.env.GITHUB_TOKEN || '';

    const bodyBuffer = await readStreamToBuffer(req);
    const id = filename.substring(0, filename.lastIndexOf('.')) || filename;
    const now = new Date();

    let directUrl = '';
    let thumbUrl = '';
    let cloudSynced = false;

    // Direct GitHub Cloud Vault Push if Token Available
    if (ghToken) {
      const repo = 'tradewithsehar-stack/hkc-camera';
      const folder = mediaType === 'video' ? 'media/videos' : 'media/photos';
      const targetPath = `${folder}/${filename}`;

      const ghUploadRes = await fetch(`https://api.github.com/repos/${repo}/contents/${targetPath}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${ghToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'HKC-Camera-Studio'
        },
        body: JSON.stringify({
          message: `upload: ${mediaType} ${filename} [HKC Camera]`,
          content: bodyBuffer.toString('base64'),
          branch: 'main'
        })
      });

      if (ghUploadRes.ok) {
        cloudSynced = true;
        directUrl = `https://raw.githubusercontent.com/${repo}/main/${targetPath}`;
        thumbUrl = thumbBase64 ? `data:image/jpeg;base64,${thumbBase64}` : directUrl;
      }
    }

    if (!directUrl) {
      // Fallback base64 data URL for instant display
      directUrl = `data:${mimeType};base64,${bodyBuffer.toString('base64')}`;
      thumbUrl = thumbBase64 ? `data:image/jpeg;base64,${thumbBase64}` : directUrl;
    }

    const record = {
      id,
      filename,
      type: mediaType,
      url: directUrl,
      thumbnailUrl: thumbUrl,
      width,
      height,
      fps,
      duration,
      aspectRatio,
      fileSize: bodyBuffer.length,
      mimeType,
      timestamp: Date.now(),
      captureDate: now.toISOString().split('T')[0],
      captureTime: now.toTimeString().split(' ')[0],
      createdAt: now.toISOString(),
      cloudSynced
    };

    return res.status(200).json({
      success: true,
      item: record,
      cloudSynced
    });
  } catch (err) {
    console.error('Upload handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
