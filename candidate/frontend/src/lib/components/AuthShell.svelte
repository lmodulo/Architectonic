<script lang="ts">
  import type { Snippet, SvelteComponent } from 'svelte';
  import type { IconProps } from 'lucide-svelte';
  import { LogIn } from 'lucide-svelte';
  import Logo from './Logo.svelte';
  import PageHeader from './PageHeader.svelte';
  import { APP_FONTS } from '$lib/config/theme';
  import { m } from '$lib/paraglide/messages.js';

  // Shell for the signed-out account pages (sign in, register, password reset, invites). It is built
  // from the app shell's parts (top bar, PageHeader banner, base-200 card) and uses only theme colors,
  // so these pages follow Settings → Theme and look like the rest of the app.
  let { children, title, subtitle, icon = LogIn, brandName, brandLogo }: {
    children: Snippet;
    title: string;
    subtitle?: string;
    icon?: typeof SvelteComponent<IconProps>; // a lucide-svelte icon, as in PageHeader
    brandName?: string | null;
    brandLogo?: string | null;
  } = $props();

  // Same font variables the app shell sets (see routes/+layout.svelte)
  const fontVars = [
    `--display:'${APP_FONTS.display.family}',${APP_FONTS.display.fallback}`,
    `--body:'${APP_FONTS.body.family}',${APP_FONTS.body.fallback}`,
    `--mono:'${APP_FONTS.mono.family}',${APP_FONTS.mono.fallback}`,
  ].join(';');
</script>

<div style={fontVars} class="min-h-svh flex flex-col bg-base-100 text-base-content">

  <!-- Top bar, as in the app shell -->
  <header class="flex items-center gap-3 px-4 h-16 shrink-0 bg-base-200 rounded-br-xl">
    <a href="/" class="flex items-center no-underline text-inherit" aria-label={m.marketing_nav_home()}>
      {#if brandName || brandLogo}
        <Logo brandName={brandName ?? ''} brandLogo={brandLogo ?? ''} />
      {:else}
        <span class="text-xl font-semibold">{m.auth_shell_application()}</span>
      {/if}
    </a>
  </header>

  <!-- overflow-x-hidden clips the full-bleed PageHeader banner, as the app shell's <main> does -->
  <main class="flex-1 overflow-x-hidden">
    <div class="mx-auto w-full max-w-md px-6 pb-10 space-y-6 page-content">
      <PageHeader {icon} {title} {subtitle} />

      <div class="card bg-base-200 border border-base-300 rounded-box p-6 flex flex-col gap-4">
        {@render children()}
      </div>
    </div>
  </main>

</div>
