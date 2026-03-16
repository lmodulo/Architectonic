import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { logAudit } from '../../lib/audit.js';
import { toSlug } from '../../lib/slug.js';
import { storage } from '../../lib/storage.js';

const COL = 'products';

const STATUS_VALUES = ['active', 'draft', 'archived'] as const;

function mapProduct(d: any) {
  return { ...d, id: d._id.toString(), _id: undefined };
}

export default async function productsRoutes(app: FastifyInstance) {

  // GET /commerce/products — list with filters and pagination
  app.get<{
    Querystring: {
      status?: string; category?: string; search?: string;
      limit?: number; skip?: number;
    }
  }>('/', {
    preHandler: app.requirePermission('commerce_products', 'read'),
    schema: {
      summary: 'List products',
      querystring: {
        type: 'object',
        properties: {
          status:   { type: 'string', enum: [...STATUS_VALUES] },
          category: { type: 'string' },
          search:   { type: 'string' },
          limit:    { type: 'integer', minimum: 1, maximum: 100, default: 25 },
          skip:     { type: 'integer', minimum: 0, default: 0 }
        }
      }
    }
  }, async (req) => {
    const { status, category, search, limit = 25, skip = 0 } = req.query;
    const db     = app.mongo.db!;
    const filter: Record<string, unknown> = {};

    if (status)   filter.status   = status;
    if (category) filter.category = category;

    let cursor;
    if (search) {
      filter.$text = { $search: search };
      cursor = db.collection(COL)
        .find(filter, { projection: { score: { $meta: 'textScore' } } })
        .sort({ score: { $meta: 'textScore' } });
    } else {
      cursor = db.collection(COL).find(filter).sort({ createdAt: -1 });
    }

    const [docs, total] = await Promise.all([
      cursor.skip(skip).limit(limit).toArray(),
      db.collection(COL).countDocuments(filter)
    ]);

    return { products: docs.map(mapProduct), total, skip, limit };
  });

  // POST /commerce/products — create
  app.post<{
    Body: {
      name: string;
      description?: string;
      basePrice: number;
      status?: string;
      category?: string;
      tags?: string[];
      variantOptions?: { name: string; values: string[] }[];
      variants?: {
        sku: string;
        combination: Record<string, string>;
        price?: number;
        stock: number;
        lowStockThreshold?: number;
      }[];
    }
  }>('/', {
    preHandler: app.requirePermission('commerce_products', 'create'),
    schema: {
      summary: 'Create a product',
      body: {
        type: 'object',
        required: ['name', 'basePrice'],
        properties: {
          name:           { type: 'string', minLength: 1, maxLength: 200 },
          description:    { type: 'string', maxLength: 5000 },
          basePrice:      { type: 'integer', minimum: 0 },
          status:         { type: 'string', enum: [...STATUS_VALUES], default: 'draft' },
          category:       { type: 'string' },
          tags:           { type: 'array', items: { type: 'string' } },
          variantOptions: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'values'],
              properties: {
                name:   { type: 'string' },
                values: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          variants: {
            type: 'array',
            items: {
              type: 'object',
              required: ['sku', 'combination', 'stock'],
              properties: {
                sku:               { type: 'string' },
                combination:       { type: 'object' },
                price:             { type: 'integer', minimum: 0 },
                stock:             { type: 'integer', minimum: 0 },
                lowStockThreshold: { type: 'integer', minimum: 0 }
              }
            }
          }
        }
      }
    }
  }, async (req, reply) => {
    const {
      name, description = '', basePrice, status = 'draft',
      category = '', tags = [], variantOptions = [], variants = []
    } = req.body;
    const db  = app.mongo.db!;
    const now = new Date();

    const doc = {
      name,
      slug:           toSlug(name),
      description,
      basePrice,
      status,
      category,
      images:         [] as string[],
      tags,
      variantOptions,
      variants,
      discounts:      [] as unknown[],
      createdAt:      now,
      updatedAt:      now
    };

    try {
      const result = await db.collection(COL).insertOne(doc);
      logAudit(db, {
        userId:     req.session.userId!,
        username:   req.session.username!,
        action:     'product.create',
        resourceId: result.insertedId.toString(),
        meta:       { name, status },
        ip:         req.ip
      });
      reply.code(201);
      return { id: result.insertedId.toString(), slug: doc.slug };
    } catch (err: any) {
      if (err?.code === 11000) return reply.conflict('A product with this name already exists');
      throw err;
    }
  });

  // GET /commerce/products/:id — get single product
  app.get<{ Params: { id: string } }>('/:id', {
    preHandler: app.requirePermission('commerce_products', 'read'),
    schema: { summary: 'Get a product by ID' }
  }, async (req, reply) => {
    const doc = await app.mongo.db!.collection(COL).findOne({ _id: new ObjectId(req.params.id) });
    if (!doc) return reply.notFound('Product not found');
    return mapProduct(doc);
  });

  // PATCH /commerce/products/:id — update fields
  app.patch<{
    Params: { id: string };
    Body: {
      name?: string;
      description?: string;
      basePrice?: number;
      status?: string;
      category?: string;
      tags?: string[];
      variantOptions?: { name: string; values: string[] }[];
      variants?: {
        sku: string;
        combination: Record<string, string>;
        price?: number;
        stock: number;
        lowStockThreshold?: number;
      }[];
      discounts?: {
        id?: string;
        type: string;
        value: number;
        minQuantity?: number;
        label: string;
        startDate?: string;
        endDate?: string;
        active: boolean;
      }[];
    }
  }>('/:id', {
    preHandler: app.requirePermission('commerce_products', 'update'),
    schema: {
      summary: 'Update a product',
      body: { type: 'object' }
    }
  }, async (req, reply) => {
    const db  = app.mongo.db!;
    const _id = new ObjectId(req.params.id);
    const {
      name, description, basePrice, status, category,
      tags, variantOptions, variants, discounts
    } = req.body;

    const $set: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined)           { $set.name = name; $set.slug = toSlug(name); }
    if (description !== undefined)    $set.description = description;
    if (basePrice !== undefined)      $set.basePrice = basePrice;
    if (status !== undefined)         $set.status = status;
    if (category !== undefined)       $set.category = category;
    if (tags !== undefined)           $set.tags = tags;
    if (variantOptions !== undefined) $set.variantOptions = variantOptions;
    if (variants !== undefined)       $set.variants = variants;
    if (discounts !== undefined)      $set.discounts = discounts;

    try {
      const result = await db.collection(COL).updateOne({ _id }, { $set });
      if (result.matchedCount === 0) return reply.notFound('Product not found');
      logAudit(db, {
        userId:     req.session.userId!,
        username:   req.session.username!,
        action:     'product.update',
        resourceId: req.params.id,
        meta:       { fields: Object.keys($set) },
        ip:         req.ip
      });
      return { updated: true };
    } catch (err: any) {
      if (err?.code === 11000) return reply.conflict('A product with this name already exists');
      throw err;
    }
  });

  // DELETE /commerce/products/:id — soft delete (archive)
  app.delete<{ Params: { id: string } }>('/:id', {
    preHandler: app.requirePermission('commerce_products', 'delete'),
    schema: { summary: 'Archive a product (soft delete)' }
  }, async (req, reply) => {
    const db     = app.mongo.db!;
    const _id    = new ObjectId(req.params.id);
    const result = await db.collection(COL).updateOne(
      { _id },
      { $set: { status: 'archived', updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) return reply.notFound('Product not found');
    logAudit(db, {
      userId:     req.session.userId!,
      username:   req.session.username!,
      action:     'product.archive',
      resourceId: req.params.id,
      ip:         req.ip
    });
    return { archived: true };
  });

  // POST /commerce/products/:id/images — upload image(s) via multipart
  app.post<{ Params: { id: string } }>('/:id/images', {
    preHandler: app.requirePermission('commerce_products', 'update'),
    schema: { summary: 'Upload product image(s)' }
  }, async (req, reply) => {
    const db  = app.mongo.db!;
    const _id = new ObjectId(req.params.id);

    const exists = await db.collection(COL).countDocuments({ _id });
    if (!exists) return reply.notFound('Product not found');

    const urls: string[] = [];
    const files = req.files();

    for await (const file of files) {
      if (!file.mimetype.startsWith('image/')) {
        return reply.badRequest(`File "${file.filename}" is not an image`);
      }
      const buffer = await file.toBuffer();
      const url    = await storage.save(file.filename, buffer, file.mimetype);
      urls.push(url);
    }

    if (urls.length === 0) return reply.badRequest('No image files received');

    await db.collection(COL).updateOne({ _id }, { $push: { images: { $each: urls } } });
    logAudit(db, {
      userId:     req.session.userId!,
      username:   req.session.username!,
      action:     'product.image_upload',
      resourceId: req.params.id,
      meta:       { count: urls.length },
      ip:         req.ip
    });
    return { urls };
  });

  // DELETE /commerce/products/:id/images — remove an image URL
  app.delete<{ Params: { id: string }; Body: { url: string } }>('/:id/images', {
    preHandler: app.requirePermission('commerce_products', 'update'),
    schema: {
      summary: 'Remove a product image',
      body: {
        type: 'object',
        required: ['url'],
        properties: { url: { type: 'string' } }
      }
    }
  }, async (req, reply) => {
    const db  = app.mongo.db!;
    const _id = new ObjectId(req.params.id);
    const { url } = req.body;

    const result = await db.collection(COL).updateOne({ _id }, { $pull: { images: url } });
    if (result.matchedCount === 0) return reply.notFound('Product not found');

    if (url.startsWith('/uploads/')) {
      await storage.remove(url);
    }

    logAudit(db, {
      userId:     req.session.userId!,
      username:   req.session.username!,
      action:     'product.image_remove',
      resourceId: req.params.id,
      meta:       { url },
      ip:         req.ip
    });
    return { removed: true };
  });

  // PATCH /commerce/products/:id/variants/:sku/stock — adjust stock atomically
  app.patch<{ Params: { id: string; sku: string }; Body: { adjustment: number } }>('/:id/variants/:sku/stock', {
    preHandler: app.requirePermission('commerce_products', 'update'),
    schema: {
      summary: 'Adjust variant stock',
      body: {
        type: 'object',
        required: ['adjustment'],
        properties: { adjustment: { type: 'integer' } }
      }
    }
  }, async (req, reply) => {
    const db         = app.mongo.db!;
    const _id        = new ObjectId(req.params.id);
    const { sku }    = req.params;
    const { adjustment } = req.body;

    const filter: Record<string, unknown> = { _id, 'variants.sku': sku };
    if (adjustment < 0) {
      filter['variants.stock'] = { $gte: -adjustment };
    }

    const result = await db.collection(COL).updateOne(
      filter,
      { $inc: { 'variants.$[v].stock': adjustment } },
      { arrayFilters: [{ 'v.sku': sku }] }
    );

    if (result.matchedCount === 0) {
      const product = await db.collection(COL).findOne({ _id, 'variants.sku': sku });
      if (!product) return reply.notFound('Product or SKU not found');
      return reply.conflict('Insufficient stock for this adjustment');
    }

    logAudit(db, {
      userId:     req.session.userId!,
      username:   req.session.username!,
      action:     'product.stock_adjust',
      resourceId: req.params.id,
      meta:       { sku, adjustment },
      ip:         req.ip
    });
    return { adjusted: true, adjustment };
  });
}
