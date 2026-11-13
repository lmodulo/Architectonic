<script lang="ts">
  // Dashboard widget (registered via module.json → "widgets"): live Nexus counts.
  import ModuleStatsWidget from '$lib/components/ModuleStatsWidget.svelte';
  import { Handshake } from 'lucide-svelte';
</script>

<ModuleStatsWidget title="Nexus" icon={Handshake} href="/crm" stats={[
  { label: 'Companies', endpoint: '/api/crm/companies?limit=1' },
  { label: 'Contacts', endpoint: '/api/crm/contacts?limit=1' },
  { label: 'Open deals', endpoint: '/api/crm/deals?limit=500', count: (j) => (j.deals ?? []).filter((d: { stage?: string }) => !String(d.stage).startsWith('Closed')).length },
]} />
