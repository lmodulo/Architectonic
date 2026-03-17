import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { FastifyInstance } from 'fastify';

const __dirname = dirname(fileURLToPath(import.meta.url));

const perms = JSON.parse(
  readFileSync(join(__dirname, '../data/permissions.json'), 'utf8')
) as Record<string, Record<string, Record<string, boolean>>>;

const DEFAULT_SETTINGS = [
  {
    key: 'app.name',
    value: 'Architectonic',
    type: 'string',
    label: 'Application Name',
    description: 'Display name shown in the browser title and header'
  },
  {
    key: 'app.logo',
    value: '',
    type: 'string',
    label: 'Application Logo',
    description: 'Logo image URL shown in the header (managed via the logo upload UI)'
  },
  {
    key: 'app.registration_open',
    value: true,
    type: 'boolean',
    label: 'Open Registration',
    description: 'Allow new users to self-register without an invitation'
  },
  {
    key: 'theme.mode',
    value: 'light',
    type: 'select',
    label: 'Default Theme',
    description: 'Application color scheme for new sessions',
    options: ['light', 'dark']
  },
  {
    key: 'chat.enabled',
    value: true,
    type: 'boolean',
    label: 'AI Assistant',
    description: 'Show the AI chat assistant panel for authenticated users'
  }
];

