<script lang="ts">
  import { CONTACT_STATUS_COLOR, fmtDate, type CrmContact } from '$lib/utils/crm';
  import { UserCheck } from 'lucide-svelte';

  let {
    contact,
    onclick,
  }: {
    contact: CrmContact;
    onclick?: () => void;
  } = $props();
</script>

<button
  type="button"
  class="w-full text-left card bg-base-200 border border-base-300 rounded-box px-4 py-3
    hover:bg-base-300/60 transition-colors cursor-pointer"
  {onclick}
>
  <div class="flex items-start justify-between gap-3">
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="font-medium text-sm">{contact.firstName} {contact.lastName}</span>
        <span class="badge badge-xs badge-ghost">{contact.role}</span>
        <span class="badge badge-xs {CONTACT_STATUS_COLOR[contact.status] ?? 'badge-ghost'}">{contact.status}</span>
        {#if contact.isUser}
          <span class="badge badge-xs badge-primary gap-1"><UserCheck class="size-2.5" />Client</span>
        {/if}
      </div>
      <div class="flex items-center gap-3 mt-1 text-xs opacity-50 flex-wrap">
        {#if contact.companyName}
          <span>{contact.companyName}</span>
        {/if}
        {#if contact.email}
          <span>{contact.email}</span>
        {/if}
        {#if contact.phone}
          <span>{contact.phone}</span>
        {/if}
      </div>
    </div>
    <div class="text-xs opacity-40 shrink-0">{fmtDate(contact.createdAt)}</div>
  </div>
</button>
