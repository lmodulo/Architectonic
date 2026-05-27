import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params }) => {
  try {
    const res = await fetch(`/api/contracts/sign/${params.token}`);
    const data = res.ok ? await res.json() : null;
    if (!data) return { state: 'not_found' as const };
    if (data.expired)      return { state: 'expired'       as const, signer: data.signer };
    if (data.alreadySigned) return { state: 'already_signed' as const, signer: data.signer };
    if (data.declined)     return { state: 'declined'      as const, signer: data.signer };
    return { state: 'pending' as const, signer: data.signer, contract: data.contract, brand: data.brand };
  } catch {
    return { state: 'not_found' as const };
  }
};
