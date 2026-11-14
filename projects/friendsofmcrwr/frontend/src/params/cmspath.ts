import type { ParamMatcher } from '@sveltejs/kit';

// Matches the CMS catch-all `[...path=cmspath]`. Without it, the catch-all would swallow
// /api/<missing> and /uploads/<missing> and serve HTML 404s to fetch callers. Segments must look
// like slugs, so dotted paths (favicon.ico, robots.txt) and uppercase URLs fall through.
const NOT_CMS = new Set(['api', 'uploads', '_app']);
const SEGMENT = /^[a-z0-9-]+$/;

export const match: ParamMatcher = (param) => {
  if (!param) return false;
  const segments = param.split('/');
  return !NOT_CMS.has(segments[0]) && segments.every(s => SEGMENT.test(s));
};
