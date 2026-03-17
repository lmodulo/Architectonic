import type { FastifyInstance } from 'fastify';

function mapProduct(d: any) {
  return { ...d, id: d._id.toString(), _id: undefined };
}

export default async function storefrontRoutes(app: FastifyInstance) {

  // GET /storefront/meta — categories, variant types, tags for mega-menu (public)
  app.get('/meta', {
    schema: { summary: 'Storefront navigation meta data' }
  }, async () => {
    const db = app.mongo.db!;

    const [categories, variantAgg, tagAgg, catImages] = await Promise.all([
      db.collection('categories').find({}).sort({ order: 1, name: 1 }).toArray(),
      db.collection('products').aggregate([
        { $match: { status: 'active' } },
        { $unwind: '$variantOptions' },
        { $group: { _id: '$variantOptions.name' } },
        { $sort: { _id: 1 } }
      ]).toArray(),
      db.collection('products').aggregate([
        { $match: { status: 'active' } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags' } },
        { $sort: { _id: 1 } }
      ]).toArray(),
      // First product image per category
      db.collection('products').aggregate([
        { $match: { status: 'active', 'images.0': { $exists: true } } },
        { $group: { _id: '$category', image: { $first: { $arrayElemAt: ['$images', 0] } } } }
      ]).toArray()
    ]);

    const imageMap: Record<string, string> = {};
    for (const r of catImages as any[]) imageMap[r._id] = r.image;

    return {
      categories: categories.map(c => ({
        ...c,
        id: c._id.toString(),
        _id: undefined,
        image: imageMap[c._id.toString()] ?? null
      })),
      variantTypes: variantAgg.map(v => v._id as string),
      tags: tagAgg.map(t => t._id as string)
    };
  });

  // GET /storefront/products — list active products (public)
  app.get<{
    Querystring: {
      category?: string;
      tag?: string;
      search?: string;
      limit?: number;
      skip?: number;
    }
  }>('/products', {
    schema: {
      summary: 'List active products',
      querystring: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          tag:      { type: 'string' },
          search:   { type: 'string' },
          limit:    { type: 'integer', minimum: 1, maximum: 100, default: 24 },
          skip:     { type: 'integer', minimum: 0, default: 0 }
        }
      }
    }
  }, async (req) => {
    const { category, tag, search, limit = 24, skip = 0 } = req.query;
    const db = app.mongo.db!;
    const filter: Record<string, unknown> = { status: 'active' };

    if (category) {
      const cat = await db.collection('categories').findOne({ slug: category });
      if (cat) filter.category = cat._id.toString();
    }

    if (tag) {
      filter.tags = { $in: [tag] };
    }

    let cursor;
    if (search) {
      filter.$text = { $search: search };
      cursor = db.collection('products')
        .find(filter, { projection: { score: { $meta: 'textScore' } } })
        .sort({ score: { $meta: 'textScore' } });
    } else {
      cursor = db.collection('products').find(filter).sort({ createdAt: -1 });
    }

    const [docs, total] = await Promise.all([
      cursor.skip(skip).limit(limit).toArray(),
      db.collection('products').countDocuments(filter)
    ]);

    return { products: docs.map(mapProduct), total, skip, limit };
  });

  // GET /storefront/products/:slug — single active product by slug (public)
  app.get<{ Params: { slug: string } }>('/products/:slug', {
    schema: { summary: 'Get a single active product by slug' }
  }, async (req, reply) => {
    const doc = await app.mongo.db!.collection('products').findOne({
      slug:   req.params.slug,
      status: 'active'
    });
    if (!doc) return reply.notFound('Product not found');
    return mapProduct(doc);
  });
}
