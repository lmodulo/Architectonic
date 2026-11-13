import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { hasPermission } from '$lib/permissions';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies, params }) => {
  if (!hasPermission(locals.user, 'commerce_products', 'read')) redirect(303, '/403');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const [productRes, categoriesRes] = await Promise.all([
    fetch(`${API_URL}/commerce/products/${params.id}`, { headers }),
    fetch(`${API_URL}/commerce/categories`, { headers })
  ]);

  if (!productRes.ok) redirect(303, '/commerce/products');

  const [product, categories] = await Promise.all([
    productRes.json(),
    categoriesRes.ok ? categoriesRes.json() : []
  ]);

  return { product, categories };
};
