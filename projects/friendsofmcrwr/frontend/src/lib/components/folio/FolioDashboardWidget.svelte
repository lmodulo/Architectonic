<script lang="ts">
  // Dashboard widget (registered via module.json → "widgets"): live Folio counts.
  import ModuleStatsWidget from '$lib/components/ModuleStatsWidget.svelte';
  import { Receipt } from 'lucide-svelte';
</script>

<ModuleStatsWidget title="Folio" icon={Receipt} href="/folio" stats={[
  { label: 'Invoices', endpoint: '/api/finance/invoices?limit=1' },
  { label: 'Unpaid', endpoint: '/api/finance/invoices?status=sent&limit=1' },
  { label: 'Overdue', endpoint: '/api/finance/invoices?status=overdue&limit=1' },
]} />
