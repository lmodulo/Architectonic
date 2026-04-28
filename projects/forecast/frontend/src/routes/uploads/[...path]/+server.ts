import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

// Proxy static uploads (images, logos) from the API server to the browser
export const GET: RequestHandler = async ({ params }) => {
  return fetch(`${API_URL}/uploads/${params.path}`);
};
