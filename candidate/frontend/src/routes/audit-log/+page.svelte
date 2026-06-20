<script lang="ts">
  import { goto } from '$app/navigation';
  import { Search, ChevronDown } from 'lucide-svelte';
  import { m } from '$lib/paraglide/messages.js';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const PAGE_SIZE = 20;

  const ACTION_CATEGORIES = $derived([
    { value: '',           label: m.audit_cat_all()        },
    { value: 'auth',       label: m.audit_cat_auth()       },
    { value: 'user',       label: m.audit_cat_users()      },
    { value: 'role',       label: m.audit_cat_roles()      },
    { value: 'team',       label: m.audit_cat_teams()      },
    { value: 'workspace',  label: m.audit_cat_workspace()  },
    { value: 'message',    label: m.audit_cat_messages()   },
    { value: 'automation', label: m.audit_cat_automation() },
    { value: 'event',      label: m.audit_cat_events()     },
    { value: 'settings',   label: m.audit_cat_settings()   },
  ]);

  const CATEGORY_BADGE: Record<string, string> = {
    auth:       'badge-primary',
    user:       'badge-secondary',
    role:       'badge-accent',
    team:       'badge-info',
    workspace:  'badge-warning',
    message:    'badge-success',
    automation: 'badge-neutral',
    event:      'badge-ghost',
    settings:   'badge-error',
  };

  let q        = $state(data.q);
  let action   = $state(data.action);
  let expanded = $state(new Set<string>());

  $effect(() => {
    data.entries;
    expanded = new Set();
  });

  function navigate(page: number, overrideQ = q, overrideAction = action) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    if (overrideQ.trim())    params.set('q', overrideQ.trim());
    if (overrideAction)      params.set('action', overrideAction);
    goto(`/audit-log?${params}`);
  }

  function applyFilters() {
    navigate(1);
  }

  function handlePageChange(e: { page: number }) {
    navigate(e.page);
  }

  function toggleMeta(id: string) {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    expanded = next;
  }

  function parseAction(raw: string): { category: string; verb: string } {
    const dot = raw.indexOf('.');
    return dot === -1
      ? { category: raw, verb: '' }
      : { category: raw.slice(0, dot), verb: raw.slice(dot + 1).replace(/_/g, ' ') };
  }

  function relativeTime(date: string | Date): string {
    const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (secs < 60)    return `${secs}s ago`;
    if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  }
</script>

<svelte:head>
  <title>{m.audit_title()}</title>
</svelte:head>

<div class="space-y-6">
  <PageHeader title={m.audit_title()} subtitle={m.audit_subtitle()} />

  {#if data.error}
    <div role="alert" class="alert alert-error text-sm">{data.error}</div>
  {/if}

  <div class="flex items-center gap-3">
    <label class="input input-bordered flex items-center gap-2 flex-1">
      <Search class="size-4 opacity-50" />
      <input
        type="search"
        placeholder={m.audit_search()}
        class="grow"
        bind:value={q}
        onkeydown={(e) => e.key === 'Enter' && applyFilters()}
      />
    </label>

    <select class="select select-bordered w-48" bind:value={action} onchange={applyFilters}>
      {#each ACTION_CATEGORIES as cat (cat.value)}
        <option value={cat.value}>{cat.label}</option>
      {/each}
    </select>

    <button type="button" class="btn btn-primary" onclick={applyFilters}>{m.common_apply()}</button>
  </div>

  <div class="card bg-base-100 border border-base-200 overflow-hidden">
    <table class="table table-sm">
      <thead>
        <tr>
          <th>{m.audit_col_timestamp()}</th>
          <th>{m.audit_col_actor()}</th>
          <th>{m.audit_col_action()}</th>
          <th>{m.audit_col_resource()}</th>
          <th>{m.audit_col_ip()}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each (data.entries ?? []) as entry (entry.id)}
          {@const { category, verb } = parseAction(entry.action)}
          <tr class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors">
            <td>
              <span title={new Date(entry.createdAt).toLocaleString()} class="text-xs opacity-70 whitespace-nowrap">
                {relativeTime(entry.createdAt)}
              </span>
            </td>
            <td>
              <div class="flex items-center gap-2">
                <Avatar user={{ username: entry.username }} size="xs" />
                <span class="text-sm font-medium">{entry.username}</span>
              </div>
            </td>
            <td>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="badge badge-sm {CATEGORY_BADGE[category] ?? 'badge-ghost'}">{category}</span>
                {#if verb}
                  <span class="text-xs opacity-70">{verb}</span>
                {/if}
              </div>
            </td>
            <td class="font-mono text-xs opacity-60">
              {#if entry.resourceId}
                <span title={entry.resourceId} class="truncate max-w-[8rem] inline-block align-bottom">
                  {entry.resourceId.length > 12 ? entry.resourceId.slice(-8) : entry.resourceId}
                </span>
              {:else}
                <span class="opacity-40">—</span>
              {/if}
            </td>
            <td class="font-mono text-xs opacity-60">
              {entry.ip ?? '—'}
            </td>
            <td class="w-8">
              {#if Object.keys(entry.meta).length > 0}
                <button
                  type="button"
                  class="btn btn-ghost btn-square btn-xs"
                  aria-label="{expanded.has(entry.id) ? m.audit_collapse() : m.audit_expand()} details"
                  onclick={() => toggleMeta(entry.id)}
                >
                  <ChevronDown class="size-3.5 transition-transform duration-150 {expanded.has(entry.id) ? 'rotate-180' : ''}" />
                </button>
              {/if}
            </td>
          </tr>
          {#if expanded.has(entry.id) && Object.keys(entry.meta).length > 0}
            <tr class="bg-base-200/40">
              <td colspan="6" class="px-4 py-3">
                <pre class="text-xs font-mono whitespace-pre-wrap break-all opacity-80">{JSON.stringify(entry.meta, null, 2)}</pre>
              </td>
            </tr>
          {/if}
        {:else}
          <tr>
            <td colspan="6" class="text-center opacity-50 py-8 text-sm">{m.audit_no_entries()}</td>
          </tr>
        {/each}
      </tbody>
    </table>

    <div class="flex items-center justify-between px-4 py-2 border-t border-base-200">
      <span class="text-xs opacity-60">
        {data.count === 0
          ? 'No entries'
          : `${(data.page - 1) * PAGE_SIZE + 1}–${Math.min(data.page * PAGE_SIZE, data.count)} of ${data.count}`}
      </span>
      <Pagination
        count={data.count}
        pageSize={PAGE_SIZE}
        page={data.page}
        onPageChange={handlePageChange}
        siblingCount={1}
      />
    </div>
  </div>
</div>
