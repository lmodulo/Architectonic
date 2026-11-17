// The storefront's data: Commerce's one implementation, shown by ShopComponent and mounted twice:
//   - Commerce's own /shop (routes/shop/[...rest]/+page.server.ts, base '/shop'), for projects without Content;
//   - the Shop page type Commerce adds to Content (registry entry $lib/config/cms-components/shop.ts), at
//     whatever URL the editor gives the page.
// It reads Commerce's public storefront proxy (/api/storefront, which sends no cookie), so it sees what any
// visitor sees.
//
// It must never import Content's code: the registry entry matches Content's shape structurally (ShopLoadContext
// and ShopSubpage below mirror CmsComponentLoadContext and SubpageInfo in Content's $lib/cms/types.ts), so
// Commerce still builds without Content. Without Content nothing reads the entry.
//
// The storefront serves its own subpaths, under its URL (`base`):
//   base                        every product        (?page=2, ?tag=…)
//   base/<category>             one category's products
//   base/<category>/<product>   a product in its category
//   base/<product>              a product without a category
// Anything else under the page is a 404. A category wins over a product with the same slug.
//
// Prices are in cents. A fixed discount is entered in dollars (the product form's "Amount ($)").
import { richTextToPlain } from './richText';

/** loadShop's input: what Content passes a registry entry's `load` (its CmsComponentLoadContext), and what /shop passes. */
export interface ShopLoadContext {
  /** SvelteKit's fetch: on the server for public pages, in the browser for Content's admin preview */
  fetch: typeof globalThis.fetch;
  url: URL;
  /** the path under the storefront, for example 'mugs/blue-mug' */
  rest: string | null;
  /** the storefront's own public URL ('/shop', or the Shop page's; null in Content's admin preview) */
  base: string | null;
  props: Record<string, unknown>;
}

/** What a subpath shows, for Content's heading, <title>, breadcrumbs and canonical link (its SubpageInfo). */
export interface ShopSubpage {
  title: string;
  path: string;
  description?: string;
  /** added after the page's own breadcrumbs; the last one is the subpath itself */
  crumbs: { id: string; title: string; path: string | null }[];
}

export interface ShopCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  parentId: string | null;
}

export interface ShopDiscount {
  type: string;
  value: number;
  label: string;
  /** YYYY-MM-DD, inclusive */
  start: string;
  end: string;
  minQuantity: number | null;
}

export interface ShopVariant {
  sku: string;
  combination: Record<string, string>;
  /** cents; null uses the product's price */
  price: number | null;
  stock: number;
  lowStockThreshold: number | null;
}

export interface ShopProduct {
  id: string;
  slug: string;
  name: string;
  /** HTML from the product page's rich text editor, or plain text from before it had one: show it with
   *  $lib/utils/richText.ts (or RichTextView), never as {@html} */
  description: string;
  /** cents */
  basePrice: number;
  images: string[];
  categoryId: string | null;
  tags: string[];
  discounts: ShopDiscount[];
  /** options with at least one value */
  options: { name: string; values: string[] }[];
  variants: ShopVariant[];
  /** false for things that can't run out (donations, memberships): always available, stock ignored */
  trackInventory: boolean;
}

interface ShopBase { base: string; categories: ShopCategory[] }
export type ShopList = ShopBase & {
  view: 'list';
  category: ShopCategory | null;
  tag: string | null;
  products: ShopProduct[];
  total: number;
  page: number;
  pages: number;
  perPage: number;
};
export type ShopItem = ShopBase & { view: 'product'; product: ShopProduct };
export type ShopData = ShopList | ShopItem | { notFound: true } | { unavailable: true };

export const DEFAULT_PER_PAGE = 24;
export const MAX_PER_PAGE = 100;

// ── Reading the storefront API defensively (another module's data) ─────────────────────────────

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string' && s !== '') : []);
const day = (v: unknown): string => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : '');

function toCategory(c: Record<string, unknown>): ShopCategory {
  return { id: str(c.id), slug: str(c.slug), name: str(c.name), description: str(c.description), parentId: str(c.parentId) || null };
}

