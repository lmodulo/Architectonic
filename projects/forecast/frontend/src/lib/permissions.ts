export type Action = 'create' | 'read' | 'update' | 'delete';

export interface UserWithPermissions {
  id:          string;
  username:    string;
  email:       string;
  firstName?:  string;
  lastName?:   string;
  role:        string;
  permissions: Record<string, Record<Action, boolean>>;
}

/** Pure helper — safe to call in hooks, +page.server.ts, and Svelte templates. */
export function hasPermission(
  user:     UserWithPermissions | null | undefined,
  resource: string,
  action:   Action
): boolean {
  return user?.permissions?.[resource]?.[action] === true;
}
