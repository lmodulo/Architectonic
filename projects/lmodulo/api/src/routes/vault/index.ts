import type { FastifyInstance } from 'fastify';
import foldersRoutes   from './folders.js';
import documentsRoutes from './documents.js';

export default async function vaultRoutes(app: FastifyInstance) {
  const db = app.mongo.db!;

  // vault_folders indexes
  await db.collection('vault_folders').createIndexes([
    { key: { workspaceId: 1, parentId: 1 } },
    { key: { workspaceId: 1, name: 1 } }
  ]);

  // vault_documents indexes
  await db.collection('vault_documents').createIndexes([
    { key: { workspaceId: 1, folderId: 1, createdAt: -1 } },
    { key: { workspaceId: 1, visibility: 1, createdAt: -1 } },
    { key: { name: 'text', tags: 'text' }, weights: { name: 2, tags: 1 } }
  ]);

  // vault_document_versions indexes
  await db.collection('vault_document_versions').createIndexes([
    { key: { workspaceId: 1, documentId: 1, versionNumber: -1 } }
  ]);

  await app.register(foldersRoutes,   { prefix: '/folders' });
  await app.register(documentsRoutes, { prefix: '/documents' });
}
