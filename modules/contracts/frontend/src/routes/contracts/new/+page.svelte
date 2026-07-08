<script lang="ts">
  import { ChevronLeft, ChevronRight, LayoutTemplate, FileSignature, FileText, Shield } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import MessageEditor from '$lib/components/MessageEditor.svelte';
  import Breadcrumb from '$lib/components/contracts/Breadcrumb.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // Step state: 1 = pick template, 2 = metadata, 3 = edit content
  let step = $state(1);

  // Selected template
  let selectedTemplateId = $state<string | null>(null);
  let selectedTemplate   = $derived(data.templates.find((t: any) => t.id === selectedTemplateId) ?? null);

  // Form fields
  let title         = $state('');
  let companyId     = $state(data.dealId ? '' : '');
  let value         = $state('');
  let currency      = $state('USD');
  let effectiveDate = $state('');
  let expiryDate    = $state('');
  let content       = $state('');
  let saving        = $state(false);
  let err           = $state('');

  const TYPE_ICONS = { msa: FileSignature, sow: FileText, nda: Shield, custom: LayoutTemplate };
  const TYPE_DESCRIPTIONS: Record<string, string> = {
    msa:    'Governs the ongoing service relationship — foundation for all client engagements.',
    sow:    'Defines scope, deliverables, timeline, and fees for a specific project.',
    nda:    'Mutual confidentiality — use before sharing sensitive information.',
    custom: 'Start from scratch with a blank document.',
  };

  function pickTemplate(tplId: string | null) {
    selectedTemplateId = tplId;
    if (tplId === null) {
      content = '';
      if (!title) title = 'New Contract';
    } else {
      const t = data.templates.find((t: any) => t.id === tplId);
      if (t && !title) title = t.name;
      if (t) content = t.content ?? '';
    }
  }

  function next() {
    if (step === 1 && selectedTemplateId !== 'blank' && selectedTemplateId !== null) {
      step = 2;
    } else if (step === 1) {
      step = 2;
    } else if (step === 2) {
      if (!title.trim()) { err = 'Title is required.'; return; }
      err = '';
      step = 3;
    }
  }

  async function save() {
    if (!title.trim()) { err = 'Title is required.'; return; }
    saving = true;
    err = '';
    try {
      const res = await fetch('/api/contracts', {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({
          title: title.trim(),
          type:  selectedTemplate?.type ?? 'custom',
          content,
          companyId: companyId || undefined,
          dealId:    data.dealId || undefined,
          value:     value ? Number(value) : undefined,
          currency,
          effectiveDate: effectiveDate || undefined,
          expiryDate:    expiryDate || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        err = (d as any).message ?? 'Failed to create contract.';
        return;
      }
      const contract = await res.json();
      goto(`/contracts/${contract.id}`);
    } catch {
      err = 'Network error. Please try again.';
    } finally {
      saving = false;
    }
  }
</script>

<div class="space-y-4 -mt-6">

  <Breadcrumb crumbs={[{ label: 'Contracts', href: '/contracts' }, { label: 'New Contract' }]} />

  <div class="card bg-base-100 border border-base-300 rounded-box overflow-hidden shadow-sm">

    <!-- Wizard header -->
    <div class="flex items-center justify-between gap-4 px-6 py-4 bg-base-200 border-b border-base-300">
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-wide opacity-40">New Contract</p>
        <h1 class="font-semibold text-base leading-tight">
          {step === 1 ? 'Choose a starting point' : step === 2 ? 'Contract details' : 'Review & edit content'}
        </h1>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        {#each ['Template', 'Details', 'Content'] as label, i}
          {@const n = i + 1}
          {#if i > 0}
            <div class="w-6 h-px {step > i ? 'bg-primary/60' : 'bg-base-300'}"></div>
          {/if}
          <div class="flex items-center gap-1.5">
            <span class="size-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
              {step > n ? 'bg-success text-success-content' : step === n ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/40'}">
              {n}
            </span>
            <span class="text-xs hidden md:inline {step === n ? 'font-medium' : 'opacity-40'}">{label}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Step body -->
    <div class="p-6 space-y-4">

      <!-- Step 1: Template picker -->
      {#if step === 1}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {#each data.templates as t}
            {@const TplIcon = TYPE_ICONS[t.type as keyof typeof TYPE_ICONS] ?? LayoutTemplate}
            <button
              type="button"
              class="flex items-start gap-3 p-4 rounded-box border text-left transition-all
                {selectedTemplateId === t.id
                  ? 'border-primary bg-primary/10'
                  : 'border-base-300 bg-base-200 hover:border-base-content/30'}"
              onclick={() => pickTemplate(t.id)}
            >
              <TplIcon size={20} class="size-5 mt-0.5 shrink-0 {selectedTemplateId === t.id ? 'text-primary' : 'opacity-50'}" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-sm">{t.name}</span>
                  {#if t.isDefault}
                    <span class="badge badge-ghost badge-xs">Default</span>
                  {/if}
                </div>
                <p class="text-xs opacity-60 mt-0.5">{t.description || TYPE_DESCRIPTIONS[t.type] || ''}</p>
              </div>
            </button>
          {/each}

          <button
            type="button"
            class="flex items-start gap-3 p-4 rounded-box border text-left transition-all
              {selectedTemplateId === 'blank'
                ? 'border-primary bg-primary/10'
                : 'border-base-300 bg-base-200 hover:border-base-content/30'}"
            onclick={() => pickTemplate(null)}
          >
            <LayoutTemplate size={20} class="size-5 mt-0.5 shrink-0 {selectedTemplateId === 'blank' ? 'text-primary' : 'opacity-50'}" />
            <div>
              <span class="font-medium text-sm">Blank Document</span>
              <p class="text-xs opacity-60 mt-0.5">Start from scratch with no pre-filled content.</p>
            </div>
          </button>
        </div>

      <!-- Step 2: Metadata -->
      {:else if step === 2}
        {#if err}
          <div class="alert alert-error text-sm p-3">{err}</div>
        {/if}

        <label class="form-control">
          <div class="label"><span class="label-text">Title <span class="text-error">*</span></span></div>
          <input type="text" class="input input-bordered w-full" bind:value={title} placeholder="e.g. ACME Corp — MSA 2026" />
        </label>

        <label class="form-control">
          <div class="label"><span class="label-text">Company</span></div>
          <select class="select select-bordered w-full" bind:value={companyId}>
            <option value="">— None —</option>
            {#each data.companies as co}
              <option value={co.id ?? co._id}>{co.name}</option>
            {/each}
          </select>
        </label>

        <div class="grid grid-cols-2 gap-3">
          <label class="form-control">
            <div class="label"><span class="label-text">Contract Value</span></div>
            <input type="number" class="input input-bordered w-full" bind:value={value} placeholder="0.00" min="0" step="0.01" />
          </label>
          <label class="form-control">
            <div class="label"><span class="label-text">Currency</span></div>
            <select class="select select-bordered w-full" bind:value={currency}>
              <option>USD</option><option>EUR</option><option>GBP</option><option>CAD</option><option>AUD</option>
            </select>
          </label>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <label class="form-control">
            <div class="label"><span class="label-text">Effective Date</span></div>
            <input type="date" class="input input-bordered w-full" bind:value={effectiveDate} />
          </label>
          <label class="form-control">
            <div class="label"><span class="label-text">Expiry Date</span></div>
            <input type="date" class="input input-bordered w-full" bind:value={expiryDate} />
          </label>
        </div>

      <!-- Step 3: Content editor -->
      {:else if step === 3}
        {#if err}
          <div class="alert alert-error text-sm p-3">{err}</div>
        {/if}
        <p class="text-sm opacity-60">Replace <code class="text-xs bg-base-200 px-1 py-0.5 rounded">{'{{variable}}'}</code> placeholders with your actual values.</p>
        <MessageEditor bind:html={content} placeholder="Paste or type contract content here…" />
      {/if}

    </div>

    <!-- Footer nav -->
    <div class="flex justify-between items-center px-6 py-4 border-t border-base-300 bg-base-200">
      {#if step > 1}
        <button class="btn btn-ghost btn-sm" onclick={() => step = step - 1}>
          <ChevronLeft size={16} class="size-4" /> Back
        </button>
      {:else}
        <div></div>
      {/if}
      {#if step < 3}
        <button class="btn btn-primary btn-sm" onclick={next}>
          Continue <ChevronRight size={16} class="size-4" />
        </button>
      {:else}
        <button class="btn btn-primary" onclick={save} disabled={saving}>
          {saving ? 'Creating…' : 'Create Contract'}
        </button>
      {/if}
    </div>

  </div>
</div>
