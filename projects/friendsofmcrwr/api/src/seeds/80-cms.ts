// Demo data — Content (cms): a small public website for a fictional community organization,
// covering every node type. Loaded only when SEED_DEMO_DATA=true (see lib/demo.ts); seeds only
// an empty site. Everything is published and Home is the home page, so `/` shows the site.
//
//   Home (page, home)          About (page)          Events (component: events)
//                                Team (page)         Resources (label)
//                                History (page)        Sitemap (component: sitemap)
//                                                      Donate (external link)
//   Privacy (page, hidden from menu)
import { ObjectId } from 'mongodb';
import { randomUUID } from 'crypto';
import { daysFrom, type DemoContext } from '../lib/demo.js';
import { sanitizePage, type TiptapNode } from '../lib/cmsSanitize.js';

const text = (t: string, marks?: string[]): TiptapNode => ({ type: 'text', text: t, ...(marks ? { marks: marks.map(type => ({ type })) } : {}) });
const p = (...parts: (string | TiptapNode)[]): TiptapNode => ({ type: 'paragraph', content: parts.map(x => typeof x === 'string' ? text(x) : x) });
const h = (level: 2 | 3, t: string): TiptapNode => ({ type: 'heading', attrs: { level }, content: [text(t)] });
const ul = (...items: string[]): TiptapNode => ({ type: 'bulletList', content: items.map(i => ({ type: 'listItem', content: [p(i)] })) });
// A text link; with `nodeId` it points at a site page and follows it if the page moves
const link = (t: string, href: string, nodeId?: ObjectId): TiptapNode =>
  ({ type: 'text', text: t, marks: [{ type: 'link', attrs: { href, target: null, ...(nodeId ? { nodeId: nodeId.toString() } : {}) } }] });
const richText = (...content: TiptapNode[]) => ({ id: randomUUID(), type: 'richText', data: { doc: { type: 'doc', content } } });

export default async function seed({ db, now, users }: DemoContext): Promise<void> {
  const nodes = db.collection('cms_nodes');
  const pages = db.collection('cms_pages');
  if (await nodes.countDocuments() || await pages.countDocuments()) return;

  const by = users.admin ?? users.owner ?? null;
  const created = daysFrom(now, -45);
  const id = {
    home: new ObjectId(), about: new ObjectId(), team: new ObjectId(), history: new ObjectId(),
    events: new ObjectId(), resources: new ObjectId(), sitemap: new ObjectId(), donate: new ObjectId(),
    privacy: new ObjectId(),
  };
  const node = (_id: ObjectId, parentId: ObjectId | null, order: number, type: string, title: string, extra: Record<string, unknown> = {}) => ({
    _id, parentId, order, type, title, showInMenu: true, status: 'published',
    createdAt: created, updatedAt: created, createdBy: by, updatedBy: by, ...extra,
  });

  await nodes.insertMany([
    node(id.home,      null,          0, 'page',      'Home',      { slug: 'home' }),
    node(id.about,     null,          1, 'page',      'About',     { slug: 'about' }),
    node(id.team,      id.about,      0, 'page',      'Team',      { slug: 'team' }),
    node(id.history,   id.about,      1, 'page',      'History',   { slug: 'history' }),
    node(id.events,    null,          2, 'component', 'Events',    { slug: 'events', component: { key: 'events', props: {} } }),
    node(id.resources, null,          3, 'label',     'Resources', { slug: 'resources' }),
    node(id.sitemap,   id.resources,  0, 'component', 'Sitemap',   { slug: 'sitemap', component: { key: 'sitemap', props: {} } }),
    node(id.donate,    id.resources,  1, 'link',      'Donate',    { url: 'https://example.org/donate', newTab: true }),
    node(id.privacy,   null,          4, 'page',      'Privacy',   { slug: 'privacy', showInMenu: false }),
  ]);

  const content: Record<string, { blocks: unknown[]; seo: Record<string, unknown> }> = {
    home: {
      seo: { title: 'Riverbend Community Trust', description: 'Neighbours helping neighbours: food, learning and green spaces for Riverbend.' },
      blocks: [
        { id: randomUUID(), type: 'hero', data: {
          title: 'Neighbours helping neighbours', subtitle: 'Riverbend Community Trust has supported local families, schools and green spaces since 1998.',
          align: 'center', height: 'lg', cta: { label: 'About the Trust', link: { nodeId: id.about.toString() } },
        } },
        richText(
          h(2, 'What we do'),
          p('We are a volunteer-led charity. Every pound raised and every hour given stays in Riverbend.'),
          ul('A weekly community pantry, open to everyone', 'Homework clubs in three primary schools', 'Tree planting and the riverside clean-up'),
          p('New volunteers are always welcome. ', link('Read our story', '/about/history', id.history), ' or come along to an event.'),
        ),
        { id: randomUUID(), type: 'divider', data: { style: 'space', size: 'md' } },
        { id: randomUUID(), type: 'buttons', data: { align: 'center', items: [
          { label: 'Upcoming events', link: { nodeId: id.events.toString() }, style: 'primary' },
          { label: 'Donate', link: { url: 'https://example.org/donate' }, style: 'outline' },
        ] } },
      ],
    },
    about: {
      seo: { description: 'Who we are and how the Trust is run.' },
      blocks: [richText(
        h(2, 'About the Trust'),
        p('Riverbend Community Trust is a registered charity run by a board of eight local trustees and around ', text('120 volunteers', ['bold']), '.'),
        p('We publish our accounts every year and hold an open meeting each spring, where anyone can ask questions.'),
        h(3, 'Our values'),
        ul('Open to everyone', 'Local first', 'Careful with every donation'),
      )],
    },
    team: {
      seo: {},
      blocks: [richText(
        h(2, 'Our team'),
        p('Trustees serve three-year terms and are elected at the spring meeting.'),
        ul('Chair: Morgan Ellis', 'Treasurer: Priya Shah', 'Volunteer coordinator: Sam Okafor', 'Schools lead: Dana Whitfield'),
      )],
    },
    history: {
      seo: {},
      blocks: [richText(
        h(2, 'Our history'),
        p('The Trust began in 1998, when a group of parents turned an empty shop into a weekend homework room.'),
        ul('1998: the homework room opens', '2006: the community pantry starts', '2015: the first riverside clean-up', '2024: 500 trees planted along the river path'),
      )],
    },
    privacy: {
      seo: { noindex: true },
      blocks: [richText(
        h(2, 'Privacy'),
        p('We only collect the details we need to run our programmes and to send the newsletters you ask for.'),
        p('To see or delete what we hold about you, email ', link('privacy@example.org', 'mailto:privacy@example.org'), '.'),
      )],
    },
  };

  const published = daysFrom(now, -30);
  await pages.insertMany(Object.entries(content).map(([key, c]) => {
    const { blocks, seo } = sanitizePage(c);
    const page = { blocks, seo };
    return {
      nodeId: id[key as keyof typeof id], draft: page, published: page, rev: 1,
      publishedAt: published, updatedAt: published, updatedBy: by,
    };
  }));

  await db.collection<{ _id: string }>('cms_settings').updateOne(
    { _id: 'site' },
    { $setOnInsert: {
      homeNodeId: id.home,
      footer: {
        text: '© Riverbend Community Trust. Registered charity no. 1000000.',
        links: [
          { label: 'Privacy', link: { nodeId: id.privacy.toString() } },
          { label: 'Contact us', link: { url: 'mailto:hello@example.org' } },
        ],
      },
      mediaFolderId: null,
      updatedAt: published,
    } },
    { upsert: true },
  );
}
