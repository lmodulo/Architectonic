<script lang="ts">
  import iconMapRaw from '$lib/config/icon-map.json';
  import { getIconTheme, type IconLibrary } from '$lib/stores/icon-theme';

  type IconMapEntry = { lucide: string; tabler: string; phosphor: string; heroicons: string; material: string };
  const iconMap = iconMapRaw as Record<string, IconMapEntry>;

  type ModuleNS = Record<string, unknown>;

  const loaders: Record<Exclude<IconLibrary, 'material'>, () => Promise<ModuleNS>> = {
    lucide: () => import('lucide-svelte'),
    tabler: () => import('@tabler/icons-svelte'),
    phosphor: () => import('phosphor-svelte'),
    heroicons: () => import('svelte-hero-icons'),
  };

  const moduleCache = new Map<string, Promise<ModuleNS>>();

  function loadTheme(theme: Exclude<IconLibrary, 'material'>) {
    let p = moduleCache.get(theme);
    if (!p) {
      p = loaders[theme]();
      moduleCache.set(theme, p);
    }
    return p;
  }

  let { name, size = 20, class: className = '' }: { name: string; size?: number | string; class?: string } = $props();

  const themeGetter = getIconTheme();
  const theme = $derived(themeGetter());
  const entry = $derived(iconMap[name] ?? iconMap['HelpCircle']);
  const mapped = $derived(entry[theme]);
  const modulePromise = $derived(theme === 'material' ? null : loadTheme(theme));
</script>

{#if theme === 'material'}
  <span
    class="material-symbols-outlined {className}"
    style="font-size:{typeof size === 'number' ? `${size}px` : size}; line-height:1;"
    aria-hidden="true"
  >{mapped}</span>
{:else if modulePromise}
  {#await modulePromise then mod}
    {@const Primary = mod[mapped] as any}
    {#if Primary}
      {#if theme === 'heroicons'}
        {@const HeroIcon = mod.Icon as any}
        <HeroIcon src={Primary} size={String(size)} class={className} />
      {:else if theme === 'phosphor'}
        <Primary {size} weight="regular" class={className} />
      {:else}
        <Primary {size} class={className} />
      {/if}
    {:else}
      {#if import.meta.env.DEV}
        {@const _warn = console.warn(`[Icon] "${mapped}" not found in "${theme}" for icon "${name}" — falling back to lucide`)}
      {/if}
      {#await loadTheme('lucide') then lucideMod}
        {@const Fallback = lucideMod[entry.lucide] as any}
        {#if Fallback}
          <Fallback {size} class={className} />
        {/if}
      {/await}
    {/if}
  {/await}
{/if}
