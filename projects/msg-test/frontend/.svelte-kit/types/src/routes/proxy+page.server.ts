// @ts-nocheck
import { resolveModuleHome } from '$lib/server/module-home';
import type { PageServerLoad } from './$types';

// A module may take over `/` (see $lib/server/module-home.ts); otherwise moduleHome is null and the
// scaffold home page renders.
export const load = async (event: Parameters<PageServerLoad>[0]) => ({ moduleHome: await resolveModuleHome(event) });
