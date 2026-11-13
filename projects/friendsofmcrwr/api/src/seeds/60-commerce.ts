// Demo data — Commerce: categories, products (with variants and stock), and ~12 months of orders.
// Loaded only when SEED_DEMO_DATA=true (see lib/demo.ts); each collection is seeded only when empty.
// Prices are in cents. Orders follow the real format (ORD-YYYY-000001 from the `counters` sequence).
import { ObjectId } from 'mongodb';
import { daysFrom, demoRng, type DemoContext } from '../lib/demo.js';
import { toSlug } from '../lib/slug.js';

type Variant = { sku: string; combination: Record<string, string>; price?: number; stock: number; lowStockThreshold?: number };
type Product = {
  _id: ObjectId; name: string; description: string; basePrice: number; status: 'active' | 'draft' | 'archived';
  categoryKey: string; tags: string[]; variantOptions: { name: string; values: string[] }[]; variants: Variant[];
};

export default async function seed({ db, now }: DemoContext): Promise<void> {
  const categoriesColl = db.collection('categories');
  const productsColl   = db.collection('products');
  const ordersColl     = db.collection('orders');
  const rng = demoRng(20261112);

  // ── Categories ──────────────────────────────────────────────────────
  const CATEGORIES = [
    { key: 'apparel',     name: 'Apparel',     description: 'Tees, hoodies, and everyday wear' },
    { key: 'accessories', name: 'Accessories', description: 'Bags, caps, and small goods' },
    { key: 'home',        name: 'Home Goods',  description: 'Mugs, prints, and things for the desk' },
  ].map((c, i) => ({ ...c, _id: new ObjectId(), order: i }));

  if (!await categoriesColl.countDocuments()) {
    await categoriesColl.insertMany(CATEGORIES.map(({ key: _key, ...c }) => ({
      ...c, slug: toSlug(c.name), parentId: null, createdAt: daysFrom(now, -400), updatedAt: daysFrom(now, -400),
    })));
  }
  const catId = async (key: string) => {
    const name = CATEGORIES.find(c => c.key === key)!.name;
    return (await categoriesColl.findOne({ name }))?._id?.toString() ?? '';
  };

  // ── Products ────────────────────────────────────────────────────────
  const sizes = (sku: string, stock: number[], price?: number, low = 5): Variant[] =>
    ['S', 'M', 'L', 'XL'].map((s, i) => ({ sku: `${sku}-${s}`, combination: { Size: s }, price, stock: stock[i], lowStockThreshold: low }));
  const colors = (sku: string, values: [string, number][], low = 5): Variant[] =>
    values.map(([c, stock]) => ({ sku: `${sku}-${c.toUpperCase().slice(0, 3)}`, combination: { Color: c }, stock, lowStockThreshold: low }));

  const PRODUCTS: Product[] = [
    { _id: new ObjectId(), name: 'Classic Logo Tee', description: 'Heavyweight cotton tee with a printed chest logo.', basePrice: 2800, status: 'active', categoryKey: 'apparel', tags: ['bestseller', 'cotton'],
      variantOptions: [{ name: 'Size', values: ['S', 'M', 'L', 'XL'] }], variants: sizes('TEE', [24, 40, 33, 3]) },
    { _id: new ObjectId(), name: 'Zip Hoodie', description: 'Midweight fleece hoodie with a full zip.', basePrice: 6400, status: 'active', categoryKey: 'apparel', tags: ['fleece', 'winter'],
      variantOptions: [{ name: 'Size', values: ['S', 'M', 'L', 'XL'] }], variants: sizes('HOOD', [8, 2, 11, 6], 6800) },
    { _id: new ObjectId(), name: 'Field Cap', description: 'Unstructured six-panel cap with an adjustable strap.', basePrice: 2400, status: 'active', categoryKey: 'accessories', tags: ['bestseller'],
      variantOptions: [{ name: 'Color', values: ['Black', 'Olive', 'Sand'] }], variants: colors('CAP', [['Black', 30], ['Olive', 4], ['Sand', 17]]) },
    { _id: new ObjectId(), name: 'Canvas Tote', description: '16oz canvas tote with an internal pocket.', basePrice: 1900, status: 'active', categoryKey: 'accessories', tags: ['eco'],
      variantOptions: [{ name: 'Color', values: ['Natural', 'Black'] }], variants: colors('TOTE', [['Natural', 52], ['Black', 21]]) },
    { _id: new ObjectId(), name: 'Enamel Camp Mug', description: '12oz enamel mug, dishwasher safe.', basePrice: 1600, status: 'active', categoryKey: 'home', tags: ['gift'],
      variantOptions: [{ name: 'Color', values: ['White', 'Navy'] }], variants: colors('MUG', [['White', 3], ['Navy', 26]]) },
    { _id: new ObjectId(), name: 'Studio Print', description: 'Archival 12×16 print, signed and numbered.', basePrice: 4500, status: 'active', categoryKey: 'home', tags: ['limited', 'gift'],
      variantOptions: [], variants: [{ sku: 'PRINT', combination: {}, stock: 9, lowStockThreshold: 10 }] },
    { _id: new ObjectId(), name: 'Desk Notebook', description: 'Dot-grid A5 notebook, lay-flat binding.', basePrice: 1400, status: 'draft', categoryKey: 'home', tags: ['new'],
      variantOptions: [], variants: [{ sku: 'NOTE', combination: {}, stock: 60 }] },
    { _id: new ObjectId(), name: 'Retro Windbreaker', description: 'Last season’s windbreaker — retired.', basePrice: 7200, status: 'archived', categoryKey: 'apparel', tags: ['retired'],
      variantOptions: [{ name: 'Size', values: ['S', 'M', 'L', 'XL'] }], variants: sizes('WIND', [0, 1, 0, 2]) },
  ];

  if (!await productsColl.countDocuments()) {
    const docs = [];
    for (const p of PRODUCTS) {
      const { categoryKey, ...rest } = p;
      const created = daysFrom(now, -380 + Math.floor(rng() * 60));
      docs.push({ ...rest, slug: toSlug(p.name), category: await catId(categoryKey), images: [], discounts: [], createdAt: created, updatedAt: created });
    }
    await productsColl.insertMany(docs);
  }

  // ── Orders (~12 months, denser in the last 90 days) ──────────────────
  if (await ordersColl.countDocuments()) return;
  const sellable = await productsColl.find({ status: 'active' }).toArray();
  if (!sellable.length) return;

  const CUSTOMERS = ['ava.reed', 'ben.ortiz', 'chloe.kim', 'dan.price', 'ella.moss', 'finn.hale', 'grace.lee', 'hugo.west', 'iris.vale', 'jay.brooks', 'kira.nash', 'leo.park']
    .map(n => `${n}@example.com`);
  const pickStatus = (ageDays: number) => {
    const r = rng();
    if (ageDays < 3)  return r < 0.6 ? 'pending' : 'processing';
    if (ageDays < 10) return r < 0.5 ? 'processing' : r < 0.9 ? 'shipped' : 'cancelled';
    return r < 0.82 ? 'delivered' : r < 0.92 ? 'refunded' : 'cancelled';
  };

  const ages: number[] = [];
  for (let i = 0; i < 70; i++) ages.push(Math.floor(rng() * 90));          // last 90 days
  for (let i = 0; i < 40; i++) ages.push(90 + Math.floor(rng() * 270));    // 3–12 months ago
  ages.sort((a, b) => b - a);                                              // oldest first → ascending numbers

  const seqByYear: Record<number, number> = {};
  const orders = ages.map(age => {
    const createdAt = daysFrom(now, -age);
    createdAt.setHours(8 + Math.floor(rng() * 12), Math.floor(rng() * 60), 0, 0);
    const lineCount = 1 + Math.floor(rng() * 3);
    const items = Array.from({ length: lineCount }, () => {
      const p = sellable[Math.floor(rng() * sellable.length)];
      const v = (p.variants as Variant[])[Math.floor(rng() * p.variants.length)];
      const quantity = 1 + Math.floor(rng() * 3);
      const unitPrice = v.price ?? p.basePrice;
      const discountApplied = rng() < 0.15 ? Math.round(unitPrice * quantity * 0.1) : 0;
      return {
        productId: p._id, productName: p.name, sku: v.sku,
        variantLabel: Object.values(v.combination).join(' / '),
        quantity, unitPrice, discountApplied, lineTotal: unitPrice * quantity - discountApplied,
      };
    });
    const subtotal      = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const discountTotal = items.reduce((s, i) => s + i.discountApplied, 0);
    const year = createdAt.getFullYear();
    const seq  = (seqByYear[year] = (seqByYear[year] ?? 0) + 1);
    const status = pickStatus(age);
    return {
      orderNumber: `ORD-${year}-${String(seq).padStart(6, '0')}`,
      userId: null,
      guestEmail: CUSTOMERS[Math.floor(rng() * CUSTOMERS.length)],
      items, subtotal, discountTotal, total: subtotal - discountTotal,
      status,
      notes: status === 'refunded' ? 'Customer returned items — refunded in full.' : '',
      createdAt,
      updatedAt: status === 'pending' ? createdAt : daysFrom(createdAt, Math.min(age, 4)),
    };
  });
  await ordersColl.insertMany(orders);

  // Continue the real order-number sequence after the demo orders (current year)
  await db.collection('counters').updateOne(
    { _id: 'orders' as unknown as ObjectId },
    { $max: { seq: seqByYear[now.getFullYear()] ?? 0 } },
    { upsert: true },
  );
}
