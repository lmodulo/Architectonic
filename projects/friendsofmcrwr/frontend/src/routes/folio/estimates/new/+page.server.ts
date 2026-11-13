import { redirect, fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad, Actions } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) redirect(303, '/login');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const customersRes = await fetch(`${API_URL}/finance/customers`, { headers });
  const customers = customersRes.ok ? (await customersRes.json().catch(() => ({}))).customers ?? [] : [];

  return { user: locals.user, customers };
};

export const actions: Actions = {
  default: async ({ request, locals, cookies }) => {
    if (!locals.user) redirect(303, '/login');

    const sessionCookie = cookies.get('session');
    const data = await request.formData();

    const customerId  = data.get('customerId')  as string;
    const companyId   = data.get('companyId')   as string | null;
    const title       = data.get('title')       as string;
    const taxRate     = data.get('taxRate')     as string;
    const validUntil  = data.get('validUntil')  as string;
    const currency    = data.get('currency')    as string;
    const status      = data.get('status')      as string;
    const notes       = data.get('notes')       as string;

    if (!customerId) return fail(400, { error: 'Client is required' });

    const descriptions = data.getAll('description') as string[];
    const quantities   = data.getAll('quantity')    as string[];
    const unitPrices   = data.getAll('unitPrice')   as string[];

    const lineItems = descriptions
      .map((desc, i) => ({ description: desc, quantity: Number(quantities[i] ?? 1), unitPrice: Number(unitPrices[i] ?? 0) }))
      .filter(item => item.description.trim());

    if (!lineItems.length) return fail(400, { error: 'At least one line item is required' });

    const body: Record<string, unknown> = {
      customerId,
      title:     title || '',
      lineItems,
      taxRate:   Number(taxRate) || 0,
      currency:  currency || 'USD',
      status:    status || 'draft',
      notes:     notes || '',
    };
    if (companyId) body.companyId = companyId;
    if (validUntil) body.validUntil = validUntil;

    const res = await fetch(`${API_URL}/finance/estimates`, {
      method:  'POST',
      headers: { 'content-type': 'application/json', ...(sessionCookie ? { cookie: `session=${sessionCookie}` } : {}) },
      body:    JSON.stringify(body),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return fail(res.status, { error: (d as { message?: string }).message ?? 'Failed to create estimate' });
    }

    const est = await res.json();
    redirect(303, `/folio/estimates/${est.id}`);
  },
};
