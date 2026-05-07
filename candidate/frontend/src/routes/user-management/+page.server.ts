import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { hasPermission } from '$lib/permissions';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  const canReadUsers = hasPermission(locals.user, 'users', 'read');
  const canReadRoles = hasPermission(locals.user, 'roles', 'read');

  if (!canReadUsers && !canReadRoles) redirect(303, '/403');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  try {
    const [usersRes, rolesRes] = await Promise.all([
      fetch(`${API_URL}/users`, { headers }),
      fetch(`${API_URL}/roles`, { headers })
    ]);
    return {
      users:       usersRes.ok ? await usersRes.json() : [],
      roles:       rolesRes.ok ? await rolesRes.json() : [],
      canReadUsers,
      canReadRoles,
      canCreate:   hasPermission(locals.user, 'roles', 'create'),
      canUpdate:   hasPermission(locals.user, 'roles', 'update'),
      canDelete:   hasPermission(locals.user, 'roles', 'delete'),
      canAssign:   hasPermission(locals.user, 'users', 'update'),
      error:       null
    };
  } catch {
    return {
      users: [], roles: [],
      canReadUsers, canReadRoles,
      canCreate: false, canUpdate: false, canDelete: false, canAssign: false,
      error: 'Cannot reach the API server'
    };
  }
};
