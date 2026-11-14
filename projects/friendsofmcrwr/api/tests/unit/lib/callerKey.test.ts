import { describe, it, expect } from 'vitest';
import { identifyCaller } from '../../../src/lib/callerKey.js';

const SECRET = 'a'.repeat(64);

describe('identifyCaller', () => {
  it('trusts the visitor address when the secret matches', () => {
    expect(identifyCaller({ 'x-internal-secret': SECRET, 'x-client-ip': '203.0.113.7' }, SECRET))
      .toEqual({ kind: 'visitor', address: '203.0.113.7' });
    expect(identifyCaller({ 'x-internal-secret': SECRET, 'x-client-ip': '::ffff:172.18.0.1' }, SECRET))
      .toEqual({ kind: 'visitor', address: '::ffff:172.18.0.1' });
    expect(identifyCaller({ 'x-internal-secret': SECRET, 'x-client-ip': '2001:db8::1' }, SECRET))
      .toEqual({ kind: 'visitor', address: '2001:db8::1' });
  });

  it('treats the secret with no visitor header as the web server itself', () => {
    expect(identifyCaller({ 'x-internal-secret': SECRET }, SECRET)).toEqual({ kind: 'web' });
  });

  it('ignores the visitor header without the right secret', () => {
    expect(identifyCaller({ 'x-client-ip': '203.0.113.7' }, SECRET)).toEqual({ kind: 'direct' });
    expect(identifyCaller({ 'x-internal-secret': 'wrong', 'x-client-ip': '203.0.113.7' }, SECRET)).toEqual({ kind: 'direct' });
    expect(identifyCaller({ 'x-internal-secret': SECRET + 'x' }, SECRET)).toEqual({ kind: 'direct' });
    expect(identifyCaller({ 'x-internal-secret': [SECRET, SECRET] as unknown as string }, SECRET)).toEqual({ kind: 'direct' });
  });

  it('trusts nothing when the secret is unset or too short', () => {
    expect(identifyCaller({ 'x-internal-secret': '', 'x-client-ip': '203.0.113.7' }, '')).toEqual({ kind: 'direct' });
    expect(identifyCaller({ 'x-internal-secret': 'short' }, undefined)).toEqual({ kind: 'direct' });
    expect(identifyCaller({ 'x-internal-secret': 'short' }, 'short')).toEqual({ kind: 'direct' });
  });

  it('falls back to the connection address for a malformed visitor address', () => {
    for (const bad of ['unknown', '', '1.2.3.4, 5.6.7.8', '1'.repeat(46), '<script>']) {
      expect(identifyCaller({ 'x-internal-secret': SECRET, 'x-client-ip': bad }, SECRET)).toEqual({ kind: 'direct' });
    }
  });
});
