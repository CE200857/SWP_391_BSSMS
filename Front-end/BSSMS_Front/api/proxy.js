import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const backendApiUrl = (process.env.BACKEND_API_URL || 'https://acid-grit-handed.ngrok-free.dev/BSSMS-back/api').replace(/\/+$/, '');
const backendPath = new URL(backendApiUrl).pathname.replace(/\/api$/, '') || '/';
const requestHeadersToSkip = ['connection', 'content-length', 'host', 'transfer-encoding', 'accept-encoding'];
const responseHeadersToSkip = new Set(['connection', 'content-encoding', 'content-length', 'transfer-encoding', 'set-cookie']);

function rewriteCookie(cookie) {
  return cookie
    .replace(/;\s*Path=[^;]*/i, '')
    .replace(/;\s*Domain=[^;]*/i, '')
    .concat('; Path=/');
}

function rewriteLocation(location) {
  if (!location) return location;
  try {
    const url = new URL(location, backendApiUrl);
    const backend = new URL(backendApiUrl);
    if (url.host === backend.host && url.pathname.startsWith(backendPath)) {
      return url.pathname.slice(backendPath.length) + url.search;
    }
  } catch {
    return location;
  }
  return location;
}

export default async function handler(req, res) {
  const queryIndex = req.url.indexOf('?');
  const params = new URLSearchParams(queryIndex === -1 ? '' : req.url.slice(queryIndex + 1));
  let pathname = (queryIndex === -1 ? req.url : req.url.slice(0, queryIndex)).replace(/^\/api\/?/, '');
  if (!pathname || pathname === 'proxy' || pathname.startsWith('proxy/') || pathname.includes('[...path]')) {
    const raw = req.query?.path ?? params.get('path');
    pathname = Array.isArray(raw) ? raw.join('/') : String(raw || '');
  }
  params.delete('path');
  params.delete('...path');
  const pathSegments = pathname.split('/').filter(Boolean).map(decodeURIComponent);
  const query = params.toString();
  const targetUrl = `${backendApiUrl}/${pathSegments.map(encodeURIComponent).join('/')}${query ? `?${query}` : ''}`;

  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (value === undefined || requestHeadersToSkip.includes(name.toLowerCase())) continue;
    headers.set(name, Array.isArray(value) ? value.join(', ') : value);
  }
  headers.set('ngrok-skip-browser-warning', '1');

  try {
    const shouldSendBody = !['GET', 'HEAD'].includes(req.method);
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      redirect: 'manual',
      ...(shouldSendBody ? { body: Readable.toWeb(req), duplex: 'half' } : {}),
    });

    res.statusCode = response.status;
    response.headers.forEach((value, name) => {
      const key = name.toLowerCase();
      if (responseHeadersToSkip.has(key)) return;
      res.setHeader(name, key === 'location' ? rewriteLocation(value) : value);
    });
    const cookies = typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
    if (cookies.length) res.setHeader('Set-Cookie', cookies.map(rewriteCookie));

    const type = response.headers.get('content-type') || '';
    if (type.includes('text/html') && response.status === 200 && /ngrok/i.test(backendApiUrl)) {
      const text = await response.text();
      if (/ngrok/i.test(text)) {
        res.statusCode = 502;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ message: 'ngrok trả về trang HTML thay vì API: kiểm tra ngrok và Tomcat trên máy chủ.' }));
        return;
      }
      res.end(text);
      return;
    }

    if (response.body && req.method !== 'HEAD') {
      await pipeline(Readable.fromWeb(response.body), res);
    } else {
      res.end();
    }
  } catch (error) {
    console.error('Backend API proxy request failed:', targetUrl, error);
    if (res.headersSent) {
      res.destroy(error);
    } else {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ message: 'Không kết nối được back-end qua ngrok. Hãy bật Tomcat và ngrok trên máy chủ rồi thử lại.' }));
    }
  }
}
