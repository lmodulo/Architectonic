import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { hasPermission } from '$lib/permissions';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!hasPermission(locals.user, 'commerce_products', 'read')) redirect(303, '/403');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const [productsRes, categoriesRes] = await Promise.all([
    fetch(`${API_URL}/commerce/products?limit=100`, { headers }),
    fetch(`${API_URL}/commerce/categories`, { headers })
  ]);

  const { products = [] } = productsRes.ok ? await productsRes.json() : {};
  const categories = categoriesRes.ok ? await categoriesRes.json() : [];

  return { products, categories };
};
