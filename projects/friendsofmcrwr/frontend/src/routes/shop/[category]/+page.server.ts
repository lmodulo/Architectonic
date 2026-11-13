import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, fetch, parent }) => {
  const tag      = url.searchParams.get('tag') ?? undefined;
  const variant  = url.searchParams.get('variant') ?? undefined;
  const search   = url.searchParams.get('search') ?? undefined;
  const skip     = Number(url.searchParams.get('skip') ?? 0);

  const qs = new URLSearchParams({ limit: '24', skip: String(skip) });
  qs.set('category', params.category);
  if (tag)    qs.set('tag', tag);
  if (search) qs.set('search', search);

  const { meta } = await parent();
  const category = meta.categories.find((c: { slug: string }) => c.slug === params.category);
  if (!category) throw error(404, 'Category not found');

  const result = await fetch(`/api/storefront/products?${qs}`)
    .then(r => r.ok ? r.json() : { products: [], total: 0 })
    .catch(() => ({ products: [], total: 0 }));

  return {
    category,
    products: result.products,
    total: result.total,
    skip,
    activeTag: tag ?? null,
    activeVariant: variant ?? null
  };
};
