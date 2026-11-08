import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const backendApiUrl = 'https://acid-grit-handed.ngrok-free.dev/BSSMS-back/api';
const responseHeadersToSkip = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'transfer-encoding',
]);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const pathSegments = Array.isArray(req.query.path)
    ? req.query.path
    : [req.query.path].filter(Boolean);
  const queryIndex = req.url.indexOf('?');
  const query = queryIndex === -1 ? '' : req.url.slice(queryIndex);
  const targetUrl = `${backendApiUrl}/${pathSegments
    .map((segment) => encodeURIComponent(segment))
    .join('/')}${query}`;

  const headers = new Headers(req.headers);
  headers.delete('connection');
  headers.delete('content-length');
  headers.delete('host');
  headers.delete('transfer-encoding');
  headers.set('ngrok-skip-browser-warning', '1');

  try {
    const shouldSendBody = !['GET', 'HEAD'].includes(req.method);
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      ...(shouldSendBody ? { body: req, duplex: 'half' } : {}),
    });

    res.statusCode = response.status;
    response.headers.forEach((value, name) => {
      if (!responseHeadersToSkip.has(name.toLowerCase())) {
        res.setHeader(name, value);
      }
    });

    if (response.body) {
      await pipeline(Readable.fromWeb(response.body), res);
    } else {
      res.end();
    }
  } catch (error) {
    console.error('Backend API proxy request failed:', error);
    if (res.headersSent) {
      res.destroy(error);
    } else {
      res.status(502).json({ error: 'Backend API is unavailable.' });
    }
  }
}
