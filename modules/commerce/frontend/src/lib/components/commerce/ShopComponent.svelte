<script lang="ts">
  // The storefront: the product grid, filtered by category or tag, or one product, from loadShop's data
  // ($lib/utils/storefront.ts). It's Commerce's only storefront UI, mounted twice:
  //   - Commerce's own /shop (routes/shop/[...rest]), for projects without Content;
  //   - the Shop page type Commerce adds to Content (registry entry $lib/config/cms-components/shop.ts).
  // Either way the page around it shows the heading and breadcrumbs (from shopSubpage), so this starts with the
  // content. A product's description is rich text from the product page, rendered by RichTextView (never as raw
  // HTML); everything else is text. Inside Content the description takes the site's text styles from the
  // `cms-prose` class, which the Content page loads; the fallback styles below cover /shop. This file must not
  // import Content's code or styles (Commerce has to build without Content).
  // There's no checkout yet, so "Add to cart" stays disabled. A product that doesn't track inventory never shows
  // stock or "Out of stock".
  import { fade } from 'svelte/transition';
  import { ShoppingBag, ChevronLeft, ChevronRight, ArrowLeft, X } from 'lucide-svelte';
  import {
    categoryHref, categoryOf, formatPrice, fromPrice, productHref, quantityOffers, saleBadge, saleOf, salePrice,
    type ShopData, type ShopList, type ShopProduct,
  } from '$lib/utils/storefront';
  import { isRichTextEmpty } from '$lib/utils/richText';
  import RichTextView from './RichTextView.svelte';

  // Content also passes `props`, `mode` and `rest` (its CmsComponentProps); the shop needs only its load's data
  let { data }: { data: unknown; props?: Record<string, unknown>; mode?: 'page' | 'block'; rest?: string | null } = $props();

  const shop = $derived(data as ShopData | undefined);
  const list = $derived(shop && 'view' in shop && shop.view === 'list' ? shop : null);
  const item = $derived(shop && 'view' in shop && shop.view === 'product' ? shop : null);
  const unavailable = $derived(!!shop && 'unavailable' in shop);

  // ── List ──
  function listHref(l: ShopList, page: number, tag: string | null = l.tag): string {
    const q = new URLSearchParams();
    if (tag) q.set('tag', tag);
    if (page > 1) q.set('page', String(page));
    const qs = q.toString();
    return (l.category ? categoryHref(l.base, l.category) : l.base) + (qs ? `?${qs}` : '');
  }
  function shownRange(l: ShopList): string {
    const noun = l.total === 1 ? 'product' : 'products';
    if (l.pages <= 1) return `${l.total} ${noun}`;
    const first = (l.page - 1) * l.perPage + 1;
    return `${first}–${first + l.products.length - 1} of ${l.total} ${noun}`;
  }

  // ── One product ──
  const product = $derived(item?.product ?? null);
  let photo = $state(0);
  const photoUrl = $derived(product?.images[Math.min(photo, product.images.length - 1)] ?? '');

  /** what the visitor picked; an option with a single value counts as picked */
  let picked = $state<Record<string, string>>({});
  const chosen = $derived({
    ...Object.fromEntries((product?.options ?? []).filter(o => o.values.length === 1).map(o => [o.name, o.values[0]])),
    ...picked,
  });
  const missing = $derived((product?.options ?? []).filter(o => !chosen[o.name]).map(o => o.name));
  const variant = $derived(
    product && product.variants.length && missing.length === 0
      ? product.variants.find(v => product.options.every(o => v.combination[o.name] === chosen[o.name])) ?? null
      : null,
  );
  const sale = $derived(product ? saleOf(product) : null);
  const price = $derived.by(() => {
    if (!product) return { cents: 0, from: false };
    if (variant) return { cents: variant.price ?? product.basePrice, from: false };
    if (product.variants.length) { const f = fromPrice(product); return { cents: f.cents, from: f.varies }; }
    return { cents: product.basePrice, from: false };
  });
  // Products that don't track inventory (donations, say) are always available: no stock wording at all
  const stock = $derived.by((): { text: string; tone: string } | null => {
    if (!product?.variants.length) return null;
    const tracked = product.trackInventory;
    if (missing.length) {
      if (!tracked) return null;
      return product.variants.every(v => v.stock === 0)
        ? { text: 'Out of stock', tone: 'text-error' }
        : { text: `Choose ${missing.join(' and ').toLowerCase()} to see availability`, tone: 'opacity-70' };
    }
    if (!variant) return { text: "This combination isn't available", tone: 'text-error' };
    if (!tracked) return null;
    if (variant.stock === 0) return { text: 'Out of stock', tone: 'text-error' };
    if (variant.stock <= (variant.lowStockThreshold ?? 5)) return { text: `Only ${variant.stock} left`, tone: 'text-warning' };
    return { text: 'In stock', tone: 'text-success' };
  });
  const offers = $derived(product ? quantityOffers(product) : []);
  const productCategory = $derived(item && product ? categoryOf(item.categories, product) : null);
