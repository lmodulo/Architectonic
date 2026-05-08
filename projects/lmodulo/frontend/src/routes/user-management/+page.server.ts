import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { hasPermission } from '$lib/permissions';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  const canReadUsers = hasPermission(locals.user, 'users', 'read');
  const canReadRoles = hasPermission(locals.user, 'roles', 'read');
  const canReadTeams = hasPermission(locals.user, 'teams', 'read');

  if (!canReadUsers && !canReadRoles && !canReadTeams) redirect(303, '/403');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  try {
    const [usersRes, rolesRes, teamsRes] = await Promise.all([
      canReadUsers ? fetch(`${API_URL}/users`, { headers }) : Promise.resolve(null),
      canReadRoles ? fetch(`${API_URL}/roles`, { headers }) : Promise.resolve(null),
      canReadTeams ? fetch(`${API_URL}/teams`, { headers }) : Promise.resolve(null),
    ]);
    return {
      users:         usersRes?.ok  ? await usersRes.json()  : [],
      roles:         rolesRes?.ok  ? await rolesRes.json()  : [],
      teams:         teamsRes?.ok  ? await teamsRes.json()  : [],
      canReadUsers,
      canReadRoles,
      canReadTeams,
      canCreate:     hasPermission(locals.user, 'roles', 'create'),
      canUpdate:     hasPermission(locals.user, 'roles', 'update'),
      canDelete:     hasPermission(locals.user, 'roles', 'delete'),
      canAssign:     hasPermission(locals.user, 'users', 'update'),
      canCreateTeam: hasPermission(locals.user, 'teams', 'create'),
      canUpdateTeam: hasPermission(locals.user, 'teams', 'update'),
      canDeleteTeam: hasPermission(locals.user, 'teams', 'delete'),
      error:         null
    };
  } catch {
    return {
      users: [], roles: [], teams: [],
      canReadUsers, canReadRoles, canReadTeams,
      canCreate: false, canUpdate: false, canDelete: false, canAssign: false,
      canCreateTeam: false, canUpdateTeam: false, canDeleteTeam: false,
      error: 'Cannot reach the API server'
    };
  }
};
