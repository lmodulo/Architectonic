import bcrypt from 'bcryptjs';
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
    value: 'Potency By Potamus',
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

    // ── Commerce — categories ──────────────────────────────────────────
    const categories = db.collection('categories');
    const CATEGORIES = [
      { slug: 'bath-and-body', name: 'Bath & Body',   description: 'CBD bath bombs, epsom salt soaks, and bathing products.',  order: 0 },
      { slug: 'tinctures',     name: 'Tinctures',     description: 'Full spectrum CBD glycerin tinctures for topical use.',    order: 1 },
      { slug: 'topicals',      name: 'Topicals',      description: 'CBD salves, lotions, and roll-on relief products.',        order: 2 },
      { slug: 'merchandise',   name: 'Merchandise',   description: 'Stickers, apparel, and branded goods.',                   order: 3 }
    ];
    const catIds: Record<string, string> = {};
    for (const c of CATEGORIES) {
      await categories.updateOne(
        { slug: c.slug },
        { $setOnInsert: { ...c, parentId: null, createdAt: now, updatedAt: now } },
        { upsert: true }
      );
      const doc = await categories.findOne({ slug: c.slug });
      catIds[c.slug] = doc!._id.toString();
    }

    // ── Commerce — products ────────────────────────────────────────────
    //
    // Source: Potency By Potamus product catalog CSV.
    //
    // Naming convention: the CSV encodes variants directly in product names.
    //   "CBD Bath Bomb - Lavender"          → product "CBD Bath Bomb", variant Scent: Lavender
    //   "2 Oz Hemp CBD Warming Salve Tin"   → product "CBD Salve Tin", variant Type: Warming, Size: 2 Oz
    //   "Lavender 8 Oz Hemp CBD Epsom ..."  → product "CBD Epsom Salt Soak", variant Scent: Lavender, Size: 8 Oz
    //
    // Prices in cents. Where variants have different prices (size-dependent products),
    // basePrice is set to the lowest variant and others use priceOverride.
    //
    const products = db.collection('products');
    const PRODUCTS = [
      // ── Bath & Body ──────────────────────────────────────────────────
      {
        slug: 'cbd-bath-bomb',
        name: 'CBD Bath Bomb',
        description: '30mg hemp CBD bath bombs infused with a full spectrum extraction of high CBD industrial hemp (less than 0.3% THC). Mix and match 4 for $25. Ingredients: baking soda, citric acid, epsom salt, corn starch, hemp-infused vegetable glycerin, hemp-infused olive and coconut oil blend, essential oils, and coloring.',
        basePrice: 700,
        category: catIds['bath-and-body'],
        tags: ['cbd', 'bath', 'full-spectrum'],
        variantOptions: [
          { name: 'Scent', values: ['Lemon / Eucalyptus', 'Spearmint', 'Lavender', 'Sweet Orange'] }
        ],
        variants: [
          { sku: 'BATH-LEM', combination: { Scent: 'Lemon / Eucalyptus' }, priceOverride: null, stock: 8,  lowStockThreshold: 3 },
          { sku: 'BATH-SPR', combination: { Scent: 'Spearmint' },          priceOverride: null, stock: 6,  lowStockThreshold: 3 },
          { sku: 'BATH-LAV', combination: { Scent: 'Lavender' },           priceOverride: null, stock: 8,  lowStockThreshold: 3 },
          { sku: 'BATH-ORG', combination: { Scent: 'Sweet Orange' },       priceOverride: null, stock: 6,  lowStockThreshold: 3 }
        ],
        discounts: [
          { type: 'bundle', value: 2500, label: 'Mix & Match 4 for $25', active: true, startDate: null, endDate: null, minQuantity: 4 }
        ]
      },
      {
        slug: 'cbd-epsom-salt-soak',
        name: 'CBD Epsom Salt Soak',
        description: 'Hemp CBD epsom salt bath soaks infused with hemp-infused vegetable glycerin and essential oils. Available in multiple scents and sizes.',
        basePrice: 600,
        category: catIds['bath-and-body'],
        tags: ['cbd', 'bath', 'epsom-salt'],
        variantOptions: [
          { name: 'Scent', values: ['Eucalyptus', 'Lavender', 'Rosemary & Mint'] },
          { name: 'Size',  values: ['8 Oz', '16 Oz'] }
        ],
        variants: [
          { sku: 'EPSOM-EUC-8',  combination: { Scent: 'Eucalyptus',      Size: '8 Oz' },  priceOverride: null, stock: 9,  lowStockThreshold: 3 },
          { sku: 'EPSOM-EUC-16', combination: { Scent: 'Eucalyptus',      Size: '16 Oz' }, priceOverride: 1100, stock: 6,  lowStockThreshold: 3 },
          { sku: 'EPSOM-LAV-8',  combination: { Scent: 'Lavender',        Size: '8 Oz' },  priceOverride: null, stock: 15, lowStockThreshold: 3 },
          { sku: 'EPSOM-LAV-16', combination: { Scent: 'Lavender',        Size: '16 Oz' }, priceOverride: 1100, stock: 6,  lowStockThreshold: 3 },
          { sku: 'EPSOM-RM-8',   combination: { Scent: 'Rosemary & Mint', Size: '8 Oz' },  priceOverride: null, stock: 10, lowStockThreshold: 3 },
          { sku: 'EPSOM-RM-16',  combination: { Scent: 'Rosemary & Mint', Size: '16 Oz' }, priceOverride: 800,  stock: 8,  lowStockThreshold: 3 }
        ],
        discounts: []
      },

      // ── Tinctures ────────────────────────────────────────────────────
      {
        slug: 'full-spectrum-cbd-tincture',
        name: 'Full Spectrum CBD Tincture',
        description: 'Extra strength full spectrum topical CBD glycerin tincture. Contains CBD, THC (<0.3%), CBG, CBC, and CBDv. For topical use.',
        basePrice: 2500,
        category: catIds['tinctures'],
        tags: ['cbd', 'full-spectrum', 'tincture', 'extra-strength'],
        variantOptions: [
          { name: 'Size', values: ['1 Oz', '2 Oz', '4 Oz'] }
        ],
        variants: [
          { sku: 'TINCT-1OZ', combination: { Size: '1 Oz' }, priceOverride: null, stock: 12, lowStockThreshold: 3 },
          { sku: 'TINCT-2OZ', combination: { Size: '2 Oz' }, priceOverride: 4800, stock: 8,  lowStockThreshold: 3 },
          { sku: 'TINCT-4OZ', combination: { Size: '4 Oz' }, priceOverride: 9400, stock: 3,  lowStockThreshold: 2 }
        ],
        discounts: []
      },

      // ── Topicals ─────────────────────────────────────────────────────
      {
        slug: 'cbd-salve-tin',
        name: 'CBD Salve Tin',
        description: 'Hemp CBD salve in a tin. Available in Lavender (with coconut oil, beeswax, shea butter, and high CBD hemp) and Warming (with olive oil, ginger, cinnamon, clove, and full spectrum high CBD hemp). Less than 0.3% THC.',
        basePrice: 1300,
        category: catIds['topicals'],
        tags: ['cbd', 'salve', 'topical', 'full-spectrum'],
        variantOptions: [
          { name: 'Type', values: ['Lavender', 'Warming'] },
          { name: 'Size', values: ['1 Oz', '2 Oz', '4 Oz'] }
        ],
        variants: [
          { sku: 'SALV-TIN-LAV-1', combination: { Type: 'Lavender', Size: '1 Oz' }, priceOverride: null, stock: 16, lowStockThreshold: 4 },
          { sku: 'SALV-TIN-LAV-2', combination: { Type: 'Lavender', Size: '2 Oz' }, priceOverride: 2400, stock: 1,  lowStockThreshold: 2 },
          { sku: 'SALV-TIN-LAV-4', combination: { Type: 'Lavender', Size: '4 Oz' }, priceOverride: 4700, stock: 2,  lowStockThreshold: 2 },
          { sku: 'SALV-TIN-WRM-1', combination: { Type: 'Warming',  Size: '1 Oz' }, priceOverride: 1500, stock: 24, lowStockThreshold: 4 },
          { sku: 'SALV-TIN-WRM-2', combination: { Type: 'Warming',  Size: '2 Oz' }, priceOverride: 2900, stock: 8,  lowStockThreshold: 2 },
          { sku: 'SALV-TIN-WRM-4', combination: { Type: 'Warming',  Size: '4 Oz' }, priceOverride: 5700, stock: 6,  lowStockThreshold: 2 }
        ],
        discounts: []
      },
      {
        slug: 'cbd-salve-roll-on',
        name: 'CBD Salve Roll On',
        description: 'Hemp CBD salve in a convenient half-ounce roll-on applicator. Available in Lavender and Warming formulas. Less than 0.3% THC.',
        basePrice: 800,
        category: catIds['topicals'],
        tags: ['cbd', 'salve', 'topical', 'roll-on'],
        variantOptions: [
          { name: 'Type', values: ['Lavender', 'Warming'] }
        ],
        variants: [
          { sku: 'SALV-RO-LAV', combination: { Type: 'Lavender' }, priceOverride: null, stock: 4, lowStockThreshold: 2 },
          { sku: 'SALV-RO-WRM', combination: { Type: 'Warming' },  priceOverride: 900,  stock: 9, lowStockThreshold: 2 }
        ],
        discounts: []
      },

      // ── Merchandise ──────────────────────────────────────────────────
      {
        slug: 'maximus-minimus-sticker',
        name: 'Maximus Minimus Sticker',
        description: '3-inch die-cut Maximus Minimus sticker.',
        basePrice: 700,
        category: catIds['merchandise'],
        tags: ['sticker', 'merch'],
        variantOptions: [],
        variants: [
          { sku: 'STICKER-MM', combination: {}, priceOverride: null, stock: 16, lowStockThreshold: 5 }
        ],
        discounts: []
      }
    ];

    for (const p of PRODUCTS) {
      await products.updateOne(
        { slug: p.slug },
        { $setOnInsert: { ...p, status: 'active', images: [], createdAt: now, updatedAt: now } },
        { upsert: true }
      );
    }

    // ── Commerce — orders ──────────────────────────────────────────────
    // Fetch product IDs after upsert so we can reference them in orders.
    // Build a flat list of (slug, variantSku, effectivePrice, productName) for realistic order items.
    const prodDocs = await products.find(
      { slug: { $in: PRODUCTS.map(p => p.slug) } },
      { projection: { _id: 1, slug: 1, name: 1, basePrice: 1, variants: 1 } }
    ).toArray();

    interface OrderableItem {
      productId: string;
      name: string;
      sku: string;
      unitPrice: number;
      variantLabel: string;
    }
    const orderableItems: OrderableItem[] = [];

    for (const d of prodDocs) {
      for (const v of (d.variants || [])) {
        const price = v.priceOverride ?? d.basePrice;
        const comboLabel = Object.values(v.combination || {}).join(' / ');
        orderableItems.push({
          productId: d._id.toString(),
          name: d.name,
          sku: v.sku,
          unitPrice: price,
          variantLabel: comboLabel
        });
      }
    }

    const orders = db.collection('orders');
    const existingOrderCount = await orders.countDocuments();
    if (existingOrderCount === 0 && orderableItems.length > 0) {
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

      const orderDocs = [];

      for (let i = 0; i < 60; i++) {
        const daysAgo = Math.floor(rng() * 90);
        const createdAt = new Date(now.getTime() - daysAgo * 86400000);
        const status = STATUSES[Math.floor(rng() * STATUSES.length)];
        const itemCount = Math.floor(rng() * 3) + 1;

        const items = [];
        let total = 0;
        const usedSkus = new Set<string>();

        for (let j = 0; j < itemCount; j++) {
          const item = orderableItems[Math.floor(rng() * orderableItems.length)];
          // avoid duplicate SKUs in one order
          if (usedSkus.has(item.sku)) continue;
          usedSkus.add(item.sku);

          const qty = Math.floor(rng() * 3) + 1;
          const lineTotal = item.unitPrice * qty;
          total += lineTotal;

          items.push({
            productId: item.productId,
            name: item.variantLabel ? `${item.name} — ${item.variantLabel}` : item.name,
            sku: item.sku,
            quantity: qty,
            unitPrice: item.unitPrice,
            lineTotal
          });
        }

        if (items.length === 0) continue;

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

    // ── Users ──────────────────────────────────────────────────────────
    // Idempotent by email — never overwrites existing accounts.
    const users = db.collection('users');
    const SEED_USERS = [
      { username: 'admin',    email: 'admin@example.com',    password: 'admin123',    role: 'admin',    firstName: 'Admin',    lastName: 'User' },
      { username: 'viewer',   email: 'viewer@example.com',   password: 'viewer123',   role: 'viewer',   firstName: 'Viewer',   lastName: 'User' },
      { username: 'customer', email: 'customer@example.com', password: 'customer123', role: 'customer', firstName: 'Customer', lastName: 'User' },
    ];
    for (const u of SEED_USERS) {
      const passwordHash = await bcrypt.hash(u.password, 12);
      await users.updateOne(
        { email: u.email },
        {
          $setOnInsert: {
            username:     u.username,
            email:        u.email,
            passwordHash,
            firstName:    u.firstName,
            lastName:     u.lastName,
            role:         u.role,
            createdAt:    now,
            updatedAt:    now,
          }
        },
        { upsert: true }
      );
    }
  });
}