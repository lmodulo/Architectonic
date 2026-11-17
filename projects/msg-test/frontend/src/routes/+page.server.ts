import { resolveModuleHome } from '$lib/server/module-home';
import type { PageServerLoad } from './$types';

// A module may take over `/` (see $lib/server/module-home.ts); otherwise moduleHome is null and the
// scaffold home page renders.
export const load: PageServerLoad = async (event) => ({ moduleHome: await resolveModuleHome(event) });
