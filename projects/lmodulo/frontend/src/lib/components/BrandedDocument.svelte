<script lang="ts">
  import { m } from '$lib/paraglide/messages.js';

  let {
    brandName = '',
    brandLogo = '',
    title     = '',
    children,
    footer,
  }: {
    brandName?: string;
    brandLogo?: string;
    title?:     string;
    children?:  import('svelte').Snippet;
    footer?:    import('svelte').Snippet;
  } = $props();
</script>

<svelte:head>
  {#if title}<title>{title}</title>{/if}
</svelte:head>

<!-- Screen wrapper — A4-ish card on a neutral background -->
<div class="min-h-screen bg-base-200 flex flex-col items-center py-8 px-4 no-print:py-8">

  <!-- Print button (screen only) -->
  <div class="no-print w-full max-w-[794px] flex justify-end mb-3">
    <button
      type="button"
      onclick={() => window.print()}
      class="btn btn-sm btn-ghost gap-2 text-base-content/60 hover:text-base-content"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      {m.branded_doc_print()}
    </button>
  </div>

  <!-- Document card -->
  <div class="w-full max-w-[794px] bg-white shadow-md rounded-sm overflow-hidden">

    <!-- Brand header -->
    <header class="px-10 py-12 flex flex-col items-center gap-2 border-b border-gray-100 bg-base-300">
      {#if brandLogo}
        <img src={brandLogo} alt={brandName || title || 'Logo'} style="height:48px;width:auto;max-width:240px;" />
      {:else if brandName}
        <span class="text-xl font-semibold text-gray-800">{brandName}</span>
      {:else if title}
        <span class="text-xl font-semibold text-gray-800">{title}</span>
      {/if}
    </header>

    <!-- Document content -->
    <main class="px-10 py-10">
      {@render children?.()}
    </main>

    <!-- Footer -->
    <footer class="px-10 py-6 border-t border-gray-100 text-center text-xs text-gray-400">
      {#if footer}
        {@render footer()}
      {:else if brandName}
        {brandName}
      {/if}
    </footer>

  </div>
</div>

<style>
  @media print {
    @page {
      size: A4;
      margin: 15mm 15mm 15mm 15mm;
    }

    :global(body),
    :global(html) {
      background: white !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    /* Hide screen-only elements */
    :global(.no-print) {
      display: none !important;
    }

    /* Remove card styling for print */
    .bg-base-200 {
      background: white !important;
      padding: 0 !important;
    }

    .bg-base-300 {
      background: white !important;
    }

    .shadow-md,
    .shadow-sm,
    .shadow {
      box-shadow: none !important;
    }

    .rounded-sm {
      border-radius: 0 !important;
    }
  }
</style>
