// See https://kit.svelte.dev/docs/types#app
declare global {
  namespace App {
    interface Locals {
      user: { id: string; username: string; email: string } | null;
    }
    interface PageData {
      user?: { id: string; username: string; email: string } | null;
    }
    // interface Error {}
    // interface Platform {}
  }
}

export {};