</script>

{#snippet placeholder(iconClass: string)}
  <div class="shop__ph absolute inset-0 grid place-items-center" aria-hidden="true">
    <ShoppingBag class={iconClass} strokeWidth={1.25} />
  </div>
{/snippet}

{#snippet priceTag(cents: number, from: boolean, onSale: typeof sale, size: string)}
  <span class="inline-flex flex-wrap items-baseline gap-x-2 {size}">
    {#if from}<span class="opacity-70 text-[0.85em]">From</span>{/if}
    {#if onSale}
      <span class="sr-only">Was</span><s class="opacity-55 text-[0.85em]">{formatPrice(cents)}</s>
      <span class="sr-only">now</span><span class="font-semibold">{formatPrice(salePrice(cents, onSale))}</span>
    {:else}
      <span class="font-semibold">{formatPrice(cents)}</span>
    {/if}
  </span>
{/snippet}

{#snippet card(l: ShopList, p: ShopProduct)}
  {@const onSale = saleOf(p)}
  {@const from = fromPrice(p)}
  <a href={productHref(l.base, l.categories, p)} class="group flex flex-col gap-3 rounded-box outline-offset-4">
    <div class="relative aspect-square overflow-hidden rounded-box bg-base-200">
      {#if p.images[0]}
        <img src={p.images[0]} alt="" loading="lazy" class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      {:else}
        {@render placeholder('size-10')}
      {/if}
      {#if onSale}<span class="badge badge-accent absolute top-3 left-3 font-semibold">{saleBadge(onSale)}</span>{/if}
    </div>
    <div class="flex flex-col gap-1 px-0.5">
      <h3 class="shop__name break-words underline-offset-4 decoration-1 group-hover:underline">{p.name}</h3>
      {@render priceTag(from.cents, from.varies, onSale, 'text-sm')}
    </div>
  </a>
{/snippet}

{#if list}
  {@const l = list}
  <div class="commerce-shop not-prose flex flex-col gap-6 md:gap-8">
    {#if l.category?.description}
      <p class="max-w-2xl text-lg leading-relaxed opacity-85 whitespace-pre-line">{l.category.description}</p>
    {/if}

    {#if l.categories.length}
      <nav aria-label="Categories">
        <ul class="flex flex-wrap gap-2">
          <li>
            <a href={l.base} class="btn btn-sm rounded-full {l.category ? 'btn-ghost bg-base-200 hover:bg-base-300' : 'btn-neutral'}" aria-current={l.category ? undefined : 'page'}>All</a>
          </li>
          {#each l.categories as c (c.id)}
            <li>
              <a href={categoryHref(l.base, c)} class="btn btn-sm rounded-full {l.category?.id === c.id ? 'btn-neutral' : 'btn-ghost bg-base-200 hover:bg-base-300'}" aria-current={l.category?.id === c.id ? 'page' : undefined}>{c.name}</a>
            </li>
          {/each}
        </ul>
      </nav>
    {/if}

    {#if l.total > 0 || l.tag}
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        {#if l.total > 0}<p class="opacity-70">{shownRange(l)}</p>{/if}
        {#if l.tag}
          <a href={listHref(l, 1, null)} class="badge badge-lg gap-1.5 bg-base-200 border-base-300 hover:bg-base-300" aria-label="Tagged {l.tag}: show all products">
            Tagged “{l.tag}” <X class="size-3.5" aria-hidden="true" />
          </a>
        {/if}
      </div>
    {/if}

    {#if l.products.length}
      <h2 class="sr-only">Products</h2>
      <ul class="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
        {#each l.products as p (p.id)}
          <li>{@render card(l, p)}</li>
        {/each}
      </ul>

      {#if l.pages > 1}
        <nav aria-label="Pages" class="flex items-center justify-between gap-3 border-t border-base-300 pt-6">
          {#if l.page > 1}
            <a href={listHref(l, l.page - 1)} class="btn btn-ghost btn-sm" rel="prev"><ChevronLeft class="size-4" />Previous</a>
          {:else}<span></span>{/if}
          <p class="text-sm opacity-70">Page {l.page} of {l.pages}</p>
          {#if l.page < l.pages}
            <a href={listHref(l, l.page + 1)} class="btn btn-ghost btn-sm" rel="next">Next<ChevronRight class="size-4" /></a>
          {:else}<span></span>{/if}
        </nav>
      {/if}
    {:else}
      <div class="rounded-box border border-dashed border-base-300 px-6 py-12 text-center flex flex-col items-center gap-3">
        <ShoppingBag class="size-8 opacity-40" strokeWidth={1.5} aria-hidden="true" />
        {#if l.total > 0}
          <p class="opacity-75">There's nothing on this page.</p>
          <a href={listHref(l, 1)} class="btn btn-sm btn-ghost bg-base-200">Go to the first page</a>
        {:else if l.tag}
          <p class="opacity-75">No products are tagged “{l.tag}”.</p>
          <a href={listHref(l, 1, null)} class="btn btn-sm btn-ghost bg-base-200">Show all products</a>
        {:else if l.category}
          <p class="opacity-75">There are no products in this category yet.</p>
          <a href={l.base} class="btn btn-sm btn-ghost bg-base-200">See all products</a>
        {:else}
          <p class="opacity-75">There are no products in the shop yet. Please check back soon.</p>
        {/if}
      </div>
    {/if}
  </div>
{:else if item && product}
  {@const p = product}
  <div class="commerce-shop not-prose grid gap-8 md:gap-10 lg:grid-cols-2 lg:gap-14 items-start">
    <!-- Photos -->
    <div class="flex flex-col gap-3 lg:sticky lg:top-24">
      <div class="relative aspect-square overflow-hidden rounded-box bg-base-200">
        {#if photoUrl}
          {#key photoUrl}
            <img src={photoUrl} alt={p.images.length > 1 ? `${p.name}, photo ${photo + 1} of ${p.images.length}` : p.name} class="absolute inset-0 size-full object-cover" in:fade={{ duration: 200 }} />
          {/key}
        {:else}
          {@render placeholder('size-16')}
        {/if}
        {#if sale}<span class="badge badge-accent badge-lg absolute top-4 left-4 font-semibold">{saleBadge(sale)}</span>{/if}
      </div>
      {#if p.images.length > 1}
        <ul class="flex flex-wrap gap-2" aria-label="Photos">
          {#each p.images as img, i (i)}
            <li>
              <button
                type="button"
                class="block size-16 sm:size-20 overflow-hidden rounded-field border-2 transition-[border-color,opacity] {photo === i ? 'border-primary' : 'border-transparent opacity-75 hover:opacity-100'}"
                aria-label="Show photo {i + 1} of {p.images.length}"
                aria-pressed={photo === i}
                onclick={() => (photo = i)}
              ><img src={img} alt="" loading="lazy" class="size-full object-cover" /></button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <!-- Details -->
    <div class="flex flex-col gap-6 min-w-0">
      <div class="flex flex-col gap-2">
        {@render priceTag(price.cents, price.from, sale, 'text-2xl')}
        {#if offers.length}
          <ul class="flex flex-col gap-1 text-sm">
            {#each offers as offer}<li class="text-secondary font-medium">{offer}</li>{/each}
          </ul>
        {/if}
      </div>

      {#if !isRichTextEmpty(p.description)}
        <RichTextView html={p.description} class="cms-prose shop__desc" />
      {/if}

      {#if p.options.length}
        <div class="flex flex-col gap-5">
          {#each p.options as opt, oi (opt.name)}
            <fieldset class="flex flex-col gap-2 min-w-0">
              <legend class="text-sm font-semibold mb-2">
                {opt.name}{#if chosen[opt.name]}<span class="font-normal opacity-70">: {chosen[opt.name]}</span>{/if}
              </legend>
              <div class="flex flex-wrap gap-2">
                {#each opt.values as value (value)}
                  {@const on = chosen[opt.name] === value}
                  <label class="btn btn-sm rounded-full has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary {on ? 'btn-neutral' : 'btn-ghost bg-base-200 hover:bg-base-300'}">
                    <input type="radio" class="sr-only" name="shop-option-{oi}" {value} checked={on} onchange={() => (picked = { ...picked, [opt.name]: value })} />
                    {value}
                  </label>
                {/each}
              </div>
            </fieldset>
          {/each}
        </div>
      {/if}

      <div class="flex flex-col gap-2">
        <p class="text-sm font-medium min-h-5 {stock?.tone ?? ''}" aria-live="polite">{stock?.text ?? ''}</p>
        <button type="button" class="btn btn-primary btn-block rounded-full" disabled>Add to cart</button>
        <p class="text-xs opacity-60 text-center">Online ordering is coming soon.</p>
      </div>

      {#if p.tags.length}
        <div class="flex flex-wrap items-center gap-2 border-t border-base-300 pt-5 text-sm">
          <span class="opacity-70">Tagged</span>
          {#each p.tags as tag (tag)}
            <a href="{item.base}?tag={encodeURIComponent(tag)}" class="badge bg-base-200 border-base-300 hover:bg-base-300">{tag}</a>
          {/each}
        </div>
      {/if}

      <a href={productCategory ? categoryHref(item.base, productCategory) : item.base} class="inline-flex items-center gap-1.5 self-start text-sm font-medium link link-hover">
        <ArrowLeft class="size-4" aria-hidden="true" />
        {productCategory ? `More in ${productCategory.name}` : 'All products'}
      </a>
    </div>
  </div>
{:else if unavailable}
  <p class="commerce-shop text-sm opacity-60">The shop is unavailable right now. Please try again later.</p>
{/if}

<style>
  /* app.css sizes h1–h6 outside any CSS layer, so a Tailwind size class can't shrink a card's heading */
  .shop__name { font-size: 1.0625rem; line-height: 1.35; font-weight: 600; }
  .shop__ph { color: color-mix(in oklch, var(--color-base-content) 25%, transparent); }

  /* The description (RichTextView's element, so these are global) where nothing else styles it: Commerce's /shop,
     where Tailwind's preflight has reset its spacing and list markers. :where() gives them no specificity, so inside
     a Content page the site's .cms-prose rules win; the values match cms-prose.css. */
  :global(:where(.shop__desc)) { font-size: 1.0625rem; line-height: 1.75; overflow-wrap: break-word; }
  :global(:where(.shop__desc) > * + *) { margin-top: 1em; }
  :global(:where(.shop__desc) :is(ul, ol)) { padding-left: 1.5em; }
  :global(:where(.shop__desc) ul) { list-style: disc; }
  :global(:where(.shop__desc) ol) { list-style: decimal; }
  :global(:where(.shop__desc) li + li) { margin-top: 0.35em; }
  :global(:where(.shop__desc) :is(h3, h4, h5, h6)) { font-size: 1.125rem; font-weight: 700; line-height: 1.25; }
  :global(:where(.shop__desc) blockquote) {
    border-left: 3px solid color-mix(in oklch, var(--color-base-content) 20%, transparent);
    padding-left: 1em;
  }
  :global(:where(.shop__desc) hr) { border-color: var(--color-base-300); }
</style>
