// Stub — mirrors example/frontend/src/lib/permissions.ts
// Real implementation is provided by the scaffold when this module is installed.

export type Action = 'create' | 'read' | 'update' | 'delete';

export interface UserWithPermissions {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  permissions: Record<string, Record<Action, boolean>>;
}

export function hasPermission(
  user: UserWithPermissions | null | undefined,
  resource: string,
  action: Action
): boolean {
  return user?.permissions?.[resource]?.[action] === true;
}
