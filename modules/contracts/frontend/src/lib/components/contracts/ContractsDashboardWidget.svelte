<script lang="ts">
  // Dashboard widget (registered via module.json → "widgets"): live Contracts counts.
  import ModuleStatsWidget from '$lib/components/ModuleStatsWidget.svelte';
  import { FileSignature } from 'lucide-svelte';
</script>

<ModuleStatsWidget title="Contracts" icon={FileSignature} href="/contracts" stats={[
  { label: 'Contracts', endpoint: '/api/contracts' },
  { label: 'Signed', endpoint: '/api/contracts?status=signed' },
  { label: 'Drafts', endpoint: '/api/contracts?status=draft' },
]} />
