import type { Db } from 'mongodb';
import { REPOS_COL, CONTRIBUTIONS_COL, ensureIndexes } from './collections.js';

interface GithubEnv {
  token: string;
  owner: string;
  ownerType: 'user' | 'org';
}

export interface RepoDoc {
  githubId: number;
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number;
  openIssues: number;
  lastPush: string;
  url: string;
  syncedAt: string;
}

export interface ContributionDoc {
  repo: string;
  weekStart: string;
  commits: number;
  syncedAt: string;
}

function isoMonday(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  // Adjust to Monday of that week
  const dow = d.getUTCDay(); // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

async function ghFetch(url: string, token: string): Promise<Response> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (res.status === 403 || res.status === 429) {
    const reset = res.headers.get('x-ratelimit-reset');
    const resetTime = reset ? new Date(Number(reset) * 1000).toISOString() : 'unknown';
    throw new Error(`GitHub rate limit exceeded (resets at ${resetTime})`);
  }
  return res;
}

async function fetchRepos(env: GithubEnv): Promise<RepoDoc[]> {
  const repos: RepoDoc[] = [];
  const base = env.ownerType === 'org'
    ? `https://api.github.com/orgs/${env.owner}/repos`
    : `https://api.github.com/users/${env.owner}/repos`;

  let page = 1;
  while (true) {
    const res = await ghFetch(`${base}?per_page=100&page=${page}&sort=updated`, env.token);
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(`GitHub repos fetch failed: ${body.message ?? res.status}`);
    }
    const data = await res.json() as Array<Record<string, unknown>>;
    if (data.length === 0) break;

    for (const r of data) {
      repos.push({
        githubId: r.id as number,
        name: r.name as string,
        fullName: r.full_name as string,
        description: (r.description as string | null) ?? null,
        language: (r.language as string | null) ?? null,
        stars: (r.stargazers_count as number) ?? 0,
        openIssues: (r.open_issues_count as number) ?? 0,
        lastPush: (r.pushed_at as string) ?? new Date().toISOString(),
        url: r.html_url as string,
        syncedAt: new Date().toISOString(),
      });
    }

    if (data.length < 100) break;
    page++;
  }

  return repos;
}

async function fetchContributions(owner: string, repoName: string, token: string): Promise<ContributionDoc[]> {
  const url = `https://api.github.com/repos/${owner}/${repoName}/stats/commit_activity`;
  const res = await ghFetch(url, token);

  // 202 means GitHub is computing stats — treat as soft skip
  if (res.status === 202 || res.status === 204) return [];
  if (!res.ok) return []; // skip on error, don't fail the whole sync

  const data = await res.json() as Array<{ week: number; total: number }>;
  const now = new Date().toISOString();

  return data
    .filter(w => w.total > 0)
    .map(w => ({
      repo: `${owner}/${repoName}`,
      weekStart: isoMonday(w.week),
      commits: w.total,
      syncedAt: now,
    }));
}

export async function syncGithub(
  db: Db,
  env: { GITHUB_TOKEN?: string; GITHUB_OWNER?: string; GITHUB_OWNER_TYPE?: string }
): Promise<{ repos: number; errors: string[] }> {
  const token = env.GITHUB_TOKEN ?? '';
  const owner = env.GITHUB_OWNER ?? '';
  const ownerType = (env.GITHUB_OWNER_TYPE ?? 'user') as 'user' | 'org';

  if (!token) throw new Error('GITHUB_TOKEN not configured');
  if (!owner) throw new Error('GITHUB_OWNER not configured');

  await ensureIndexes(db);

  const errors: string[] = [];
  const repos = await fetchRepos({ token, owner, ownerType });

  const reposCol = db.collection(REPOS_COL);
  const contribCol = db.collection(CONTRIBUTIONS_COL);
  const now = new Date().toISOString();

  for (const repo of repos) {
    await reposCol.updateOne(
      { githubId: repo.githubId },
      { $set: repo },
      { upsert: true }
    );

    try {
      const contribs = await fetchContributions(owner, repo.name, token);
      for (const c of contribs) {
        await contribCol.updateOne(
          { repo: c.repo, weekStart: c.weekStart },
          { $set: c },
          { upsert: true }
        );
      }
    } catch (err) {
      errors.push(`${repo.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { repos: repos.length, errors };
}
