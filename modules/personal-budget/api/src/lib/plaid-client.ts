import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const env    = process.env.PLAID_ENV ?? 'sandbox';
const baseUrl = PlaidEnvironments[env as keyof typeof PlaidEnvironments] ?? PlaidEnvironments.sandbox;

const config = new Configuration({
  basePath: baseUrl,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID ?? '',
      'PLAID-SECRET':    process.env.PLAID_SECRET    ?? '',
    },
  },
});

export const plaid = new PlaidApi(config);
