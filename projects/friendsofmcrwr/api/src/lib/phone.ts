import { parsePhoneNumberFromString } from 'libphonenumber-js';

export class InvalidPhoneError extends Error {
  constructor() {
    super('Invalid phone number');
  }
}

export function normalizePhone(raw: string | undefined | null): string | null {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return null;
  const parsed = parsePhoneNumberFromString(trimmed);
  if (!parsed || !parsed.isValid()) throw new InvalidPhoneError();
  return parsed.number;
}
