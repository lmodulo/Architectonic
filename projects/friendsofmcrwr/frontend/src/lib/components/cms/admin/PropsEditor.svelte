<script lang="ts">
  // Form fields for a registry component's props (its PropSpec list), for component items and blocks.
  import type { PropSpec } from '$lib/cms/types';

  let { specs, props, onchange, disabled = false }: {
    specs: PropSpec[];
    props: Record<string, unknown>;
    onchange: (props: Record<string, unknown>) => void;
    disabled?: boolean;
  } = $props();

  const uid = $props.id();
  const value = (s: PropSpec) => (props[s.name] !== undefined ? props[s.name] : s.default);
  const set = (name: string, v: unknown) => onchange({ ...props, [name]: v });
</script>

{#each specs as spec (spec.name)}
  {@const id = `${uid}-${spec.name}`}
  {#if spec.type === 'boolean'}
    <label class="flex items-start gap-2 cursor-pointer" for={id}>
      <input {id} type="checkbox" class="checkbox checkbox-sm mt-0.5" checked={value(spec) === true} {disabled} onchange={e => set(spec.name, e.currentTarget.checked)} />
      <span class="text-sm">
        {spec.label}
        {#if spec.help}<span class="block text-xs opacity-60">{spec.help}</span>{/if}
      </span>
    </label>
  {:else}
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium" for={id}>{spec.label}</label>
      {#if spec.type === 'select'}
        <select {id} class="select select-sm w-full" value={String(value(spec) ?? '')} {disabled} onchange={e => set(spec.name, e.currentTarget.value)}>
          {#each spec.options ?? [] as o (o.value)}<option value={o.value}>{o.label}</option>{/each}
        </select>
      {:else if spec.type === 'number'}
        <input
          {id}
          type="number"
          class="input input-sm w-full"
          value={typeof value(spec) === 'number' ? value(spec) : ''}
          {disabled}
          oninput={e => set(spec.name, e.currentTarget.value === '' ? null : Number(e.currentTarget.value))}
        />
      {:else}
        <input {id} type="text" class="input input-sm w-full" value={String(value(spec) ?? '')} maxlength="2000" {disabled} oninput={e => set(spec.name, e.currentTarget.value)} />
      {/if}
      {#if spec.help}<span class="text-xs opacity-60">{spec.help}</span>{/if}
    </div>
  {/if}
{/each}