function toProduct(p: Record<string, unknown>): ShopProduct {
  const options = (Array.isArray(p.variantOptions) ? p.variantOptions : [])
    .map((o: Record<string, unknown>) => ({ name: str(o?.name), values: [...new Set(strings(o?.values))] }))
    .filter(o => o.name && o.values.length > 0);
  const variants = (Array.isArray(p.variants) ? p.variants : []).map((v: Record<string, unknown>) => ({
    sku: str(v?.sku),
    combination: Object.fromEntries(Object.entries((v?.combination ?? {}) as Record<string, unknown>).map(([k, x]) => [k, str(x)])),
    price: num(v?.price),
    stock: Math.max(0, num(v?.stock) ?? 0),
    lowStockThreshold: num(v?.lowStockThreshold),
  }));
  const discounts = (Array.isArray(p.discounts) ? p.discounts : [])
    .filter((d: Record<string, unknown>) => d?.active === true && num(d.value) !== null)
    .map((d: Record<string, unknown>) => ({
      type: str(d.type), value: num(d.value)!, label: str(d.label).trim(),
      start: day(d.startDate), end: day(d.endDate), minQuantity: num(d.minQuantity),
    }));
  return {
    id: str(p.id), slug: str(p.slug), name: str(p.name), description: str(p.description).trim(),
    basePrice: Math.max(0, num(p.basePrice) ?? 0), images: strings(p.images), categoryId: str(p.category) || null,
    tags: [...new Set(strings(p.tags))], discounts, options, variants,
    trackInventory: p.trackInventory !== false,
  };
}

class Unavailable extends Error {}

async function getJson(fetch: typeof globalThis.fetch, path: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(path);
  if (res.status === 404) return null;
  if (!res.ok) throw new Unavailable(`${path}: ${res.status}`);
  return res.json();
}

/** The registry entry's load. Throws when the storefront can't be read, so the page says the shop is unavailable. */
export async function loadShop({ fetch, url, rest, base, props }: ShopLoadContext): Promise<ShopData> {
  const root = (base ?? url.pathname).replace(/\/+$/, '');
  const segments = rest ? rest.split('/') : [];
  if (segments.length > 2) return { notFound: true };

  const metaReq = getJson(fetch, '/api/storefront/meta');
  const productReq = segments.length === 2 ? getJson(fetch, `/api/storefront/products/${encodeURIComponent(segments[1])}`) : null;
  productReq?.catch(() => {}); // awaited below; this keeps it from being an unhandled rejection if the meta fails first
  const meta = await metaReq;
  // The meta route is always there when Commerce is; a 404 means the module isn't installed
  if (!meta) throw new Unavailable('/api/storefront/meta: 404');
  const categories = (Array.isArray(meta.categories) ? meta.categories : []).map(toCategory).filter(c => c.id && c.slug && c.name);
  const shop = { base: root, categories };

  if (segments.length === 2) {
    const product = await productReq;
    if (!product || !categories.some(c => c.slug === segments[0])) return { notFound: true };
    return { ...shop, view: 'product', product: toProduct(product) };
  }

  const category = segments.length === 1 ? categories.find(c => c.slug === segments[0]) ?? null : null;
  if (segments.length === 1 && !category) {
    const product = await getJson(fetch, `/api/storefront/products/${encodeURIComponent(segments[0])}`);
    return product ? { ...shop, view: 'product', product: toProduct(product) } : { notFound: true };
  }

  const perPage = Math.min(MAX_PER_PAGE, Math.max(1, Math.round(Number(props.perPage) || DEFAULT_PER_PAGE)));
  const page = Math.max(1, Math.floor(Number(url.searchParams.get('page')) || 1));
  const tag = url.searchParams.get('tag')?.trim().slice(0, 100) || null;
  const qs = new URLSearchParams({ limit: String(perPage), skip: String((page - 1) * perPage) });
  if (category) qs.set('category', category.slug);
  if (tag) qs.set('tag', tag);
  const list = await getJson(fetch, `/api/storefront/products?${qs}`);
  if (!list) throw new Unavailable('/api/storefront/products: 404');
  const total = Math.max(0, num(list.total) ?? 0);
  return {
    ...shop,
    view: 'list',
    category,
    tag,
    products: (Array.isArray(list.products) ? list.products : []).map(toProduct),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / perPage)),
    perPage,
  };
}

