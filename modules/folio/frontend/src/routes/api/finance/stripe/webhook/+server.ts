import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const POST: RequestHandler = async ({ request }) => {
  const rawBody = await request.arrayBuffer();
  const sig     = request.headers.get('stripe-signature') ?? '';
  let res: Response;
  try {
    res = await fetch(`${API_URL}/finance/stripe/webhook`, {
      method:  'POST',
      headers: {
        'content-type':    'application/octet-stream',
        'stripe-signature': sig,
      },
      body: rawBody,
    });
  } catch { throw error(503, 'Cannot reach the API server'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw error(res.status, (data as { message?: string }).message ?? 'Failed');
  return new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json' } });
};
