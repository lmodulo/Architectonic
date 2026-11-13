<script lang="ts">
  // Dashboard widget (registered via module.json → "widgets"): live Vault counts.
  import ModuleStatsWidget from '$lib/components/ModuleStatsWidget.svelte';
  import { FolderLock } from 'lucide-svelte';
</script>

<ModuleStatsWidget title="Vault" icon={FolderLock} href="/vault" stats={[
  { label: 'Documents', endpoint: '/api/vault/documents' },
  { label: 'Folders', endpoint: '/api/vault/folders' },
]} />
