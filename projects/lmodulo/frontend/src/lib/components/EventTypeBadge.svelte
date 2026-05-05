<script lang="ts">
  import { typePreset, typeLabel } from '$lib/utils/calendarEvents';

  let {
    type,
    size = 'sm',
  }: {
    type: string;
    size?: 'sm' | 'md';
  } = $props();
</script>

<span class="badge {typePreset(type)} {size === 'sm' ? 'text-xs' : 'text-sm'}">
  {typeLabel(type)}
</span>
