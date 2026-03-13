<script lang="ts">
  import { logo } from '$lib/config/logo';

  let { class: cls = '' }: { class?: string } = $props();
</script>

<span class="logo-brand {cls}">
  <img src={logo.image} alt="" class="logo-icon" aria-hidden="true" />
  <span class="logo-text">{logo.text}</span>
</span>

<style>
  .logo-brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    text-decoration: none;
  }

  .logo-icon {
    width: 1.5rem;
    height: 1.5rem;
  }
</style>
