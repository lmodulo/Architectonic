import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// Proxy requests to the Fastify API.
// API_URL is set in docker-compose.yml (http://api:4000).
// Falls back to localhost for local dev outside Docker.

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const GET: RequestHandler = async ({ fetch }) => {
	const res = await fetch(`${API_URL}/health`);
	const data = await res.json();
	return new Response(JSON.stringify(data), {
		headers: { 'content-type': 'application/json' }
	});
};
