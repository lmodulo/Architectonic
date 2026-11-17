<script lang="ts">
  // The horizon used in sky placeholders and as the footer's top edge: rolling far hills, flat-topped basalt
  // rimrock, the river, and the near bank. Colours come from CSS (.far .mid .water .near); `edge` draws just
  // the near bank as a solid shape for the footer.
  let { class: cls = '', edge = false }: { class?: string; edge?: boolean } = $props();
</script>

{#if edge}
  <svg class={cls} viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <path d="M0 52 L180 50 L206 30 L398 26 L424 48 L612 52 C 760 44 860 58 1000 50 L1030 28 L1236 24 L1262 46 L1440 48 V80 H0 Z" />
  </svg>
{:else}
  <svg class={cls} viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <path class="far" d="M0 196 C 120 168 250 150 360 164 S 600 118 760 140 S 1040 108 1180 134 S 1380 150 1440 138 V320 H0 Z" />
    <path class="mid" d="M0 238 L150 234 L178 206 L338 200 L362 226 L528 230 L566 192 L768 186 L796 216 L984 222 L1014 198 L1214 192 L1242 224 L1440 228 V320 H0 Z" />
    <path class="water" d="M0 268 C 300 254 520 284 820 266 S 1260 260 1440 270 L1440 284 C 1240 276 1020 292 820 282 S 300 270 0 286 Z" />
    <path class="near" d="M0 292 C 180 280 320 302 520 292 S 900 284 1100 296 S 1340 288 1440 294 V320 H0 Z" />
  </svg>
{/if}
