import { navItems, isNavGroup, isSeparator, type NavItem } from '$lib/config/nav';
import { isCustomerRoute } from '$lib/config/route-rules';
import { hasPermission, type Action, type UserWithPermissions } from '$lib/permissions';

/**
 * Where a signed-in customer lands (after login, or when bounced off a staff page): the first
 * `customerOnly` nav item they have permission for and may open (a `customer` or `public`
 * route rule). Modules add these items and rules, so with no portal module installed this is '/'.
 */
export function customerHome(user: UserWithPermissions): string {
  const item = navItems.find((entry): entry is NavItem =>
    !isSeparator(entry) && !isNavGroup(entry) &&
    entry.customerOnly === true &&
    isCustomerRoute(entry.href) &&
    (!entry.permission || hasPermission(user, entry.permission.resource, entry.permission.action as Action))
  );
  return item?.href ?? '/';
}
