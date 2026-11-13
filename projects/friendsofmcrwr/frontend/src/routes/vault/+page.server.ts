import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { hasPermission } from '$lib/permissions';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!hasPermission(locals.user, 'vault_documents', 'read')) redirect(303, '/403');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const [foldersRes, docsRes, usersRes] = await Promise.all([
    fetch(`${API_URL}/vault/folders`, { headers }),
    fetch(`${API_URL}/vault/documents?limit=50`, { headers }),
    fetch(`${API_URL}/users`, { headers })
  ]);

  const folders   = foldersRes.ok  ? await foldersRes.json()  : [];
  const { documents = [], total = 0 } = docsRes.ok ? await docsRes.json() : {};
  const users     = usersRes.ok    ? await usersRes.json()    : [];

  return { folders, documents, total, users };
};
