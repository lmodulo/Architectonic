<script lang="ts">
  import { goto } from '$app/navigation';
  import { FileText, FileSignature, Shield, LayoutTemplate, ChevronLeft, ChevronRight } from 'lucide-svelte';
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

  const TYPE_ICONS: Record<string, any> = { msa: FileSignature, sow: FileText, nda: Shield, custom: LayoutTemplate };
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

<div class="max-w-3xl mx-auto flex flex-col gap-6">
  <div class="flex items-center gap-2 text-sm text-base-content/60">
    <a href="/contracts" class="hover:text-base-content">Contracts</a>
    <ChevronRight class="size-3" />
    <span>New Contract</span>
  </div>

  <!-- Step indicator -->
  <ul class="steps w-full">
    <li class="step {step >= 1 ? 'step-primary' : ''}">Template</li>
    <li class="step {step >= 2 ? 'step-primary' : ''}">Details</li>
    <li class="step {step >= 3 ? 'step-primary' : ''}">Content</li>
  </ul>

  <!-- Step 1: Template picker -->
  {#if step === 1}
    <div class="flex flex-col gap-4">
      <h2 class="font-semibold text-lg">Choose a starting point</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {#each data.templates as t}
          {@const Icon = TYPE_ICONS[t.type] ?? LayoutTemplate}
          <button
            type="button"
            class="card card-bordered p-4 text-left transition-all {selectedTemplateId === t.id ? 'border-primary bg-primary/5' : 'hover:border-base-content/30'}"
            onclick={() => pickTemplate(t.id)}
          >
            <div class="flex items-start gap-3">
              <Icon class="size-5 mt-0.5 {selectedTemplateId === t.id ? 'text-primary' : 'text-base-content/60'}" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-sm">{t.name}</span>
                  {#if t.isDefault}
                    <span class="badge badge-ghost badge-xs">Default</span>
                  {/if}
                </div>
                <p class="text-xs text-base-content/60 mt-0.5">{t.description || TYPE_DESCRIPTIONS[t.type] || ''}</p>
              </div>
            </div>
          </button>
        {/each}

        <!-- Blank option -->
        <button
          type="button"
          class="card card-bordered p-4 text-left transition-all {selectedTemplateId === 'blank' ? 'border-primary bg-primary/5' : 'hover:border-base-content/30'}"
          onclick={() => pickTemplate(null)}
        >
          <div class="flex items-start gap-3">
            <LayoutTemplate class="size-5 mt-0.5 {selectedTemplateId === 'blank' ? 'text-primary' : 'text-base-content/60'}" />
            <div>
              <span class="font-medium text-sm">Blank Document</span>
              <p class="text-xs text-base-content/60 mt-0.5">Start from scratch with no pre-filled content.</p>
            </div>
          </div>
        </button>
      </div>

      <div class="flex justify-end">
        <button class="btn btn-primary" onclick={next}>
          Continue
          <ChevronRight class="size-4" />
        </button>
      </div>
    </div>

  <!-- Step 2: Metadata -->
  {:else if step === 2}
    <div class="flex flex-col gap-4">
      <h2 class="font-semibold text-lg">Contract details</h2>

      {#if err}
        <div class="alert alert-error alert-sm text-sm">{err}</div>
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

      <div class="flex justify-between">
        <button class="btn btn-ghost" onclick={() => step = 1}>
          <ChevronLeft class="size-4" />
          Back
        </button>
        <button class="btn btn-primary" onclick={next}>
          Continue
          <ChevronRight class="size-4" />
        </button>
      </div>
    </div>

  <!-- Step 3: Content editor -->
  {:else if step === 3}
    <div class="flex flex-col gap-4">
      <h2 class="font-semibold text-lg">Review &amp; edit content</h2>
      <p class="text-sm text-base-content/60">Replace <code class="text-xs">{'{{variable}}'}</code> placeholders with your actual values.</p>

      {#if err}
        <div class="alert alert-error alert-sm text-sm">{err}</div>
      {/if}

      <textarea
        class="textarea textarea-bordered w-full font-mono text-xs min-h-[400px]"
        bind:value={content}
        placeholder="Paste or type contract HTML content here..."
      ></textarea>

      <div class="flex justify-between">
        <button class="btn btn-ghost" onclick={() => step = 2}>
          <ChevronLeft class="size-4" />
          Back
        </button>
        <button class="btn btn-primary" onclick={save} disabled={saving}>
          {saving ? 'Creating…' : 'Create Contract'}
        </button>
      </div>
    </div>
  {/if}
</div>
