import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const OLLAMA_URL = env.OLLAMA_URL ?? 'http://localhost:11434';

export const POST: RequestHandler = async ({ request }) => {
  const { model, messages } = await request.json();

  let res: Response;
  try {
    res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: false })
    });
  } catch {
    throw error(503, 'Ollama is not reachable. Make sure it is running.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw error(res.status, (data as { error?: string }).error ?? 'Ollama error');
  return json({ message: (data as { message: unknown }).message });
};
