<script lang="ts">
  import { CORE_DOCS, MODULE_DOCS, docsHref } from '$lib/config/docs';

  const guide = CORE_DOCS.filter(d => d.slug !== '');
</script>

<svelte:head>
  <title>Documentation</title>
</svelte:head>

<div class="space-y-10">

  <div class="space-y-3">
    <h1 class="text-3xl font-bold">Documentation</h1>
    <p class="text-lg opacity-70 leading-relaxed max-w-2xl">
      A full-stack SvelteKit + Fastify application with authentication, role-based access control,
      workspaces, in-app messaging, automation, and an AI assistant — extended by feature modules.
      This guide covers how it works, how to run it, and every installed module.
    </p>
  </div>

  <section class="space-y-4">
    <h2 class="text-xl font-semibold">Guide</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {#each guide as doc (doc.slug)}
        <a href={docsHref(doc.slug)} class="card bg-base-200 border border-base-300 rounded-box p-4 flex flex-row items-start gap-3 hover:border-primary/40 transition-colors">
          <doc.icon class="size-5 shrink-0 mt-0.5 opacity-70" />
          <span class="space-y-1">
            <span class="block text-sm font-semibold">{doc.label}</span>
            {#if doc.description}<span class="block text-sm opacity-60 leading-relaxed">{doc.description}</span>{/if}
          </span>
        </a>
      {/each}
    </div>
  </section>

  {#if MODULE_DOCS.length > 0}
    <section class="space-y-4">
      <div class="space-y-1">
        <h2 class="text-xl font-semibold">Modules</h2>
        <p class="text-sm opacity-60">Feature modules installed in this project.</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {#each MODULE_DOCS as doc (doc.slug)}
          <a href={docsHref(doc.slug)} class="card bg-base-200 border border-base-300 rounded-box p-4 flex flex-row items-start gap-3 hover:border-primary/40 transition-colors">
            <doc.icon class="size-5 shrink-0 mt-0.5 opacity-70" />
            <span class="space-y-1">
              <span class="block text-sm font-semibold">{doc.label}</span>
              {#if doc.description}<span class="block text-sm opacity-60 leading-relaxed">{doc.description}</span>{/if}
            </span>
          </a>
        {/each}
      </div>
    </section>
  {/if}

</div>
