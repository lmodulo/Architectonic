import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// Compose is a modal on /messages now (opened by ?compose). This keeps old links to /messages/compose working.
export const load: PageLoad = ({ url }) => {
  const tab = url.searchParams.get('tab');
  redirect(307, `/messages?${tab ? `tab=${encodeURIComponent(tab)}&` : ''}compose`);
};
