import { describe, it, expect } from 'vitest';
import { defaultTemplate } from '../../../src/lib/email/templates/default.js';
import type { TemplateContext } from '../../../src/lib/email/templates/index.js';

function makeCtx(overrides: Partial<TemplateContext> = {}): TemplateContext {
  return {
    appName: 'TestApp',
    title: 'Hello there',
    blocks: [],
    ...overrides,
  };
}

describe('defaultTemplate', () => {
  it('subject equals the title', () => {
    const result = defaultTemplate(makeCtx({ title: 'Reset your password' }));
    expect(result.subject).toBe('Reset your password');
  });

  it('HTML contains a preheader span with the title when preheader is omitted', () => {
    const result = defaultTemplate(makeCtx({ title: 'Welcome!' }));
    expect(result.html).toContain('Welcome!');
  });

  it('HTML uses the explicit preheader when provided', () => {
    const result = defaultTemplate(makeCtx({ preheader: 'Custom preview text' }));
    expect(result.html).toContain('Custom preview text');
  });

  it('HTML contains the appName in the header', () => {
    const result = defaultTemplate(makeCtx({ appName: 'MyBrand' }));
    expect(result.html).toContain('MyBrand');
  });

  it('HTML contains the title heading', () => {
    const result = defaultTemplate(makeCtx({ title: 'Confirm your email' }));
    expect(result.html).toContain('Confirm your email');
  });

  it('text output contains the appName', () => {
    const result = defaultTemplate(makeCtx({ appName: 'MyBrand' }));
    expect(result.text).toContain('MyBrand');
  });

  it('text output contains the title', () => {
    const result = defaultTemplate(makeCtx({ title: 'My title' }));
    expect(result.text).toContain('My title');
  });

  it('renders a text block into HTML and text', () => {
    const result = defaultTemplate(makeCtx({
      blocks: [{ type: 'text', content: 'Welcome to the platform.' }],
    }));
    expect(result.html).toContain('Welcome to the platform.');
    expect(result.text).toContain('Welcome to the platform.');
  });

  it('renders an action block with URL and label', () => {
    const result = defaultTemplate(makeCtx({
      blocks: [{ type: 'action', url: 'https://example.com/reset', label: 'Reset Password' }],
    }));
    expect(result.html).toContain('https://example.com/reset');
    expect(result.html).toContain('Reset Password');
    expect(result.text).toContain('https://example.com/reset');
    expect(result.text).toContain('Reset Password');
  });

  it('renders a divider block', () => {
    const result = defaultTemplate(makeCtx({
      blocks: [{ type: 'divider' }],
    }));
    expect(result.html).toContain('border-top');
    expect(result.text).toContain('---');
  });

  it('renders a note block', () => {
    const result = defaultTemplate(makeCtx({
      blocks: [{ type: 'note', content: 'Ignore if not you.' }],
    }));
    expect(result.html).toContain('Ignore if not you.');
    expect(result.text).toContain('Ignore if not you.');
  });

  it('returns valid HTML structure (doctype + html + head + body)', () => {
    const result = defaultTemplate(makeCtx());
    expect(result.html).toMatch(/<!DOCTYPE html>/i);
    expect(result.html).toContain('<html');
    expect(result.html).toContain('<body');
    expect(result.html).toContain('</body>');
  });
});
