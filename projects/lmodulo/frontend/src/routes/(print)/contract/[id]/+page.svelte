<script lang="ts">
  import BrandedDocument from '$lib/components/BrandedDocument.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Signer = {
    name:     string;
    email:    string;
    role:     string;
    status:   string;
    signedAt?: string;
  };

  type Contract = {
    title:       string;
    type:        string;
    content:     string;
    status:      string;
    effectiveDate?: string;
    expiryDate?:    string;
    value?:         number;
    currency?:      string;
    signers:        Signer[];
  };

  const contract = data.contract as Contract;

  const TYPE_LABELS: Record<string, string> = {
    msa: 'Master Service Agreement', sow: 'Statement of Work',
    nda: 'Non-Disclosure Agreement', custom: 'Agreement',
  };

  function fmtDate(d?: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  const brandName = (data as any).brandName ?? '';
  const brandLogo = (data as any).brandLogo ?? '';
</script>

<BrandedDocument {brandName} {brandLogo} title={contract.title}>
  <!-- Contract header -->
  <div class="mb-10">
    <p class="text-xs text-black uppercase tracking-widest mb-1">
      {TYPE_LABELS[contract.type] ?? 'Agreement'}
    </p>
    <h1 class="text-2xl font-semibold text-gray-800 leading-snug">{contract.title}</h1>

    {#if contract.effectiveDate || contract.expiryDate}
      <div class="flex flex-wrap gap-6 mt-4 text-sm text-gray-500">
        {#if contract.effectiveDate}
          <span><span class="text-black">Effective:</span> {fmtDate(contract.effectiveDate)}</span>
        {/if}
        {#if contract.expiryDate}
          <span><span class="text-black">Expires:</span> {fmtDate(contract.expiryDate)}</span>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Contract body -->
  <div class="prose prose-sm max-w-none text-gray-700 mb-10 [&_p]:leading-relaxed [&_p]:mb-4">
    {@html contract.content ?? '<p>No content.</p>'}
  </div>

  <!-- Signers -->
  {#if contract.signers?.length > 0}
    <div class="border-t border-gray-200 pt-8">
      <p class="text-xs text-black uppercase tracking-widest mb-4">Signatures</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {#each contract.signers as signer}
          <div class="border border-gray-200 rounded-sm p-4">
            <p class="text-xs text-black uppercase tracking-wide mb-1">{signer.role}</p>
            <p class="font-medium text-gray-800">{signer.name}</p>
            <p class="text-sm text-gray-500 mb-3">{signer.email}</p>
            {#if signer.status === 'signed' && signer.signedAt}
              <div class="border-t border-gray-100 pt-3">
                <p class="text-xs text-black">Signed electronically</p>
                <p class="text-xs text-gray-500">{fmtDate(signer.signedAt)}</p>
              </div>
            {:else}
              <div class="border-t border-dashed border-gray-200 pt-3 mt-3">
                <p class="text-xs text-gray-500 italic">Pending signature</p>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#snippet footer()}
    {contract.title} &mdash; {brandName || 'Confidential'}
  {/snippet}
</BrandedDocument>
