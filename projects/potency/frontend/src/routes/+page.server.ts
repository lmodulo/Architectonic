import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async () => {
  const [productsRes, meta] = await Promise.all([
    fetch(`${API_URL}/storefront/products?limit=3`)
      .then(r => r.ok ? r.json() : { products: [] })
      .catch(() => ({ products: [] })),
    fetch(`${API_URL}/storefront/meta`)
      .then(r => r.ok ? r.json() : { categories: [] })
      .catch(() => ({ categories: [] }))
  ]);

  // Build category ID → slug map
  const catSlugMap: Record<string, string> = {};
  for (const cat of (meta.categories ?? [])) {
    catSlugMap[cat.id] = cat.slug;
  }

  const products = (productsRes.products ?? []).map((p: any) => ({
    ...p,
    categorySlug: catSlugMap[p.category] ?? null
  }));

  return { products };
};
