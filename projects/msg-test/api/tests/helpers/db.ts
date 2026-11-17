import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, type Db } from 'mongodb';

let mongod: MongoMemoryServer;
let client: MongoClient;

export async function startDb(): Promise<void> {
  mongod = await MongoMemoryServer.create();
  client = await MongoClient.connect(mongod.getUri());
}

export async function stopDb(): Promise<void> {
  await client.close();
  await mongod.stop();
}

export function getUri(): string {
  // Include a database name — @fastify/mongodb requires it to populate app.mongo.db
  const base = mongod.getUri();
  return base.endsWith('/') ? base + 'testdb' : base + '/testdb';
}

export function getDb(): Db {
  return client.db('testdb');
}