// ── URLs and breadcrumbs ────────────────────────────────────────────────────────────────────

export const categoryHref = (base: string, c: ShopCategory) => `${base}/${c.slug}`;

export function categoryOf(categories: ShopCategory[], p: ShopProduct): ShopCategory | null {
  return (p.categoryId && categories.find(c => c.id === p.categoryId)) || null;
}

export function productHref(base: string, categories: ShopCategory[], p: ShopProduct): string {
  const c = categoryOf(categories, p);
  return c ? `${base}/${c.slug}/${p.slug}` : `${base}/${p.slug}`;
}

/** The category and its parents, outermost first (categories can nest in Commerce) */
function categoryTrail(categories: ShopCategory[], c: ShopCategory): ShopCategory[] {
  const trail: ShopCategory[] = [];
  for (let at: ShopCategory | undefined = c; at && !trail.includes(at) && trail.length < 10; at = categories.find(x => x.id === at!.parentId)) {
    trail.unshift(at);
  }
  return trail;
}

/** The registry entry's `subpage`: the category's or product's heading, breadcrumbs and search tags */
export function shopSubpage(data: unknown): ShopSubpage | null {
  const d = data as ShopData;
  if (!d || !('view' in d)) return null;
  const crumb = (c: ShopCategory) => ({ id: `shop-category-${c.id}`, title: c.name, path: categoryHref(d.base, c) });
  if (d.view === 'list') {
    if (!d.category) return null;
    return {
      title: d.category.name,
      path: categoryHref(d.base, d.category),
      description: d.category.description,
      crumbs: categoryTrail(d.categories, d.category).map(crumb),
    };
  }
  const category = categoryOf(d.categories, d.product);
  const path = productHref(d.base, d.categories, d.product);
  return {
    title: d.product.name,
    path,
    description: richTextToPlain(d.product.description),
    crumbs: [...(category ? categoryTrail(d.categories, category).map(crumb) : []), { id: `shop-product-${d.product.id}`, title: d.product.name, path }],
  };
}

// ── Prices and sales ────────────────────────────────────────────────────────────────────────

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const formatPrice = (cents: number) => money.format(cents / 100);

/** Today in UTC (discount dates are calendar days, compared the same way on the server and in the browser) */
const today = () => new Date().toISOString().slice(0, 10);
const current = (d: ShopDiscount, now: string) => (!d.start || d.start <= now) && (!d.end || now <= d.end);

/** The product's sale, if one is on today: its first active percentage or fixed discount */
export function saleOf(p: ShopProduct): ShopDiscount | null {
  const now = today();
  return p.discounts.find(d => (d.type === 'percentage' || d.type === 'fixed') && d.value > 0 && current(d, now)) ?? null;
}

export function salePrice(cents: number, d: ShopDiscount): number {
  if (d.type === 'percentage') return Math.max(0, Math.round(cents * (1 - Math.min(d.value, 100) / 100)));
  return Math.max(0, cents - Math.round(d.value * 100));
}

export function saleBadge(d: ShopDiscount): string {
  return d.type === 'percentage' ? `${Math.round(d.value)}% off` : `${formatPrice(Math.round(d.value * 100))} off`;
}

/** Quantity offers that are on today, as the editor labelled them (unlabelled ones are described) */
export function quantityOffers(p: ShopProduct): string[] {
  const now = today();
  return p.discounts
    .filter(d => d.type === 'quantity_tier' && current(d, now))
    .map(d => d.label || (d.minQuantity ? `Buy ${d.minQuantity} or more and save` : ''))
    .filter(Boolean);
}

/** Lowest price a product sells at (its variants' prices when it has variants), for "From $5.00" on cards */
export function fromPrice(p: ShopProduct): { cents: number; varies: boolean } {
  const prices = p.variants.length ? p.variants.map(v => v.price ?? p.basePrice) : [p.basePrice];
  const min = Math.min(...prices);
  return { cents: min, varies: prices.some(x => x !== min) };
}
