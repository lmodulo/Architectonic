import { redirect, fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad, Actions } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) redirect(303, '/login');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const customersRes = await fetch(`${API_URL}/finance/customers`, { headers });
  const customers    = customersRes.ok ? (await customersRes.json()).customers ?? [] : [];

  return { user: locals.user, customers };
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const sessionCookie = cookies.get('session');
    const headers = {
      'content-type': 'application/json',
      ...(sessionCookie ? { cookie: `session=${sessionCookie}` } : {})
    };

    const data       = await request.formData();
    const customerId          = data.get('customerId')          as string;
    const companyId           = data.get('companyId')           as string | null;
    const dueDate             = data.get('dueDate')             as string | null;
    const taxRate             = Number(data.get('taxRate') ?? 0);
    const notes               = data.get('notes')               as string | null;
    const status              = data.get('status')              as string;
    const recurrenceEnabled   = data.get('recurrenceEnabled')   === 'true';
    const recurrenceFrequency = data.get('recurrenceFrequency') as string | null;
    const recurrenceUntil     = data.get('recurrenceUntil')     as string | null;

    // Parse line items
    const descriptions = data.getAll('description') as string[];
    const quantities   = data.getAll('quantity')    as string[];
    const unitPrices   = data.getAll('unitPrice')   as string[];

    const lineItems = descriptions.map((desc, i) => ({
      description: desc,
      quantity:    Number(quantities[i] ?? 1),
      unitPrice:   Number(unitPrices[i] ?? 0),
    })).filter(item => item.description.trim());

    if (!customerId)        return fail(400, { error: 'Client is required' });
    if (!lineItems.length)  return fail(400, { error: 'At least one line item is required' });

    const res = await fetch(`${API_URL}/finance/invoices`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customerId,
        companyId:  companyId  || undefined,
        lineItems,
        taxRate,
        dueDate:    dueDate    || undefined,
        notes:      notes      || '',
        status:     status     || 'draft',
        ...(recurrenceEnabled ? {
          recurrence: {
            enabled:   true,
            frequency: recurrenceFrequency || 'monthly',
            ...(recurrenceUntil ? { until: recurrenceUntil } : {}),
          }
        } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return fail(res.status, { error: (body as { message?: string }).message ?? 'Failed to create invoice' });
    }

    const inv = await res.json();
    redirect(303, `/folio/invoices/${inv.id}`);
  }
};
