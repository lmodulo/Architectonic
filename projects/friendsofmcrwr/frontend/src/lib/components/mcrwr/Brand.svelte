<script lang="ts">
  // The header lockup: the emblem from the logo plus the name as live text. At header size the full logo's own
  // lettering would be a few pixels tall, so the words are set in the site's serif instead. `tone`: 'dark'
  // (black emblem, ink text) for light backgrounds; 'light' (white emblem and text) over photos.
  import { SITE } from './site';

  let { tone = 'dark' }: { tone?: 'dark' | 'light' } = $props();
</script>

<a href="/" class="group inline-flex items-center gap-2.5 min-w-0 shrink-0 rounded-field outline-offset-4">
  {#if tone === 'light'}
    <img src="/brand/emblem-white.png" alt="" width="206" height="192" class="h-11 sm:h-12 w-auto shrink-0" />
  {:else}
    <img src="/brand/emblem-black.png" alt="" width="203" height="192" class="h-11 sm:h-12 w-auto shrink-0" />
  {/if}
  <span class="font-[family-name:var(--display)] font-semibold leading-[1.08] text-[0.9rem] sm:text-[1.02rem] tracking-[-0.005em]">
    <span class="block whitespace-nowrap">{SITE.wordmark[0]}</span>
    <span class="block whitespace-nowrap">{SITE.wordmark[1]}</span>
  </span>
  <span class="sr-only">, home</span>
</a>
