export interface UrlParser {
  name: string;
  pattern: RegExp; // no flags — UrlParserExtension adds 'gi'
  getLabel: (match: RegExpMatchArray) => string;
}

export const githubIssueParser: UrlParser = {
  name: 'github-issue',
  pattern: /https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/issues\/(\d+)/,
  getLabel: (match) => `Issue: ${match[1]}`
};

export const defaultParsers: UrlParser[] = [
  githubIssueParser,
  // add future parsers here
];
