// See https://kit.svelte.dev/docs/types#app
import type { UserWithPermissions } from '$lib/permissions';

declare global {
  namespace App {
    interface Locals {
      user: UserWithPermissions | null;
      theme?: string; // set by the root +layout.server.ts load, written into <html data-theme>
    }
    interface PageData {
      user?: UserWithPermissions | null;
    }
    // interface Error {}
    // interface Platform {}
  }
}

export {};
