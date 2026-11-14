<script lang="ts">
  // Errors on public CMS pages (mostly 404s) render inside the site shell.
  import { page } from '$app/state';

  const notFound = $derived(page.status === 404);
</script>

<svelte:head><title>{notFound ? 'Page not found' : 'Something went wrong'}</title></svelte:head>

<div class="max-w-3xl mx-auto px-4 py-24 text-center flex flex-col items-center gap-4">
  <p class="text-7xl font-bold opacity-15 leading-none">{page.status}</p>
  <h1 class="text-3xl font-bold">{notFound ? 'Page not found' : 'Something went wrong'}</h1>
  <p class="opacity-70 max-w-md">
    {notFound ? "The page you're looking for doesn't exist or has moved." : 'Please try again in a moment.'}
  </p>
  <a href="/" class="btn btn-primary mt-2">Go to the home page</a>
</div>
