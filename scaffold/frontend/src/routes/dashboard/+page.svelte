<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let progress = $state(65);
</script>

<svelte:head>
  <title>Dashboard</title>
</svelte:head>

<div class="space-y-10">

  <div>
    <h1 class="h1">Dashboard</h1>
    <p class="opacity-60 mt-1">Welcome back, <strong>{data.user?.username}</strong></p>
  </div>

  <section class="space-y-3">
    <h2 class="h3">Buttons</h2>
    <div class="flex flex-wrap gap-3">
      <button class="btn preset-filled-primary-500">Primary</button>
      <button class="btn preset-filled-secondary-500">Secondary</button>
      <button class="btn preset-tonal-primary">Tonal</button>
      <button class="btn preset-outlined-primary-500">Outlined</button>
      <button class="btn preset-filled-surface-200-800">Surface</button>
      <button class="btn preset-filled-error-500">Danger</button>
      <button class="btn preset-filled-success-500">Success</button>
      <button class="btn preset-filled-primary-500 btn-sm">Small</button>
      <button class="btn preset-filled-primary-500 btn-lg">Large</button>
      <button class="btn preset-filled-primary-500" disabled>Disabled</button>
    </div>
  </section>

  <section class="space-y-3">
    <h2 class="h3">Badges</h2>
    <div class="flex flex-wrap gap-3 items-center">
      <span class="badge preset-filled-primary-500">Primary</span>
      <span class="badge preset-filled-secondary-500">Secondary</span>
      <span class="badge preset-tonal-primary">Tonal</span>
      <span class="badge preset-filled-success-500">Success</span>
      <span class="badge preset-filled-warning-500">Warning</span>
      <span class="badge preset-filled-error-500">Error</span>
      <span class="badge preset-filled-surface-200-800">Surface</span>
    </div>
  </section>

  <section class="space-y-3">
    <h2 class="h3">Cards</h2>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="card preset-filled-surface-100-900 p-5 space-y-2">
        <p class="font-semibold">Surface Card</p>
        <p class="text-sm opacity-60">Default background for content areas.</p>
      </div>
      <div class="card preset-tonal-primary p-5 space-y-2">
        <p class="font-semibold">Tonal Card</p>
        <p class="text-sm opacity-60">Subtle primary tint for highlights.</p>
      </div>
      <div class="card preset-filled-primary-500 p-5 space-y-2">
        <p class="font-semibold">Filled Card</p>
        <p class="text-sm opacity-80">Strong brand color emphasis.</p>
      </div>
    </div>
  </section>

  <section class="space-y-3">
    <h2 class="h3">Typography</h2>
    <div class="card preset-filled-surface-100-900 p-6 space-y-2">
      <h1 class="h1">Heading 1</h1>
      <h2 class="h2">Heading 2</h2>
      <h3 class="h3">Heading 3</h3>
      <h4 class="h4">Heading 4</h4>
      <p>Body text - the quick brown fox jumps over the lazy dog.</p>
      <p><a href="#typography" class="anchor">Anchor link</a> - inline navigation.</p>
      <p><code class="code">inline code</code> - for snippets.</p>
      <blockquote class="blockquote">A blockquote for pull quotes and callouts.</blockquote>
    </div>
  </section>

  <section class="space-y-3">
    <h2 class="h3">Form Inputs</h2>
    <div class="card preset-filled-surface-100-900 p-6 space-y-4 max-w-md">
      <label class="label">
        <span class="label-text">Text input</span>
        <input class="input" type="text" placeholder="Enter value" />
      </label>
      <label class="label">
        <span class="label-text">Select</span>
        <select class="select">
          <option>Option A</option>
          <option>Option B</option>
          <option>Option C</option>
        </select>
      </label>
      <label class="label">
        <span class="label-text">Textarea</span>
        <textarea class="textarea" rows="3" placeholder="Enter notes"></textarea>
      </label>
      <div class="flex gap-6">
        <label class="flex items-center gap-2 cursor-pointer">
          <input class="checkbox" type="checkbox" checked />
          <span class="text-sm">Checkbox</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input class="radio" type="radio" name="demo" checked />
          <span class="text-sm">Radio</span>
        </label>
      </div>
    </div>
  </section>

  <section class="space-y-3">
    <h2 class="h3">Progress</h2>
    <div class="card preset-filled-surface-100-900 p-6 space-y-4 max-w-md">
      <label class="label">
        <span class="label-text">Value: {progress}%</span>
        <input class="input" type="range" min="0" max="100" bind:value={progress} />
      </label>
      <progress class="progress" value={progress} max="100"></progress>
    </div>
  </section>

  <section class="space-y-3">
    <h2 class="h3">Session</h2>
    <div class="card preset-filled-surface-100-900 p-6">
      <dl class="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
        <dt class="font-semibold opacity-60">Username</dt>
        <dd>{data.user?.username}</dd>
        <dt class="font-semibold opacity-60">Email</dt>
        <dd>{data.user?.email}</dd>
        <dt class="font-semibold opacity-60">User ID</dt>
        <dd class="font-mono text-xs opacity-50">{data.user?.id}</dd>
      </dl>
    </div>
  </section>

</div>