// Demo data — Vault: folders and markdown documents (one with two versions), across all
// visibility levels. Loaded only when SEED_DEMO_DATA=true (see lib/demo.ts); seeds only an empty vault.
// Files are written through the scaffold storage provider (local disk or S3), like real uploads.
import { ObjectId } from 'mongodb';
import { daysFrom, type DemoContext } from '../lib/demo.js';
import { storage } from '../lib/storage.js';

type Visibility = 'staff' | 'admin_only' | 'customer';

export default async function seed({ db, now, workspaceId, users }: DemoContext): Promise<void> {
  if (!workspaceId) return;                                   // vault is workspace-scoped
  const foldersColl = db.collection('vault_folders');
  const docsColl    = db.collection('vault_documents');
  const versColl    = db.collection('vault_document_versions');
  if (await foldersColl.countDocuments({ workspaceId }) || await docsColl.countDocuments({ workspaceId })) return;

  const owner = users.owner ?? users.admin;
  const admin = users.admin ?? owner;

  const FOLDERS: { key: string; name: string; visibility: Visibility }[] = [
    { key: 'policies',  name: 'Policies',           visibility: 'staff' },
    { key: 'handbooks', name: 'Handbooks',          visibility: 'staff' },
    { key: 'customers', name: 'Customer Resources', visibility: 'customer' },
    { key: 'board',     name: 'Leadership',         visibility: 'admin_only' },
  ];
  const folderId: Record<string, ObjectId> = {};
  await foldersColl.insertMany(FOLDERS.map(f => {
    folderId[f.key] = new ObjectId();
    return { _id: folderId[f.key], workspaceId, name: f.name, parentId: null, visibility: f.visibility, ownerId: owner, createdAt: daysFrom(now, -120), updatedAt: daysFrom(now, -120) };
  }));

  const DOCS: { folder: string; name: string; file: string; visibility: Visibility; tags: string[]; description: string; age: number; versions: string[] }[] = [
    { folder: 'policies', name: 'Remote Work Policy', file: 'remote-work-policy.md', visibility: 'staff', tags: ['policy', 'hr'], age: 90,
      description: 'Eligibility, core hours, and equipment for remote work.',
      versions: [
        '# Remote Work Policy\n\nTeam members may work remotely up to three days a week.\n\n## Core hours\n\n10:00–15:00 local time.\n',
        '# Remote Work Policy\n\nTeam members may work remotely up to **four** days a week with manager approval.\n\n## Core hours\n\n10:00–15:00 local time.\n\n## Equipment\n\nA one-time $500 home-office stipend is available.\n',
      ] },
    { folder: 'policies', name: 'Expense Policy', file: 'expense-policy.md', visibility: 'staff', tags: ['policy', 'finance'], age: 10,
      description: 'What we reimburse and how to submit receipts.',
      versions: ['# Expense Policy\n\n- Receipts are required for every expense over **$25**.\n- Submit within 30 days through Folio → Expenses.\n- Travel must be booked through the shared account.\n'] },
    { folder: 'handbooks', name: 'Employee Handbook', file: 'employee-handbook.md', visibility: 'staff', tags: ['handbook'], age: 200,
      description: 'Values, benefits, time off, and how we work.',
      versions: ['# Employee Handbook\n\n## Our values\n\n1. Ship small, ship often.\n2. Write it down.\n3. Leave it better than you found it.\n\n## Time off\n\n25 days PTO plus public holidays.\n'] },
    { folder: 'handbooks', name: 'New Hire Onboarding Checklist', file: 'onboarding-checklist.md', visibility: 'staff', tags: ['onboarding'], age: 45,
      description: 'Everything to finish in your first two weeks.',
      versions: ['# Onboarding Checklist\n\n- [ ] Set up your laptop and 2FA\n- [ ] Read the Employee Handbook\n- [ ] Meet your onboarding buddy\n- [ ] Ship your first change\n'] },
    { folder: 'customers', name: 'Product Warranty', file: 'product-warranty.md', visibility: 'customer', tags: ['warranty', 'support'], age: 60,
      description: 'Coverage and how to make a claim.',
      versions: ['# Product Warranty\n\nAll products carry a **12-month** warranty against manufacturing defects.\n\nTo make a claim, reply to your order email with photos of the issue.\n'] },
    { folder: 'customers', name: 'Care Instructions', file: 'care-instructions.md', visibility: 'customer', tags: ['support'], age: 30,
      description: 'Washing and care for apparel and enamelware.',
      versions: ['# Care Instructions\n\n- Apparel: wash cold, inside out; tumble dry low.\n- Enamel mugs: dishwasher safe; avoid metal scourers.\n'] },
    { folder: 'board', name: 'Q3 Board Meeting Notes', file: 'q3-board-notes.md', visibility: 'admin_only', tags: ['board', 'confidential'], age: 20,
      description: 'Decisions and follow-ups from the Q3 board meeting.',
      versions: ['# Q3 Board Meeting\n\n## Decisions\n\n- Approve hiring plan for two engineers.\n- Expand wholesale channel pilot.\n\n## Follow-ups\n\n- Revisit pricing in Q4.\n'] },
  ];

  for (const d of DOCS) {
    const docId = new ObjectId();
    const storageKey = `vault/${workspaceId.toString()}/${docId.toString()}`;
    let currentVersionId: ObjectId | null = null;
    for (const [i, content] of d.versions.entries()) {
      const verId = new ObjectId();
      const url = await storage.save(d.file, Buffer.from(content, 'utf8'), 'text/markdown', storageKey);
      const createdAt = daysFrom(now, -d.age + i * Math.floor(d.age / 2));
      await versColl.insertOne({
        _id: verId, workspaceId, documentId: docId, versionNumber: i + 1, storageKey, url,
        mimetype: 'text/markdown', size: Buffer.byteLength(content, 'utf8'), originalName: d.file,
        uploadedBy: d.visibility === 'admin_only' ? admin : owner,
        note: i === 0 ? '' : 'Updated remote days and added equipment stipend', createdAt,
      });
      currentVersionId = verId;
    }
    const created = daysFrom(now, -d.age);
    await docsColl.insertOne({
      _id: docId, workspaceId, folderId: folderId[d.folder], name: d.name, description: d.description,
      visibility: d.visibility, ownerId: d.visibility === 'admin_only' ? admin : owner,
      currentVersionId, tags: d.tags, createdAt: created,
      updatedAt: d.versions.length > 1 ? daysFrom(created, Math.floor(d.age / 2)) : created,
    });
  }
}
