<script lang="ts">
  import MarketingNav from '$lib/components/MarketingNav.svelte';
  import PublicFooter from '$lib/components/PublicFooter.svelte';
  import { activeDiscount, applyDiscount, formatPrice } from '$lib/utils/price';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const products = $derived(data.products ?? []);

  function productSalePrice(product: any) {
    const sale = activeDiscount(product.discounts ?? []);
    return sale ? applyDiscount(product.basePrice, sale) : null;
  }

  function productSale(product: any) {
    return activeDiscount(product.discounts ?? []);
  }
</script>

<svelte:head>
  <title>Potency By Potamus — Holistic Wellness Products</title>
  <meta name="description" content="Natural balms, bath soaps, and holistic wellness products handcrafted with care. Shop online or visit us in Endicott, WA." />
</svelte:head>

<MarketingNav />

<div class="page-wrap">

  <!-- ── HERO ──────────────────────────────────────────────── -->
  <section class="hero">
    <div class="hero-left">
      <img src="/logo.png" alt="Potency By Potamus" class="hero-logo-img" />
      <h1 class="hero-headline">Feel Better.<br />Hurt Less.</h1>
      <p class="hero-founder">Handcrafted by Nick in Endicott, WA — for his family, and yours.</p>
      <div class="hero-actions">
        <a href="/shop" class="btn preset-filled-primary-500">Shop Products</a>
        <a href="/about-me" class="btn preset-tonal-surface">Our Story</a>
      </div>
    </div>
    <div class="hero-right" aria-hidden="true">
      <img src="/principle.jpg" alt="" class="hero-portrait" />
      <div class="hero-right-overlay"></div>
    </div>
  </section>

  <!-- ── TRUST BAR ──────────────────────────────────────────── -->
  <div class="trust-bar">
    {#each [
      { icon: '🔬', text: 'Third-Party Lab Tested' },
      { icon: '🌿', text: 'Less Than 0.3% THC' },
      { icon: '🤲', text: 'Small-Batch Handcrafted' },
    ] as item}
      <div class="trust-item">
        <span class="trust-icon">{item.icon}</span>
        <span class="trust-text">{item.text}</span>
      </div>
    {/each}
  </div>

  <!-- ── BEST SELLERS ──────────────────────────────────────── -->
  {#if products.length > 0}
    <section class="section">
      <div class="section-inner">
        <p class="section-label">Best Sellers</p>
        <h2 class="section-heading">Our Most Loved Products</h2>
        <div class="product-grid">
          {#each products as product (product.id)}
            {@const sale = productSale(product)}
            {@const salePrice = productSalePrice(product)}
            {@const img = product.images?.[0]}
            <a
              href="/shop/{product.categorySlug ?? product.category}/{product.slug}"
              class="product-card"
            >
              <div class="product-img-wrap">
                {#if img}
                  <img src={img} alt={product.name} class="product-img" />
                {:else}
                  <div class="product-img-placeholder"></div>
                {/if}
                {#if sale}
                  <span class="product-badge">
                    {sale.type === 'percentage' ? `-${sale.value}%` : 'SALE'}
                  </span>
                {/if}
              </div>
              <div class="product-info">
                <p class="product-name">{product.name}</p>
                <div class="product-price">
                  {#if salePrice !== null}
                    <span class="price-original">{formatPrice(product.basePrice)}</span>
                    <span class="price-sale">{formatPrice(salePrice)}</span>
                  {:else}
                    <span class="price-base">{formatPrice(product.basePrice)}</span>
                  {/if}
                </div>
              </div>
            </a>
          {/each}
        </div>
        <div class="section-cta">
          <a href="/shop" class="btn preset-tonal-surface">View All Products</a>
        </div>
      </div>
    </section>
  {/if}

  <!-- ── ABOUT ─────────────────────────────────────────────── -->
  <section class="section section-alt">
    <div class="section-inner about-grid">
      <div class="about-text">
        <p class="section-label">Our Story</p>
        <h2 class="section-heading">Crafted with Care</h2>
        <p class="about-body">
          Potency By Potamus was born from a love of plants, healing, and community.
          Every product is small-batch, handcrafted in the Pacific Northwest using
          thoughtfully sourced botanicals and skin-loving ingredients.
        </p>
        <p class="about-body">
          Whether you're soothing tired muscles with a warming balm or unwinding with
          one of our artisan bath soaks, you're bringing a little of the wild into
          your daily ritual.
        </p>
      </div>
      <div class="about-values">
        {#each [
          { icon: '🌿', label: 'Plant-Based Ingredients' },
          { icon: '🤲', label: 'Small-Batch, Handcrafted' },
          { icon: '💚', label: 'Made with Intention' },
          { icon: '🌲', label: 'Pacific Northwest Rooted' }
        ] as item}
          <div class="value-item">
            <span class="value-icon">{item.icon}</span>
            <span class="value-label">{item.label}</span>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- ── LOCATIONS ─────────────────────────────────────────── -->
  <section class="section" id="locations">
    <div class="section-inner">
      <p class="section-label">Where to Find Us</p>
      <h2 class="section-heading">Online &amp; In Person</h2>
      <div class="locations-grid">

        <div class="location-card">
          <div class="location-icon">🛒</div>
          <h3 class="location-title">Online Store</h3>
          <p class="location-body">
            Shop our full catalog anytime. Orders ship across the US.
            New products drop regularly — follow us to stay in the loop.
          </p>
          <a href="/shop" class="btn preset-filled-primary-500 location-btn">Shop Online</a>
        </div>

        <div class="location-card">
          <div class="location-icon">🏪</div>
          <h3 class="location-title">Visit Us in Endicott</h3>
          <p class="location-body">
            Come see us in person at our home base in Endicott, WA. Bring your questions
            — we love talking about what goes into each product.
          </p>
          <address class="location-address">
            <strong>Potency By Potamus</strong><br />
            207 C Street<br />
            Endicott, WA 99125<br />
            <a href="tel:+15099875588">(509) 987-5588</a>
          </address>
        </div>

        <div class="location-card">
          <div class="location-icon">🎪</div>
          <h3 class="location-title">Festival Events</h3>
          <p class="location-body">
            We travel year-round to festivals and markets across the Pacific Northwest.
            Follow us on social media to find out where we'll be next.
          </p>
          <div class="social-row">
            <a
              href="https://facebook.com/potencybypotamus"
              class="social-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <svg class="social-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
              </svg>
              Facebook
            </a>
            <a
              href="https://instagram.com/potencybypotamus"
              class="social-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <svg class="social-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              Instagram
            </a>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- ── CONTACT ───────────────────────────────────────────── -->
  <section class="section section-alt">
    <div class="section-inner contact-inner">
      <p class="section-label">Get in Touch</p>
      <h2 class="section-heading">We'd Love to Hear from You</h2>
      <div class="contact-details">
        <div class="contact-item">
          <span class="contact-icon">📍</span>
          <div>
            <strong>Potency By Potamus</strong><br />
            207 C Street, Endicott, WA 99125
          </div>
        </div>
        <div class="contact-item">
          <span class="contact-icon">📞</span>
          <a href="tel:+15099875588">(509) 987-5588</a>
        </div>
        <div class="contact-item">
          <span class="contact-icon">✉️</span>
          <a href="mailto:potencybypotamus@gmail.com">potencybypotamus@gmail.com</a>
        </div>
      </div>
    </div>
  </section>

  <PublicFooter />

</div>

<style>
  .page-wrap {
    min-height: 100vh;
    background: var(--body-background-color);
    font-family: var(--base-font-family);
    font-weight: var(--base-font-weight);
  }

  :global(.dark) .page-wrap {
    background: var(--body-background-color-dark);
  }

  /* ── HERO ──────────────────────────────────────────────── */
  .hero {
    display: grid;
    grid-template-columns: 1fr 1fr;
    min-height: calc(100vh - 3.5rem);
    margin-top: 3.5rem;
  }

  @media (max-width: 767px) {
    .hero {
      grid-template-columns: 1fr;
      min-height: auto;
    }
  }

  /* Left panel */
  .hero-left {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: calc(var(--spacing) * 20) calc(var(--spacing) * 12);
    background: color-mix(in oklch, var(--color-primary-500) 12%, var(--body-background-color));
  }

  :global(.dark) .hero-left {
    background: color-mix(in oklch, var(--color-primary-500) 10%, var(--body-background-color-dark));
  }

  @media (max-width: 767px) {
    .hero-left {
      padding: calc(var(--spacing) * 16) calc(var(--spacing) * 8) calc(var(--spacing) * 10);
      align-items: center;
      text-align: center;
    }
  }

  .hero-logo-img {
    width: min(22rem, 75vw);
    height: auto;
    margin-bottom: calc(var(--spacing) * 8);
  }

  .hero-headline {
    font-size: clamp(2.25rem, 4.5vw, 3.5rem);
    font-family: var(--heading-font-family);
    font-weight: var(--heading-font-weight);
    color: var(--color-surface-950);
    line-height: 1.1;
    margin: 0 0 calc(var(--spacing) * 5);
  }

  :global(.dark) .hero-headline {
    color: var(--color-surface-50);
  }

  .hero-founder {
    font-size: 0.9375rem;
    color: var(--color-surface-400);
    line-height: 1.6;
    margin: 0 0 calc(var(--spacing) * 10);
    max-width: 28rem;
  }

  :global(.dark) .hero-founder {
    color: var(--color-surface-400);
  }

  .hero-actions {
    display: flex;
    gap: calc(var(--spacing) * 4);
    flex-wrap: wrap;
  }

  @media (max-width: 767px) {
    .hero-actions {
      justify-content: center;
    }
  }

  /* Right panel — portrait */
  .hero-right {
    position: relative;
    overflow: hidden;
    min-height: 28rem;
  }

  .hero-portrait {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
  }

  .hero-right-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      color-mix(in oklch, var(--color-primary-500) 55%, transparent) 0%,
      color-mix(in oklch, var(--color-primary-900) 35%, transparent) 100%
    );
  }

  :global(.dark) .hero-right-overlay {
    background: linear-gradient(
      135deg,
      color-mix(in oklch, var(--color-primary-700) 55%, transparent) 0%,
      color-mix(in oklch, var(--color-primary-950) 45%, transparent) 100%
    );
  }

  /* ── TRUST BAR ─────────────────────────────────────────── */
  .trust-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: calc(var(--spacing) * 12);
    padding: calc(var(--spacing) * 5) calc(var(--spacing) * 8);
    background: color-mix(in oklch, var(--color-primary-500) 8%, transparent);
    border-bottom: var(--default-border-width) solid color-mix(in oklch, var(--color-primary-500) 15%, transparent);
    flex-wrap: wrap;
  }

  :global(.dark) .trust-bar {
    background: color-mix(in oklch, var(--color-primary-500) 10%, transparent);
    border-bottom-color: color-mix(in oklch, var(--color-primary-500) 20%, transparent);
  }

  .trust-item {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing) * 2);
  }

  .trust-icon {
    font-size: 1.1rem;
  }

  .trust-text {
    font-size: 0.8125rem;
    font-weight: 500;
    letter-spacing: 0.04em;
    color: var(--color-surface-600);
    text-transform: uppercase;
  }

  :global(.dark) .trust-text {
    color: var(--color-surface-300);
  }

  /* ── SECTIONS ──────────────────────────────────────────── */
  .section {
    padding: calc(var(--spacing) * 24) calc(var(--spacing) * 8);
  }

  .section-alt {
    background: color-mix(in oklch, var(--color-surface-950) 3%, transparent);
  }

  :global(.dark) .section-alt {
    background: color-mix(in oklch, var(--color-surface-50) 4%, transparent);
  }

  .section-inner {
    max-width: 72rem;
    margin: 0 auto;
  }

  .section-label {
    font-size: 0.6875rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--color-primary-500);
    margin: 0 0 calc(var(--spacing) * 3);
  }

  .section-heading {
    font-size: clamp(1.75rem, 4vw, 2.75rem);
    font-family: var(--heading-font-family);
    font-weight: var(--heading-font-weight);
    color: var(--color-surface-950);
    margin: 0 0 calc(var(--spacing) * 12);
    line-height: 1.2;
  }

  :global(.dark) .section-heading {
    color: var(--color-surface-50);
  }

  .section-cta {
    display: flex;
    justify-content: center;
    margin-top: calc(var(--spacing) * 12);
  }

  /* ── PRODUCTS ──────────────────────────────────────────── */
  .product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
    gap: calc(var(--spacing) * 8);
  }

  .product-card {
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing) * 4);
    transition: transform 250ms;
  }

  .product-card:hover {
    transform: translateY(-2px);
  }

  .product-img-wrap {
    position: relative;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    background: color-mix(in oklch, var(--color-surface-950) 5%, transparent);
  }

  :global(.dark) .product-img-wrap {
    background: color-mix(in oklch, var(--color-surface-50) 8%, transparent);
  }

  .product-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 500ms;
  }

  .product-card:hover .product-img {
    transform: scale(1.05);
  }

  .product-img-placeholder {
    width: 100%;
    height: 100%;
  }

  .product-badge {
    position: absolute;
    top: calc(var(--spacing) * 3);
    right: calc(var(--spacing) * 3);
    padding: calc(var(--spacing) * 1) calc(var(--spacing) * 3);
    font-size: 0.6875rem;
    background: var(--color-error-500);
    color: white;
  }

  .product-info {
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing) * 2);
  }

  .product-name {
    font-size: 0.9375rem;
    color: var(--color-surface-700);
    margin: 0;
  }

  :global(.dark) .product-name {
    color: var(--color-surface-200);
  }

  .product-price {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing) * 2);
  }

  .price-base {
    font-size: 1rem;
    color: var(--color-surface-700);
  }

  :global(.dark) .price-base {
    color: var(--color-surface-100);
  }

  .price-original {
    font-size: 0.875rem;
    text-decoration: line-through;
    opacity: 0.5;
    color: var(--color-surface-500);
  }

  .price-sale {
    font-size: 1rem;
    color: var(--color-error-600);
  }

  :global(.dark) .price-sale {
    color: var(--color-error-400);
  }

  /* ── ABOUT ─────────────────────────────────────────────── */
  .about-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: calc(var(--spacing) * 16);
  }

  @media (min-width: 1024px) {
    .about-grid {
      grid-template-columns: 1fr 1fr;
      align-items: center;
    }
  }

  .about-text .section-heading {
    margin-bottom: calc(var(--spacing) * 6);
  }

  .about-body {
    font-size: 1rem;
    line-height: 1.75;
    color: var(--color-surface-400);
    margin: 0 0 calc(var(--spacing) * 5);
  }

  :global(.dark) .about-body {
    color: var(--color-surface-300);
  }

  .about-values {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: calc(var(--spacing) * 4);
  }

  .value-item {
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing) * 2);
    padding: calc(var(--spacing) * 6);
    background: color-mix(in oklch, var(--color-secondary-500) 8%, transparent);
    border: var(--default-border-width) solid color-mix(in oklch, var(--color-secondary-500) 20%, transparent);
  }

  :global(.dark) .value-item {
    background: color-mix(in oklch, var(--color-secondary-500) 7%, transparent);
    border-color: color-mix(in oklch, var(--color-secondary-500) 18%, transparent);
  }

  .value-icon {
    font-size: 1.5rem;
  }

  .value-label {
    font-size: 0.875rem;
    color: var(--color-surface-500);
  }

  :global(.dark) .value-label {
    color: var(--color-surface-300);
  }

  /* ── LOCATIONS ─────────────────────────────────────────── */
  .locations-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: calc(var(--spacing) * 8);
  }

  @media (min-width: 768px) {
    .locations-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .location-card {
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing) * 4);
    padding: calc(var(--spacing) * 8);
    background: color-mix(in oklch, var(--color-secondary-500) 8%, transparent);
    border: var(--default-border-width) solid color-mix(in oklch, var(--color-secondary-500) 20%, transparent);
  }

  :global(.dark) .location-card {
    background: color-mix(in oklch, var(--color-secondary-500) 7%, transparent);
    border-color: color-mix(in oklch, var(--color-secondary-500) 18%, transparent);
  }

  .location-icon {
    font-size: 2rem;
  }

  .location-title {
    font-size: 1.0625rem;
    font-family: var(--heading-font-family);
    font-weight: var(--heading-font-weight);
    color: var(--color-surface-950);
    margin: 0;
  }

  :global(.dark) .location-title {
    color: var(--color-surface-50);
  }

  .location-body {
    font-size: 0.9rem;
    line-height: 1.7;
    color: var(--color-surface-400);
    margin: 0;
    flex: 1;
  }

  :global(.dark) .location-body {
    color: var(--color-surface-300);
  }

  .location-btn {
    align-self: flex-start;
  }

  .location-address {
    font-size: 0.875rem;
    font-style: normal;
    line-height: 1.8;
    color: var(--color-surface-400);
  }

  :global(.dark) .location-address {
    color: var(--color-surface-300);
  }

  .location-address a {
    color: var(--color-primary-500);
    text-decoration: none;
  }

  .location-address a:hover {
    text-decoration: underline;
  }

  .social-row {
    display: flex;
    gap: calc(var(--spacing) * 4);
    align-items: center;
  }

  .social-link {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing) * 2);
    font-size: 0.875rem;
    color: var(--color-surface-400);
    text-decoration: none;
    transition: color 150ms;
  }

  :global(.dark) .social-link {
    color: var(--color-surface-300);
  }

  .social-link:hover {
    color: var(--color-primary-500);
  }

  .social-icon {
    width: 1.125rem;
    height: 1.125rem;
    flex-shrink: 0;
  }

  /* ── CONTACT ───────────────────────────────────────────── */
  .contact-inner {
    text-align: center;
  }

  .contact-inner .section-heading {
    margin-bottom: calc(var(--spacing) * 10);
  }

  .contact-details {
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing) * 5);
    align-items: center;
  }

  .contact-item {
    display: flex;
    align-items: center;
    gap: calc(var(--spacing) * 3);
    font-size: 0.9375rem;
    color: var(--color-surface-500);
  }

  :global(.dark) .contact-item {
    color: var(--color-surface-300);
  }

  .contact-item strong {
    color: var(--color-surface-700);
  }

  :global(.dark) .contact-item strong {
    color: var(--color-surface-100);
  }

  .contact-item a {
    color: var(--color-primary-500);
    text-decoration: none;
  }

  .contact-item a:hover {
    text-decoration: underline;
  }

  .contact-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

</style>
