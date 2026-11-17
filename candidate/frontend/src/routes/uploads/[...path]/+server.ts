import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

// The request headers that go through to the API. Range lets a browser stream and seek a video (Safari won't play
// one at all without range requests); the validators let an unchanged file answer 304.
const FORWARD = ['range', 'if-range', 'if-none-match', 'if-modified-since'];

// Proxy static uploads (images, logos, videos) from the API server to the browser
export const GET: RequestHandler = async ({ params, request }) => {
  const headers: Record<string, string> = {};
  for (const name of FORWARD) {
    const value = request.headers.get(name);
    if (value) headers[name] = value;
  }
  return fetch(`${API_URL}/uploads/${params.path}`, { headers });
};
