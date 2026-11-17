import { defaultTemplate } from './default.js';

export type EmailBlock =
  | { type: 'text';    content: string }
  | { type: 'action';  url: string; label: string }
  | { type: 'divider' }
  | { type: 'note';    content: string };

export interface TemplateContext {
  appName:    string;
  title:      string;
  preheader?: string;
  blocks:     EmailBlock[];
}

export interface RenderedEmail {
  subject: string;
  html:    string;
  text:    string;
}

export type EmailTemplate = (ctx: TemplateContext) => RenderedEmail;

const registry: Record<string, EmailTemplate> = {
  default: defaultTemplate
};

export function registerTemplate(name: string, template: EmailTemplate): void {
  registry[name] = template;
}

export function getTemplate(name = 'default'): EmailTemplate {
  return registry[name] ?? registry['default'];
}
