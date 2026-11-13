<script lang="ts">
  // Dashboard widget (registered via module.json → "widgets"): live Agile counts.
  import ModuleStatsWidget from '$lib/components/ModuleStatsWidget.svelte';
  import { Milestone } from 'lucide-svelte';
</script>

<ModuleStatsWidget title="Agile" icon={Milestone} href="/agile" stats={[
  { label: 'Milestones', endpoint: '/api/agile/milestones?limit=1' },
  { label: 'Sprints', endpoint: '/api/agile/sprints?limit=1' },
  { label: 'Tasks', endpoint: '/api/agile/tasks?limit=1' },
]} />
