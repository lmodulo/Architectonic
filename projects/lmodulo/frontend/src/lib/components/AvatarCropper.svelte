<script lang="ts">
  import { onMount } from 'svelte';

  let { src, onApply, onCancel }: {
    src: string;
    onApply: (blob: Blob) => void;
    onCancel: () => void;
  } = $props();

  const SIZE   = 280;
  const RADIUS = 126;

  let canvas: HTMLCanvasElement;
  let img: HTMLImageElement;
  let loaded  = $state(false);
  let zoom    = $state(1);
  let minZoom = $state(1);
  let ox = $state(0);
  let oy = $state(0);

  let dragging   = false;
  let dragStartX = 0, dragStartY = 0;
  let dragBaseX  = 0, dragBaseY  = 0;

  function clamp(v: number, lo: number, hi: number) { return Math.min(hi, Math.max(lo, v)); }

  function constrain(x: number, y: number, z: number) {
    const imgW = img.naturalWidth  * z;
    const imgH = img.naturalHeight * z;
    const cx = SIZE / 2, cy = SIZE / 2;
    return {
      x: clamp(x, cx + RADIUS - imgW, cx - RADIUS),
      y: clamp(y, cy + RADIUS - imgH, cy - RADIUS),
    };
  }

  function draw() {
    if (!canvas || !img) return;
    const ctx  = canvas.getContext('2d')!;
    const imgW = img.naturalWidth  * zoom;
    const imgH = img.naturalHeight * zoom;
    const cx = SIZE / 2, cy = SIZE / 2;

    ctx.clearRect(0, 0, SIZE, SIZE);

    // Dimmed full image behind the mask
    ctx.globalAlpha = 0.28;
    ctx.drawImage(img, ox, oy, imgW, imgH);
    ctx.globalAlpha = 1;

    // Sharp image inside the crop circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, ox, oy, imgW, imgH);
    ctx.restore();

    // Circle border
    ctx.beginPath();
    ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function applyZoom(z: number) {
    zoom = clamp(z, minZoom, minZoom * 4);
    const c = constrain(ox, oy, zoom);
    ox = c.x; oy = c.y;
    draw();
  }

  function init() {
    minZoom = Math.max(
      (RADIUS * 2) / img.naturalWidth,
      (RADIUS * 2) / img.naturalHeight,
    );
    zoom = minZoom;
    ox = SIZE / 2 - (img.naturalWidth  * zoom) / 2;
    oy = SIZE / 2 - (img.naturalHeight * zoom) / 2;
    loaded = true;
    draw();
  }

  function onMouseDown(e: MouseEvent) {
    dragging = true;
    dragStartX = e.clientX; dragStartY = e.clientY;
    dragBaseX = ox; dragBaseY = oy;
  }
  function onMouseMove(e: MouseEvent) {
    if (!dragging) return;
    const c = constrain(dragBaseX + (e.clientX - dragStartX), dragBaseY + (e.clientY - dragStartY), zoom);
    ox = c.x; oy = c.y; draw();
  }
  function onMouseUp() { dragging = false; }

  function onTouchStart(e: TouchEvent) {
    e.preventDefault();
    const t = e.touches[0];
    dragging = true;
    dragStartX = t.clientX; dragStartY = t.clientY;
    dragBaseX = ox; dragBaseY = oy;
  }
  function onTouchMove(e: TouchEvent) {
    e.preventDefault();
    if (!dragging) return;
    const t = e.touches[0];
    const c = constrain(dragBaseX + (t.clientX - dragStartX), dragBaseY + (t.clientY - dragStartY), zoom);
    ox = c.x; oy = c.y; draw();
  }

  function apply() {
    const out  = document.createElement('canvas');
    out.width  = 256;
    out.height = 256;
    const octx = out.getContext('2d')!;

    octx.beginPath();
    octx.arc(128, 128, 128, 0, Math.PI * 2);
    octx.clip();

    const scale = 256 / (RADIUS * 2);
    const cropX = SIZE / 2 - RADIUS;
    const cropY = SIZE / 2 - RADIUS;
    const imgW  = img.naturalWidth  * zoom;
    const imgH  = img.naturalHeight * zoom;

    octx.drawImage(img, (ox - cropX) * scale, (oy - cropY) * scale, imgW * scale, imgH * scale);
    out.toBlob(blob => { if (blob) onApply(blob); }, 'image/jpeg', 0.92);
  }

  onMount(() => {
    img = new Image();
    img.onload = init;
    img.src = src;
  });
</script>

<div class="space-y-3">
  <p class="text-xs text-center opacity-40">Drag to reposition · Slider to zoom</p>

  <div class="flex justify-center">
    <canvas
      bind:this={canvas}
      width={SIZE}
      height={SIZE}
      class="rounded-xl border border-base-300 cursor-grab active:cursor-grabbing touch-none bg-base-300"
      style="width:{SIZE}px;height:{SIZE}px"
      onmousedown={onMouseDown}
      onmousemove={onMouseMove}
      onmouseup={onMouseUp}
      onmouseleave={onMouseUp}
      ontouchstart={onTouchStart}
      ontouchmove={onTouchMove}
      ontouchend={() => { dragging = false; }}
    ></canvas>
  </div>

  {#if loaded}
    <div class="flex items-center gap-3">
      <span class="text-xs opacity-40 shrink-0">Zoom</span>
      <input
        type="range"
        class="range range-primary range-xs flex-1"
        min={minZoom}
        max={minZoom * 4}
        step="0.001"
        value={zoom}
        oninput={(e) => applyZoom(Number((e.target as HTMLInputElement).value))}
      />
    </div>
  {/if}

  <div class="flex justify-end gap-2 pt-1">
    <button type="button" class="btn btn-ghost btn-sm" onclick={onCancel}>Cancel</button>
    <button type="button" class="btn btn-primary btn-sm" onclick={apply}>Apply</button>
  </div>
</div>
