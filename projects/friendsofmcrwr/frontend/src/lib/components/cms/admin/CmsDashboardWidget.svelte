<script lang="ts">
  // Dashboard widget (registered via module.json → "widgets"): live counts for the public website.
  // Both read the site tree; pages are page and component items (labels and links have no content).
  import ModuleStatsWidget from '$lib/components/ModuleStatsWidget.svelte';
  import { LayoutTemplate } from 'lucide-svelte';

  type Item = { type?: string; visible?: boolean };
  const pages = (j: unknown): Item[] => (Array.isArray(j) ? (j as Item[]) : []).filter(n => n.type === 'page' || n.type === 'component');
</script>

<ModuleStatsWidget title="Content" icon={LayoutTemplate} href="/cms" stats={[
  { label: 'Live pages', endpoint: '/api/cms/nodes', count: (j) => pages(j).filter(n => n.visible).length },
  { label: 'Not live', endpoint: '/api/cms/nodes', count: (j) => pages(j).filter(n => !n.visible).length },
]} />
