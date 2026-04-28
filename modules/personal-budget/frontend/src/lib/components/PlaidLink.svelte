<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    label?:     string;
    onSuccess?: (publicToken: string, metadata: unknown) => void;
    onExit?:    () => void;
    class?:     string;
  }

  let { label = 'Connect Bank', onSuccess, onExit, class: cls = '' }: Props = $props();

  let loading  = $state(false);
  let plaidReady = $state(false);

  onMount(() => {
    if (typeof window === 'undefined') return;
    if ((window as Record<string, unknown>).Plaid) { plaidReady = true; return; }

    const script  = document.createElement('script');
    script.src    = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
    script.async  = true;
    script.onload = () => { plaidReady = true; };
    document.head.appendChild(script);
  });

  async function open() {
    if (!plaidReady) return;
    loading = true;

    try {
      const res  = await fetch('/api/budget/plaid/link-token', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.linkToken) throw new Error(data.message ?? 'Failed to get link token');

      const Plaid = (window as Record<string, unknown>).Plaid as {
        create: (cfg: Record<string, unknown>) => { open: () => void };
      };

      const handler = Plaid.create({
        token:     data.linkToken,
        onSuccess: async (publicToken: string, metadata: unknown) => {
          const exRes = await fetch('/api/budget/plaid/exchange', {
            method:  'POST',
            headers: { 'content-type': 'application/json' },
            body:    JSON.stringify({ publicToken }),
          });
          const exData = await exRes.json();
          loading = false;
          if (onSuccess) onSuccess(exData, metadata);
        },
        onExit: () => {
          loading = false;
          if (onExit) onExit();
        },
        onLoad:  () => {},
        onEvent: () => {},
      });

      handler.open();
    } catch (err) {
      console.error('[PlaidLink]', err);
      loading = false;
    }
  }
</script>

<button
  type="button"
  onclick={open}
  disabled={loading || !plaidReady}
  class={cls}
>
  {#if loading}
    Connecting…
  {:else}
    {label}
  {/if}
</button>
