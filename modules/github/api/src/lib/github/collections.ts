import type { Db } from 'mongodb';

export const REPOS_COL = 'github_repos';
export const CONTRIBUTIONS_COL = 'github_contributions';

export async function ensureIndexes(db: Db): Promise<void> {
  await db.collection(REPOS_COL).createIndex({ githubId: 1 }, { unique: true });
  await db.collection(CONTRIBUTIONS_COL).createIndex({ repo: 1, weekStart: 1 }, { unique: true });
}
