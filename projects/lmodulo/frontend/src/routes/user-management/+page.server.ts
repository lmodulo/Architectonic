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
    const canInvite = hasPermission(locals.user, 'users', 'create');
    const [usersRes, rolesRes, teamsRes] = await Promise.all([
      canReadUsers ? fetch(`${API_URL}/users?limit=20&skip=0`, { headers }) : Promise.resolve(null),
      (canReadRoles || canInvite) ? fetch(`${API_URL}/roles`, { headers }) : Promise.resolve(null),
      canReadTeams ? fetch(`${API_URL}/teams?limit=20&skip=0`, { headers }) : Promise.resolve(null),
    ]);
    const usersData = usersRes?.ok  ? await usersRes.json()  : { users: [], total: 0 };
    const teamsData = teamsRes?.ok  ? await teamsRes.json()  : { teams: [], total: 0 };
    return {
      users:         usersData.users  ?? [],
      usersTotal:    usersData.total  ?? 0,
      roles:         rolesRes?.ok ? await rolesRes.json() : [],
      teams:         teamsData.teams  ?? [],
      teamsTotal:    teamsData.total  ?? 0,
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
      users: [], usersTotal: 0, roles: [], teams: [], teamsTotal: 0,
      canReadUsers, canReadRoles, canReadTeams,
      canCreate: false, canUpdate: false, canDelete: false, canAssign: false,
      canCreateTeam: false, canUpdateTeam: false, canDeleteTeam: false,
      error: 'Cannot reach the API server'
    };
  }
};
