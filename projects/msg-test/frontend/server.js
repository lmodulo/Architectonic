// Production entry point (the Dockerfile runs `node server.js`).
//
// It starts adapter-node's own server unchanged (build/index.js: PORT, HOST, ORIGIN, ADDRESS_HEADER, graceful
// shutdown and the rest all behave as documented) and adds one thing adapter-node doesn't do: it passes the
// notifications websocket, /notifications/ws, through to the API. In dev, Vite's proxy does the same job
// (vite.config.ts), so this file isn't used there.
//
// Like every other server-side call to the API, the upgrade carries INTERNAL_API_SECRET and the visitor's
// address, so the API's rate limit counts each visitor separately (see src/lib/server/api-identity.ts).
import http from 'node:http';
import { server } from './build/index.js';

const API_URL        = process.env.API_URL ?? 'http://localhost:4000';
const SECRET         = process.env.INTERNAL_API_SECRET ?? '';
const ORIGIN         = process.env.ORIGIN ?? '';
const ADDRESS_HEADER = (process.env.ADDRESS_HEADER ?? '').toLowerCase();
const XFF_DEPTH      = parseInt(process.env.XFF_DEPTH ?? '1', 10);
const SOCKET_PATH    = '/notifications/ws';

/** The visitor's address, worked out the way adapter-node's getClientAddress() does. */
function visitorAddress(req) {
  if (!ADDRESS_HEADER) return req.socket.remoteAddress ?? 'unknown';
  const value = req.headers[ADDRESS_HEADER];
  if (typeof value !== 'string' || !value) return 'unknown';
  if (ADDRESS_HEADER !== 'x-forwarded-for') return value.trim();
  const addresses = value.split(',');
  return XFF_DEPTH >= 1 && XFF_DEPTH <= addresses.length ? addresses[addresses.length - XFF_DEPTH].trim() : 'unknown';
}

function refuse(socket, status, text) {
  socket.end(`HTTP/1.1 ${status} ${text}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
}

// Open sockets, closed on shutdown so adapter-node's graceful shutdown isn't held up by them
const open = new Set();

server.server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname !== SOCKET_PATH) return refuse(socket, 404, 'Not Found');
  // Browsers always send Origin on a websocket handshake; a page on another site may not open this one
  if (ORIGIN && req.headers.origin && req.headers.origin !== ORIGIN) return refuse(socket, 403, 'Forbidden');

  const target = new URL(SOCKET_PATH + url.search, API_URL);
  const headers = { ...req.headers, host: target.host };
  delete headers['x-internal-secret'];
  delete headers['x-client-ip'];
  if (SECRET) {
    headers['x-internal-secret'] = SECRET;
    headers['x-client-ip'] = visitorAddress(req);
  }

  const upstream = http.request(target, { method: 'GET', headers });

  upstream.on('upgrade', (res, apiSocket, apiHead) => {
    // Relay the API's 101 response as is, then join the two sockets
    const lines = [`HTTP/1.1 ${res.statusCode} ${res.statusMessage}`];
    for (let i = 0; i < res.rawHeaders.length; i += 2) lines.push(`${res.rawHeaders[i]}: ${res.rawHeaders[i + 1]}`);
    socket.write(lines.join('\r\n') + '\r\n\r\n');
    if (apiHead?.length) socket.write(apiHead);
    if (head?.length) apiSocket.write(head);

    const close = () => {
      open.delete(socket);
      socket.destroy();
      apiSocket.destroy();
    };
    open.add(socket);
    socket.on('error', close).on('close', close);
    apiSocket.on('error', close).on('close', close);
    apiSocket.pipe(socket).pipe(apiSocket);
  });

  // The API answered without upgrading (for example 429): pass the status on
  upstream.on('response', (res) => {
    res.resume();
    refuse(socket, res.statusCode ?? 502, res.statusMessage || 'Bad Gateway');
  });
  upstream.on('error', () => refuse(socket, 502, 'Bad Gateway'));
  socket.on('error', () => upstream.destroy());
  upstream.end();
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    for (const socket of open) socket.destroy();
    open.clear();
  });
}
