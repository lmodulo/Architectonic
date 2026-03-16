import type { FastifyInstance } from 'fastify';
import productsRoutes   from './products.js';
import categoriesRoutes from './categories.js';
import ordersRoutes     from './orders.js';
import inventoryRoutes  from './inventory.js';

export default async function commerceRoutes(app: FastifyInstance) {
  app.register(productsRoutes,   { prefix: '/products' });
  app.register(categoriesRoutes, { prefix: '/categories' });
  app.register(ordersRoutes,     { prefix: '/orders' });
  app.register(inventoryRoutes,  { prefix: '/inventory' });
}
