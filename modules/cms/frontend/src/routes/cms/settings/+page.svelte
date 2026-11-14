<script lang="ts">
  // Site settings: which page is the home page, and the footer's text and links.
  import { untrack } from 'svelte';
  import { slide, fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { ArrowUp, ArrowDown, Trash2, Plus, Check } from 'lucide-svelte';
  import { page } from '$app/state';
  import { hasPermission } from '$lib/permissions';
  import { cmsApi, linkProblem, linkTargets, plain } from '$lib/cms/admin';
  import { ms } from '$lib/cms/motion';
  import LinkPicker from '$lib/components/cms/admin/LinkPicker.svelte';
  import type { CmsSettings, FooterLink } from '$lib/cms/types';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const canEdit = untrack(() => hasPermission(page.data.user, 'cms_nodes', 'update'));
  const nodes = untrack(() => data.nodes);
  const MAX_LINKS = 20;

  // Home page candidates: pages only, in tree order
  const pages = linkTargets(nodes).filter(t => nodes.find(n => n.id === t.id)?.type === 'page');

  interface Form { homeNodeId: string; text: string; links: FooterLink[] }
  const fromSettings = (s: CmsSettings | null): Form => ({
    homeNodeId: s?.homeNodeId ?? '',
    text: s?.footer.text ?? '',
    // newTab always present: bind:checked would otherwise fill it in and mark the form edited
    links: plain(s?.footer.links ?? []).map(l => ({ ...l, newTab: l.newTab === true })),
  });
  let saved = $state(untrack(() => fromSettings(data.settings)));
  let form = $state(untrack(() => fromSettings(data.settings)));
  const dirty = $derived(JSON.stringify(form) !== JSON.stringify(saved));
  const linkErrors = $derived(form.links.map(l => (!l.label.trim() ? 'Add a label.' : null) ?? linkProblem(l.link, nodes)));
  const valid = $derived(linkErrors.every(e => !e));
  const home = $derived(nodes.find(n => n.id === form.homeNodeId));

  let saving = $state(false);
  let error = $state('');
  let savedNote = $state(false);
  let noteTimer: ReturnType<typeof setTimeout> | undefined;

  function addLink() {
    const first = linkTargets(nodes)[0];
    form.links.push({ label: '', link: first ? { nodeId: first.id } : { url: '' } });
  }
  function move(i: number, d: -1 | 1) {
    const [l] = form.links.splice(i, 1);
    form.links.splice(i + d, 0, l);
  }

  async function save(e: SubmitEvent) {
    e.preventDefault();
    if (!dirty || !valid || !canEdit) return;
    saving = true;
    error = '';
    const body = {
      homeNodeId: form.homeNodeId || null,
      footer: {
        text: form.text,
        links: form.links.map(l => ({ label: l.label.trim(), link: l.link, ...(l.newTab ? { newTab: true } : {}) })),
      },
    };
    const res = await cmsApi<CmsSettings>('settings', { method: 'PATCH', body });
    saving = false;
    if (!res.ok || !res.data) { error = res.message; return; }
    saved = fromSettings(res.data);
    form = fromSettings(res.data);
    savedNote = true;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => (savedNote = false), 3000);
  }
</script>

<svelte:head><title>Content · Settings</title></svelte:head>

