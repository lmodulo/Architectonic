// See https://kit.svelte.dev/docs/types#app
import type { UserWithPermissions } from '$lib/permissions';

declare global {
  namespace App {
    interface Locals {
      user: UserWithPermissions | null;
    }
    interface PageData {
      user?: UserWithPermissions | null;
    }
    // interface Error {}
    // interface Platform {}
  }
}

export {};
