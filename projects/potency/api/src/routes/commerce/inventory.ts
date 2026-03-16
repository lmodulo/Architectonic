import type { FastifyInstance } from 'fastify';

const DEFAULT_LOW_STOCK_THRESHOLD = 5;

export default async function inventoryRoutes(app: FastifyInstance) {

  // GET /commerce/inventory — products with any variant at or below its low-stock threshold
  app.get('/', {
    preHandler: app.requirePermission('commerce_products', 'read'),
    schema: { summary: 'Low stock inventory report' }
  }, async () => {
    const db = app.mongo.db!;

    const products = await db.collection('products').find({
      status: 'active',
      variants: { $exists: true, $not: { $size: 0 } }
    }, {
      projection: { _id: 1, name: 1, slug: 1, category: 1, variants: 1 }
    }).toArray();

    const lowStockProducts = products
      .map(p => {
        const lowVariants = (p.variants ?? []).filter((v: any) => {
          const threshold = v.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
          return v.stock <= threshold;
        });
        return { id: p._id.toString(), name: p.name, slug: p.slug, category: p.category, lowStockVariants: lowVariants };
      })
      .filter(p => p.lowStockVariants.length > 0);

    return { products: lowStockProducts, total: lowStockProducts.length };
  });
}