// Upserts default roles on every boot — idempotent.
// $setOnInsert preserves manual permission edits made after first seed.
export default async function seedPlugin(app: FastifyInstance) {
  app.addHook('onReady', async () => {
    const db   = app.mongo.db!;
    const now  = new Date();

    // Roles
    const roles = db.collection('roles');
    for (const [name, label, permissions] of [
      ['admin',    'Administrator', perms.admin],
      ['viewer',   'Viewer',       perms.viewer],
      ['customer', 'Customer',     perms.customer]
    ] as const) {
      await roles.updateOne(
        { name },
        {
          $setOnInsert: { name, createdAt: now },
          $set:         { label, permissions, updatedAt: now }
        },
        { upsert: true }
      );
    }

    // Settings — $setOnInsert preserves user-edited values; $set keeps structural fields current
    const settings = db.collection('settings');
    for (const s of DEFAULT_SETTINGS) {
      await settings.updateOne(
        { key: s.key },
        {
          $setOnInsert: { value: s.value, createdAt: now, updatedBy: null },
          $set:         { type: s.type, label: s.label, description: s.description, options: (s as any).options ?? null, updatedAt: now }
        },
        { upsert: true }
      );
    }

    // Commerce — categories
    const categories = db.collection('categories');
    const CATEGORIES = [
      { slug: 'bags',        name: 'Bags',        description: 'Backpacks, totes, and travel bags.', order: 0 },
      { slug: 'apparel',     name: 'Apparel',     description: 'Jackets, knitwear, and everyday basics.', order: 1 },
      { slug: 'accessories', name: 'Accessories', description: 'Hats, wallets, and small goods.', order: 2 }
    ];
    const catIds: Record<string, string> = {};
    for (const c of CATEGORIES) {
      const result = await categories.updateOne(
        { slug: c.slug },
        { $setOnInsert: { ...c, parentId: null, createdAt: now, updatedAt: now } },
        { upsert: true }
      );
      const doc = await categories.findOne({ slug: c.slug });
      catIds[c.slug] = doc!._id.toString();
    }

    // Commerce — products (idempotent by slug)
    const products = db.collection('products');
    const PRODUCTS = [
      {
        slug: 'rolltop-24l',
        name: 'Rolltop 24L',
        description: 'A versatile rolltop backpack built for daily use and weekend escapes. Water-resistant waxed canvas with padded laptop sleeve.',
        basePrice: 18000,
        category: catIds['bags'],
        tags: ['waterproof', 'bestseller'],
        variantOptions: [
          { name: 'Color', values: ['Black', 'Forest Green'] }
        ],
        variants: [
          { sku: 'ROLL-24-BLK', combination: { Color: 'Black' },        stock: 12, lowStockThreshold: 3 },
          { sku: 'ROLL-24-GRN', combination: { Color: 'Forest Green' }, stock: 6,  lowStockThreshold: 3 }
        ],
        discounts: []
      },
      {
        slug: 'canvas-tote',
        name: 'Canvas Tote',
        description: 'Minimalist canvas tote with a single interior pocket and reinforced handles. Made from organic cotton canvas.',
        basePrice: 9500,
        category: catIds['bags'],
        tags: ['everyday', 'organic'],
        variantOptions: [
          { name: 'Color', values: ['Black', 'Sand', 'Terracotta'] }
        ],
        variants: [
          { sku: 'TOTE-BLK', combination: { Color: 'Black' },     stock: 20, lowStockThreshold: 5 },
          { sku: 'TOTE-SND', combination: { Color: 'Sand' },      stock: 14, lowStockThreshold: 5 },
          { sku: 'TOTE-TER', combination: { Color: 'Terracotta' }, stock: 8, lowStockThreshold: 5 }
        ],
        discounts: []
      },
      {
        slug: 'weekend-bag',
        name: 'Weekend Bag',
        description: 'A structured duffel designed for two-night trips. Full-length zip, end pockets, and removable shoulder strap.',
        basePrice: 22000,
        category: catIds['bags'],
        tags: ['travel'],
        variantOptions: [
          { name: 'Color', values: ['Black', 'Cognac'] }
        ],
        variants: [
          { sku: 'WKND-BLK', combination: { Color: 'Black' },  stock: 7, lowStockThreshold: 2 },
          { sku: 'WKND-COG', combination: { Color: 'Cognac' }, stock: 4, lowStockThreshold: 2 }
        ],
        discounts: [
          { type: 'percentage', value: 15, label: 'Season Sale', active: true, startDate: null, endDate: null, minQuantity: null }
        ]
      },
      {
        slug: 'field-jacket',
        name: 'Field Jacket',
        description: 'A four-pocket field jacket in a durable ripstop shell. Relaxed fit, ideal over mid-layers.',
        basePrice: 29000,
        category: catIds['apparel'],
        tags: ['outerwear', 'new'],
        variantOptions: [
          { name: 'Size',  values: ['S', 'M', 'L', 'XL'] },
          { name: 'Color', values: ['Olive', 'Black'] }
        ],
        variants: [
          { sku: 'FJ-S-OLV',  combination: { Size: 'S',  Color: 'Olive' }, stock: 4, lowStockThreshold: 2 },
          { sku: 'FJ-M-OLV',  combination: { Size: 'M',  Color: 'Olive' }, stock: 6, lowStockThreshold: 2 },
          { sku: 'FJ-L-OLV',  combination: { Size: 'L',  Color: 'Olive' }, stock: 5, lowStockThreshold: 2 },
          { sku: 'FJ-XL-OLV', combination: { Size: 'XL', Color: 'Olive' }, stock: 3, lowStockThreshold: 2 },
          { sku: 'FJ-S-BLK',  combination: { Size: 'S',  Color: 'Black' }, stock: 4, lowStockThreshold: 2 },
          { sku: 'FJ-M-BLK',  combination: { Size: 'M',  Color: 'Black' }, stock: 7, lowStockThreshold: 2 },
          { sku: 'FJ-L-BLK',  combination: { Size: 'L',  Color: 'Black' }, stock: 5, lowStockThreshold: 2 },
          { sku: 'FJ-XL-BLK', combination: { Size: 'XL', Color: 'Black' }, stock: 2, lowStockThreshold: 2 }
        ],
        discounts: []
      },
      {
        slug: 'merino-tee',
        name: 'Merino T-Shirt',
        description: 'A lightweight merino wool tee that regulates temperature and resists odour. Fits true to size.',
        basePrice: 8500,
        category: catIds['apparel'],
        tags: ['merino', 'everyday'],
        variantOptions: [
          { name: 'Size',  values: ['S', 'M', 'L', 'XL'] },
          { name: 'Color', values: ['White', 'Black', 'Grey'] }
        ],
        variants: [
          ...['S', 'M', 'L', 'XL'].flatMap(size =>
            ['White', 'Black', 'Grey'].map(color => ({
              sku:         `MT-${size}-${color.toUpperCase().slice(0, 3)}`,
              combination: { Size: size, Color: color },
              stock:       Math.ceil(Math.random() * 10) + 5,
              lowStockThreshold: 3
            }))
          )
        ],
        discounts: []
      },
      {
        slug: 'wool-cap',
        name: 'Wool Cap',
        description: 'A ribbed wool beanie with a turned-up cuff. Made from 100% lambswool.',
        basePrice: 4500,
        category: catIds['accessories'],
        tags: ['winter', 'wool'],
        variantOptions: [
          { name: 'Color', values: ['Black', 'Forest Green', 'Camel'] }
        ],
        variants: [
          { sku: 'CAP-BLK', combination: { Color: 'Black' },        stock: 15, lowStockThreshold: 4 },
          { sku: 'CAP-GRN', combination: { Color: 'Forest Green' }, stock: 10, lowStockThreshold: 4 },
          { sku: 'CAP-CAM', combination: { Color: 'Camel' },        stock: 8,  lowStockThreshold: 4 }
        ],
        discounts: []
      },
      {
        slug: 'card-wallet',
        name: 'Card Wallet',
        description: 'A slim bi-fold card wallet in full-grain leather. Holds up to six cards and folded notes.',
        basePrice: 7500,
        category: catIds['accessories'],
        tags: ['leather', 'everyday'],
        variantOptions: [
          { name: 'Color', values: ['Black', 'Cognac', 'Tan'] }
        ],
        variants: [
          { sku: 'WLT-BLK', combination: { Color: 'Black' },  stock: 18, lowStockThreshold: 5 },
          { sku: 'WLT-COG', combination: { Color: 'Cognac' }, stock: 12, lowStockThreshold: 5 },
          { sku: 'WLT-TAN', combination: { Color: 'Tan' },    stock: 9,  lowStockThreshold: 5 }
        ],
        discounts: [
          { type: 'percentage', value: 10, label: 'Introductory Offer', active: true, startDate: null, endDate: null, minQuantity: null }
        ]
      }
    ];

    for (const p of PRODUCTS) {
      await products.updateOne(
        { slug: p.slug },
        { $setOnInsert: { ...p, status: 'active', images: [], createdAt: now, updatedAt: now } },
        { upsert: true }
      );
    }

    // Fetch product IDs after upsert so we can reference them in orders
    const prodDocs = await products.find(
      { slug: { $in: PRODUCTS.map(p => p.slug) } },
      { projection: { _id: 1, slug: 1, name: 1, basePrice: 1 } }
    ).toArray();
    const prodMap: Record<string, { id: string; name: string; basePrice: number }> = {};
    for (const d of prodDocs) {
      prodMap[d.slug] = { id: d._id.toString(), name: d.name, basePrice: d.basePrice };
    }

    // Commerce — orders (only seed if none exist)
    const orders = db.collection('orders');
    const existingOrderCount = await orders.countDocuments();
    if (existingOrderCount === 0) {
      // Seeded LCG RNG (deterministic)
      let rngState = (8675309 >>> 0) || 1;
      function rng() {
        rngState = (Math.imul(1664525, rngState) + 1013904223) >>> 0;
        return rngState / 0x100000000;
      }

      const STATUSES = [
        'delivered', 'delivered', 'delivered', 'delivered',
        'shipped', 'shipped', 'shipped',
        'processing', 'processing',
        'pending', 'pending',
        'cancelled',
        'refunded'
      ] as const;

      const GUEST_EMAILS = [
        'alex@example.com', 'morgan@example.com', 'sam@example.com',
        'taylor@example.com', 'casey@example.com', 'jordan@example.com',
        'riley@example.com', 'quinn@example.com', 'drew@example.com',
        'blake@example.com'
      ];

      const prodSlugs = Object.keys(prodMap);
      const orderDocs = [];

      for (let i = 0; i < 60; i++) {
        const daysAgo = Math.floor(rng() * 90);
        const createdAt = new Date(now.getTime() - daysAgo * 86400000);
        const status = STATUSES[Math.floor(rng() * STATUSES.length)];
        const itemCount = Math.floor(rng() * 3) + 1;

        const items = [];
        let total = 0;
        const usedSlugs = new Set<string>();

        for (let j = 0; j < itemCount; j++) {
          let slug = prodSlugs[Math.floor(rng() * prodSlugs.length)];
          // avoid duplicates in one order
          if (usedSlugs.has(slug)) slug = prodSlugs[Math.floor(rng() * prodSlugs.length)];
          usedSlugs.add(slug);
          const prod = prodMap[slug];
          if (!prod) continue;
          const qty = Math.floor(rng() * 3) + 1;
          const lineTotal = prod.basePrice * qty;
          total += lineTotal;
          items.push({
            productId: prod.id,
            name: prod.name,
            sku: slug.toUpperCase().slice(0, 8),
            quantity: qty,
            unitPrice: prod.basePrice,
            lineTotal
          });
        }

        orderDocs.push({
          orderNumber: `ORD-${1000 + i}`,
          status,
          items,
          total,
          itemCount: items.reduce((s, it) => s + it.quantity, 0),
          guestEmail: GUEST_EMAILS[Math.floor(rng() * GUEST_EMAILS.length)],
          notes: '',
          createdAt,
          updatedAt: createdAt
        });
      }

      if (orderDocs.length > 0) {
        await orders.insertMany(orderDocs);
      }
    }
  });
}
