<script lang="ts">
  import { STATUS_COLOR } from '$lib/utils/agile';
  import type { AgileJob } from '$lib/utils/agile';

  let { jobs = [] }: { jobs: AgileJob[] } = $props();

  const W = 500;
  const H = 260;
  const NODE_W = 110;
  const NODE_H = 36;

  // Simple topological layout: group by depth (BFS from roots)
  const layout = $derived(() => {
    if (jobs.length === 0) return { nodes: [], edges: [] };

    const depMap = new Map<string, string[]>();
    for (const j of jobs) depMap.set(j.id, j.dependencyIds ?? []);

    // Count incoming edges
    const inDeg = new Map<string, number>();
    for (const j of jobs) inDeg.set(j.id, 0);
    for (const j of jobs) {
      for (const dep of j.dependencyIds ?? []) {
        inDeg.set(j.id, (inDeg.get(j.id) ?? 0) + 1);
      }
    }

    // BFS layers
    const layers: string[][] = [];
    const visited = new Set<string>();
    let queue = jobs.filter(j => (inDeg.get(j.id) ?? 0) === 0).map(j => j.id);
    while (queue.length > 0) {
      layers.push(queue);
      visited.forEach(() => {});
      const next: string[] = [];
      for (const id of queue) visited.add(id);
      for (const j of jobs) {
        if (!visited.has(j.id) && (j.dependencyIds ?? []).every(d => visited.has(d))) {
          next.push(j.id);
        }
      }
      queue = next;
    }
    // Append any unvisited (cycles)
    const unvisited = jobs.filter(j => !visited.has(j.id)).map(j => j.id);
    if (unvisited.length) layers.push(unvisited);

    const colW = W / Math.max(layers.length, 1);
    const nodes = new Map<string, { x: number; y: number; job: AgileJob }>();

    for (let li = 0; li < layers.length; li++) {
      const layer = layers[li];
      const rowH  = H / Math.max(layer.length, 1);
      for (let ri = 0; ri < layer.length; ri++) {
        const id  = layer[ri];
        const job = jobs.find(j => j.id === id);
        if (!job) continue;
        nodes.set(id, {
          x: li * colW + colW / 2 - NODE_W / 2,
          y: ri * rowH + rowH / 2 - NODE_H / 2,
          job,
        });
      }
    }

    const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (const j of jobs) {
      const to = nodes.get(j.id);
      if (!to) continue;
      for (const depId of j.dependencyIds ?? []) {
        const from = nodes.get(depId);
        if (!from) continue;
        edges.push({
          x1: from.x + NODE_W,
          y1: from.y + NODE_H / 2,
          x2: to.x,
          y2: to.y + NODE_H / 2,
        });
      }
    }

    return { nodes: Array.from(nodes.values()), edges };
  });
</script>

{#if jobs.length === 0}
  <p class="text-sm opacity-40 text-center py-8">No jobs in this sprint</p>
{:else}
  <div class="overflow-x-auto">
    <svg viewBox="0 0 {W} {H}" width="100%" height={H} class="block" aria-label="Dependency graph">
      <!-- Edges -->
      {#each layout().edges as e}
        <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
          stroke="currentColor" stroke-opacity="0.3" stroke-width="1.5"
          marker-end="url(#arrow)"/>
      {/each}

      <!-- Arrow marker -->
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 Z" fill="currentColor" opacity="0.3"/>
        </marker>
      </defs>

      <!-- Nodes -->
      {#each layout().nodes as n}
        {@const statusCls = n.job.status === 'Done' ? 'var(--color-success)' : n.job.blocked ? 'var(--color-error)' : 'var(--color-primary)'}
        <rect x={n.x} y={n.y} width={NODE_W} height={NODE_H}
          rx="6" fill={statusCls} fill-opacity="0.15"
          stroke={statusCls} stroke-width="1.5" stroke-opacity="0.6"/>
        <text x={n.x + NODE_W / 2} y={n.y + NODE_H / 2 - 4}
          text-anchor="middle" font-size="9" font-weight="600" fill="currentColor" fill-opacity="0.85">
          {n.job.title.length > 14 ? n.job.title.slice(0, 14) + '…' : n.job.title}
        </text>
        <text x={n.x + NODE_W / 2} y={n.y + NODE_H / 2 + 8}
          text-anchor="middle" font-size="8" fill="currentColor" fill-opacity="0.5">
          {n.job.status}
        </text>
      {/each}
    </svg>
  </div>
{/if}
