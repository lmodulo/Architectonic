import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';

// A minimal CRUD resource to verify the full stack works.
// Replace with your own domain models.

const COLLECTION = 'examples';

const itemSchema = {
  type: 'object',
  properties: {
    _id: { type: 'string' },
    title: { type: 'string' },
    createdAt: { type: 'string' }
  }
} as const;

export default async function exampleRoutes(app: FastifyInstance) {
  // --- LIST ---
  app.get('/', {
    schema: {
      response: { 200: { type: 'array', items: itemSchema } }
    }
  }, async () => {
    const col = app.mongo.db!.collection(COLLECTION);
    return col.find().sort({ createdAt: -1 }).toArray();
  });

  // --- GET ONE ---
  app.get<{ Params: { id: string } }>('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      },
      response: { 200: itemSchema }
    }
  }, async (req, reply) => {
    const col = app.mongo.db!.collection(COLLECTION);
    const doc = await col.findOne({ _id: new ObjectId(req.params.id) });
    if (!doc) return reply.notFound('Item not found');
    return doc;
  });

  // --- CREATE ---
  app.post<{ Body: { title: string } }>('/', {
    schema: {
      body: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 }
        }
      },
      response: { 201: itemSchema }
    }
  }, async (req, reply) => {
    const col = app.mongo.db!.collection(COLLECTION);
    const doc = { title: req.body.title, createdAt: new Date().toISOString() };
    const result = await col.insertOne(doc);
    reply.code(201);
    return { _id: result.insertedId.toString(), ...doc };
  });

  // --- DELETE ---
  app.delete<{ Params: { id: string } }>('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      }
    }
  }, async (req, reply) => {
    const col = app.mongo.db!.collection(COLLECTION);
    const result = await col.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return reply.notFound('Item not found');
    reply.code(204);
  });
}
