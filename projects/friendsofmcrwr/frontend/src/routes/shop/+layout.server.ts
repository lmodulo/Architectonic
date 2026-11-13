import { env } from '$env/dynamic/private';
import type { LayoutServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: LayoutServerLoad = async () => {
  const meta = await fetch(`${API_URL}/storefront/meta`)
    .then(r => r.ok ? r.json() : { categories: [], variantTypes: [], tags: [] })
    .catch(() => ({ categories: [], variantTypes: [], tags: [] }));

  return { meta };
};