{#if data.loadFailed}
  <div role="alert" class="alert alert-error text-sm">The settings could not be loaded. Reload the page to try again.</div>
{:else}
  <form class="flex flex-col gap-8 max-w-2xl" onsubmit={save}>
    <section class="flex flex-col gap-3" aria-labelledby="cms-home-heading">
      <div class="flex items-center gap-2">
        <span class="w-0.5 h-4 rounded-full bg-primary"></span>
        <h2 id="cms-home-heading" class="text-sm font-semibold">Home page</h2>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium" for="cms-home">The page shown at the site's address (/)</label>
        <select id="cms-home" class="select select-sm w-full max-w-md" bind:value={form.homeNodeId} disabled={!canEdit}>
          <option value="">None: show the default home page</option>
          {#each pages as p (p.id)}
            <option value={p.id}>{p.label}{p.visible ? '' : ' (not published)'}</option>
          {/each}
        </select>
        {#if home && !home.visible}
          <p class="text-xs text-warning" transition:slide={{ duration: ms(200) }}>This page isn't published yet. Until it is, visitors see the default home page.</p>
        {/if}
        {#if !pages.length}
          <p class="text-xs opacity-60">Add a page in the site tree first.</p>
        {/if}
      </div>
    </section>

    <section class="flex flex-col gap-3" aria-labelledby="cms-footer-heading">
      <div class="flex items-center gap-2">
        <span class="w-0.5 h-4 rounded-full bg-primary"></span>
        <h2 id="cms-footer-heading" class="text-sm font-semibold">Footer</h2>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium" for="cms-footer-text">Text</label>
        <textarea id="cms-footer-text" class="textarea textarea-sm w-full" rows="3" bind:value={form.text} maxlength="1000" disabled={!canEdit}></textarea>
        <span class="text-xs opacity-60">Shown at the bottom of every page, for example an address or a charity number.</span>
      </div>

      <div class="flex flex-col gap-2">
        <span class="text-sm font-medium">Links</span>
        {#if !form.links.length}
          <p class="text-xs opacity-60" transition:slide={{ duration: ms(200) }}>No footer links yet.</p>
        {/if}
        <ul class="flex flex-col gap-2">
          {#each form.links as link, i (link)}
            <li class="rounded-box border border-base-300 bg-base-200/40 p-3 flex flex-col gap-3" animate:flip={{ duration: ms(200) }} transition:slide={{ duration: ms(200) }}>
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold opacity-60">Link {i + 1}</span>
                <span class="flex-1"></span>
                {#if canEdit}
                  <button type="button" class="btn btn-ghost btn-xs btn-square" aria-label="Move link {i + 1} up" disabled={i === 0} onclick={() => move(i, -1)}><ArrowUp class="size-3.5" /></button>
                  <button type="button" class="btn btn-ghost btn-xs btn-square" aria-label="Move link {i + 1} down" disabled={i === form.links.length - 1} onclick={() => move(i, 1)}><ArrowDown class="size-3.5" /></button>
                  <button type="button" class="btn btn-ghost btn-xs btn-square text-error" aria-label="Remove link {i + 1}" onclick={() => form.links.splice(i, 1)}><Trash2 class="size-3.5" /></button>
                {/if}
              </div>
              <div class="grid gap-3 sm:grid-cols-2">
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-medium" for="cms-fl-{i}">Label</label>
                  <input id="cms-fl-{i}" class="input input-sm w-full" bind:value={link.label} maxlength="80" disabled={!canEdit} aria-invalid={!link.label.trim()} />
                  {#if !link.label.trim()}<p class="text-xs text-error" transition:slide={{ duration: ms(200) }}>Add a label.</p>{/if}
                </div>
                <div class="flex flex-col gap-2">
                  <LinkPicker link={link.link} {nodes} disabled={!canEdit} onchange={l => (link.link = l)} />
                  <label class="flex items-center gap-2 text-sm cursor-pointer w-fit">
                    <input type="checkbox" class="checkbox checkbox-sm" bind:checked={link.newTab} disabled={!canEdit} /> Open in a new tab
                  </label>
                </div>
              </div>
            </li>
          {/each}
        </ul>
        {#if canEdit}
          <button type="button" class="btn btn-sm btn-outline w-fit" disabled={form.links.length >= MAX_LINKS} onclick={addLink}><Plus class="size-4" />Add a link</button>
        {/if}
      </div>
    </section>

    {#if error}<div role="alert" class="alert alert-error text-sm py-2" transition:slide={{ duration: ms(200) }}>{error}</div>{/if}

    {#if canEdit}
      <div class="flex items-center gap-3">
        <button type="submit" class="btn btn-primary btn-sm" disabled={!dirty || !valid || saving}>
          {#if saving}<span class="loading loading-spinner loading-xs"></span>{/if}
          Save settings
        </button>
        {#if dirty}
          <button type="button" class="btn btn-ghost btn-sm" onclick={() => (form = plain(saved))} transition:fade={{ duration: ms(150) }}>Discard changes</button>
        {/if}
        {#if savedNote}
          <span class="text-sm text-success inline-flex items-center gap-1" role="status" transition:fade={{ duration: ms(150) }}><Check class="size-4" />Saved</span>
        {/if}
      </div>
    {:else}
      <p class="text-sm opacity-70">You can view these settings but not change them.</p>
    {/if}
  </form>
{/if}
