import { redirect, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { hasPermission } from '$lib/permissions';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies, params }) => {
  if (!hasPermission(locals.user, 'vault_documents', 'read')) redirect(303, '/403');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const [docRes, versionsRes, foldersRes, usersRes] = await Promise.all([
    fetch(`${API_URL}/vault/documents/${params.docId}`, { headers }),
    fetch(`${API_URL}/vault/documents/${params.docId}/versions`, { headers }),
    fetch(`${API_URL}/vault/folders`, { headers }),
    fetch(`${API_URL}/users`, { headers })
  ]);

  if (!docRes.ok) error(docRes.status === 404 ? 404 : 500, 'Document not found');

  const doc      = await docRes.json();
  const versions = versionsRes.ok ? await versionsRes.json() : { versions: [], currentVersionId: null };
  const folders  = foldersRes.ok ? await foldersRes.json() : [];
  const users    = usersRes.ok   ? await usersRes.json()   : [];

  return { doc, versions, folders, users };
};
