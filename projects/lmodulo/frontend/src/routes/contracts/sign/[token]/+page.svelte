<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { Check, X, PenLine, RotateCcw, AlertTriangle, Clock, CheckCircle } from 'lucide-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const token = $derived(page.params.token);

  // Canvas state
  let canvas      = $state<HTMLCanvasElement | null>(null);
  let isDrawing   = $state(false);
  let hasStroke   = $state(false);
  let ctx: CanvasRenderingContext2D | null = null;

  // Form state
  let consent        = $state(false);
  let signing        = $state(false);
  let signErr        = $state('');
  let signDone       = $state(false);
  let signedAt       = $state('');

  // Decline state
  let showDecline    = $state(false);
  let declineReason  = $state('');
  let declining      = $state(false);
  let declineErr     = $state('');
  let declineDone    = $state(false);

  onMount(() => {
    if (!canvas) return;
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#1d1d1f';
      ctx.lineWidth   = 2;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
    }
  });

  function getPos(e: MouseEvent | TouchEvent) {
    const rect = canvas!.getBoundingClientRect();
    if (e instanceof TouchEvent) {
      const t = e.touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDraw(e: MouseEvent | TouchEvent) {
    if (!ctx) return;
    e.preventDefault();
    isDrawing = true;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: MouseEvent | TouchEvent) {
    if (!isDrawing || !ctx) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    hasStroke = true;
  }

  function endDraw() { isDrawing = false; }

  function clearCanvas() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasStroke = false;
  }

  async function submitSignature() {
    if (!hasStroke) { signErr = 'Please draw your signature.'; return; }
    if (!consent)   { signErr = 'You must check the consent box to proceed.'; return; }

    signing = true;
    signErr = '';
    try {
      const signatureData = canvas!.toDataURL('image/png');
      const res = await fetch(`/api/contracts/sign/${token}`, {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ signatureData, consent }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        signErr = (d as any).message ?? 'Failed to submit signature. Please try again.';
        return;
      }
      signDone  = true;
      signedAt  = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      signErr = 'Network error. Please try again.';
    } finally {
      signing = false;
    }
  }

  async function submitDecline() {
    declining  = true;
    declineErr = '';
    try {
      const res = await fetch(`/api/contracts/sign/${token}/decline`, {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ reason: declineReason }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        declineErr = (d as any).message ?? 'Failed to decline. Please try again.';
        return;
      }
      declineDone = true;
    } catch {
      declineErr = 'Network error. Please try again.';
    } finally {
      declining = false;
    }
  }

  function fmtDate(d: string | null | undefined) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
</script>

<svelte:head>
  <title>{data.state === 'pending' ? `Sign: ${(data as any).contract?.title ?? 'Contract'}` : 'Contract Signing'}</title>
</svelte:head>

<div class="min-h-screen bg-base-200 flex flex-col">

  <!-- Brand header -->
  {#if data.state === 'pending'}
    {@const brand = (data as any).brand}
    <header style="background-color:#371840;" class="px-6 py-12">
      <div class="max-w-3xl mx-auto flex flex-col items-center gap-2">
        {#if brand?.logo}
          <img src={brand.logo} alt={brand.name || 'Logo'} style="height:48px;width:auto;max-width:240px;" />
        {:else if brand?.name}
          <span style="font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;font-size:1.5rem;font-weight:300;letter-spacing:0.3em;color:#ffffff;text-transform:uppercase;">
            {brand.name}
          </span>
        {/if}
        <span style="color:rgba(255,255,255,0.35);font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;margin-top:4px;">
          Secure Document Signing
        </span>
      </div>
    </header>
  {/if}

  <main class="flex-1 flex flex-col items-center justify-start py-10 px-4">
    <div class="w-full max-w-3xl flex flex-col gap-6">

      <!-- ── NOT FOUND ── -->
      {#if data.state === 'not_found'}
        <div class="card bg-base-100 shadow-sm p-8 text-center flex flex-col items-center gap-4">
          <AlertTriangle class="size-12 text-error opacity-60" />
          <h1 class="text-xl font-semibold">Signing link not found</h1>
          <p class="text-base-content/60 text-sm">This link is invalid or has been removed. Please contact the sender.</p>
        </div>

      <!-- ── EXPIRED ── -->
      {:else if data.state === 'expired'}
        <div class="card bg-base-100 shadow-sm p-8 text-center flex flex-col items-center gap-4">
          <Clock class="size-12 text-warning opacity-60" />
          <h1 class="text-xl font-semibold">This signing link has expired</h1>
          <p class="text-base-content/60 text-sm">
            The link sent to <strong>{(data as any).signer?.email}</strong> is no longer valid.
            Please contact the sender to request a new signing link.
          </p>
        </div>

      <!-- ── ALREADY SIGNED ── -->
      {:else if data.state === 'already_signed'}
        <div class="card bg-base-100 shadow-sm p-8 text-center flex flex-col items-center gap-4">
          <CheckCircle class="size-12 text-success opacity-70" />
          <h1 class="text-xl font-semibold">Already signed</h1>
          <p class="text-base-content/60 text-sm">
            You already signed this contract
            {#if (data as any).signer?.signedAt}
              on <strong>{fmtDate((data as any).signer.signedAt)}</strong>
            {/if}.
          </p>
        </div>

      <!-- ── DECLINED ── -->
      {:else if data.state === 'declined'}
        <div class="card bg-base-100 shadow-sm p-8 text-center flex flex-col items-center gap-4">
          <X class="size-12 text-error opacity-60" />
          <h1 class="text-xl font-semibold">Signing declined</h1>
          <p class="text-base-content/60 text-sm">You previously declined to sign this contract.</p>
        </div>

      <!-- ── PENDING (main flow) ── -->
      {:else if data.state === 'pending'}
        {@const signer   = (data as any).signer}
        {@const contract = (data as any).contract}

        <!-- Post-sign success state -->
        {#if signDone}
          <div class="card bg-base-100 shadow-sm p-8 text-center flex flex-col items-center gap-4">
            <CheckCircle class="size-12 text-success opacity-70" />
            <h1 class="text-xl font-semibold">Signature recorded</h1>
            <p class="text-base-content/60 text-sm">
              Thank you, <strong>{signer.name}</strong>. Your signature was recorded on <strong>{signedAt}</strong>.
              A confirmation will be sent to <strong>{signer.email}</strong>.
            </p>
          </div>

        <!-- Post-decline success state -->
        {:else if declineDone}
          <div class="card bg-base-100 shadow-sm p-8 text-center flex flex-col items-center gap-4">
            <X class="size-12 text-error opacity-60" />
            <h1 class="text-xl font-semibold">Signing declined</h1>
            <p class="text-base-content/60 text-sm">
              You have declined to sign <strong>{contract.title}</strong>.
              The sender has been notified.
            </p>
          </div>

        {:else}
          <!-- Document header -->
          <div class="card bg-base-100 shadow-sm p-6">
            <p class="text-xs text-base-content/50 uppercase tracking-wide mb-1">Document for your signature</p>
            <h1 class="text-lg font-semibold">{contract.title}</h1>
            <p class="text-sm text-base-content/60 mt-1">
              Signing as <strong>{signer.name}</strong> ({signer.email}) · {signer.role}
            </p>
          </div>

          <!-- Contract content -->
          <div class="card bg-base-100 shadow-sm">
            <div class="card-body p-6 sm:p-10 max-h-[60vh] overflow-y-auto">
              <div class="prose prose-sm max-w-none">
                {@html contract.content ?? '<p class="text-base-content/40 italic">No content.</p>'}
              </div>
            </div>
          </div>

          <!-- Signature section -->
          {#if !showDecline}
            <div class="card bg-base-100 shadow-sm p-6 flex flex-col gap-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <PenLine class="size-4 text-base-content/60" />
                  <h2 class="font-medium text-sm">Draw your signature</h2>
                </div>
                <button
                  type="button"
                  class="btn btn-ghost btn-xs"
                  onclick={clearCanvas}
                  title="Clear"
                >
                  <RotateCcw class="size-3" /> Clear
                </button>
              </div>

              <!-- Canvas pad -->
              <div class="rounded-lg border-2 border-dashed border-base-300 bg-base-50 touch-none relative" style="height: 160px;">
                <canvas
                  bind:this={canvas}
                  class="w-full h-full rounded-lg cursor-crosshair"
                  onmousedown={startDraw}
                  onmousemove={draw}
                  onmouseup={endDraw}
                  onmouseleave={endDraw}
                  ontouchstart={startDraw}
                  ontouchmove={draw}
                  ontouchend={endDraw}
                ></canvas>
                {#if !hasStroke}
                  <p class="absolute inset-0 flex items-center justify-center text-sm text-base-content/30 pointer-events-none select-none">
                    Sign here
                  </p>
                {/if}
              </div>

              <!-- Consent -->
              <label class="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" class="checkbox checkbox-sm mt-0.5" bind:checked={consent} />
                <span class="text-sm text-base-content/70">
                  I have read and agree to this contract. I understand that this electronic signature
                  is legally binding and equivalent to a handwritten signature.
                </span>
              </label>

              {#if signErr}
                <div class="alert alert-error text-sm py-2">{signErr}</div>
              {/if}

              <div class="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  class="btn btn-ghost btn-sm text-error"
                  onclick={() => showDecline = true}
                >
                  <X class="size-4" /> Decline to Sign
                </button>
                <button
                  type="button"
                  class="btn btn-primary"
                  onclick={submitSignature}
                  disabled={signing}
                >
                  <Check class="size-4" />
                  {signing ? 'Submitting…' : 'Sign Document'}
                </button>
              </div>
            </div>

          <!-- Decline form -->
          {:else}
            <div class="card bg-base-100 shadow-sm p-6 flex flex-col gap-4">
              <h2 class="font-medium text-sm text-error flex items-center gap-2">
                <X class="size-4" /> Decline to Sign
              </h2>
              <p class="text-sm text-base-content/60">
                You are declining to sign <strong>{contract.title}</strong>. The sender will be notified.
              </p>

              <label class="form-control">
                <div class="label"><span class="label-text text-sm">Reason (optional)</span></div>
                <textarea
                  class="textarea textarea-bordered text-sm"
                  rows={3}
                  placeholder="Let the sender know why you're declining..."
                  bind:value={declineReason}
                ></textarea>
              </label>

              {#if declineErr}
                <div class="alert alert-error text-sm py-2">{declineErr}</div>
              {/if}

              <div class="flex items-center justify-between gap-3">
                <button type="button" class="btn btn-ghost btn-sm" onclick={() => showDecline = false}>
                  Cancel
                </button>
                <button
                  type="button"
                  class="btn btn-error btn-sm"
                  onclick={submitDecline}
                  disabled={declining}
                >
                  {declining ? 'Submitting…' : 'Confirm Decline'}
                </button>
              </div>
            </div>
          {/if}

          <!-- Footer notice -->
          <p class="text-center text-xs text-base-content/40 pb-6">
            This document was sent to {signer.email} for electronic signature.
            By signing, you agree to conduct this transaction electronically.
          </p>
        {/if}
      {/if}
    </div>
  </main>
</div>

<style>
  :global(body) { overflow-y: auto; }
</style>
