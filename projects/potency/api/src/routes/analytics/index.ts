import type { FastifyInstance } from 'fastify';

export default async function analyticsRoutes(app: FastifyInstance) {

  // GET /analytics — all dashboard analytics in one request
  app.get('/', {
    preHandler: app.requireAuth
  }, async () => {
    const db = app.mongo.db!;
    const now = new Date();

    // Date boundaries
    const day30 = new Date(now.getTime() - 30 * 86400000);
    const day90 = new Date(now.getTime() - 90 * 86400000);
    const month12Start = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [
      dailyRevenue,
      monthlyRevenue,
      revenueByProduct,
      stockByProduct,
      recentOrders,
      kpiResult
    ] = await Promise.all([

      // Daily revenue — last 30 days (only delivered/shipped count as revenue)
      db.collection('orders').aggregate([
        { $match: { createdAt: { $gte: day30 }, status: { $in: ['delivered', 'shipped', 'processing'] } } },
        { $group: {
          _id: {
            y: { $year: '$createdAt' },
            m: { $month: '$createdAt' },
            d: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$total' }
        }},
        { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } }
      ]).toArray(),

      // Monthly revenue — last 12 months
      db.collection('orders').aggregate([
        { $match: { createdAt: { $gte: month12Start }, status: { $in: ['delivered', 'shipped', 'processing'] } } },
        { $group: {
          _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
          revenue: { $sum: '$total' }
        }},
        { $sort: { '_id.y': 1, '_id.m': 1 } }
      ]).toArray(),

      // Revenue by product (unwind items)
      db.collection('orders').aggregate([
        { $match: { status: { $in: ['delivered', 'shipped', 'processing'] } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.name', revenue: { $sum: '$items.lineTotal' }, units: { $sum: '$items.quantity' } } },
        { $sort: { revenue: -1 } },
        { $limit: 8 }
      ]).toArray(),

      // Stock by product (from products collection)
      db.collection('products').aggregate([
        { $match: { status: 'active' } },
        { $project: {
          name: 1,
          totalStock: { $sum: '$variants.stock' }
        }},
        { $sort: { totalStock: -1 } }
      ]).toArray(),

      // Recent orders (for table) — last 25
      db.collection('orders').aggregate([
        { $sort: { createdAt: -1 } },
        { $limit: 50 },
        { $project: { items: 0 } }
      ]).toArray(),

      // KPIs — all-time totals from revenue-counting statuses
      db.collection('orders').aggregate([
        { $match: { status: { $in: ['delivered', 'shipped', 'processing'] } } },
        { $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalOrders:  { $sum: 1 }
        }}
      ]).toArray()

    ]);

    // Fill in missing days for the last 30 days
    const dailyMap: Record<string, number> = {};
    for (const r of dailyRevenue as any[]) {
      const key = `${r._id.y}-${String(r._id.m).padStart(2,'0')}-${String(r._id.d).padStart(2,'0')}`;
      dailyMap[key] = r.revenue;
    }
    const dailyFilled = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now.getTime() - (29 - i) * 86400000);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      return {
        label: `${d.getMonth()+1}/${d.getDate()}`,
        date: key,
        revenue: dailyMap[key] ?? 0
      };
    });

    // Fill in missing months for the last 12 months
    const monthlyMap: Record<string, number> = {};
    for (const r of monthlyRevenue as any[]) {
      monthlyMap[`${r._id.y}-${r._id.m}`] = r.revenue;
    }
    const monthlyFilled = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return {
        label: d.toLocaleString('en-US', { month: 'short' }),
        revenue: monthlyMap[`${d.getFullYear()}-${d.getMonth()+1}`] ?? 0
      };
    });

    // Calendar data — order counts per date (last 90 days)
    const calRaw = await db.collection('orders').aggregate([
      { $match: { createdAt: { $gte: day90 } } },
      { $group: {
        _id: {
          y: { $year: '$createdAt' },
          m: { $month: '$createdAt' },
          d: { $dayOfMonth: '$createdAt' }
        },
        count:   { $sum: 1 },
        revenue: { $sum: '$total' }
      }}
    ]).toArray() as any[];

    const calMap: Record<string, { count: number; revenue: number }> = {};
    for (const r of calRaw) {
      const key = `${r._id.y}-${String(r._id.m).padStart(2,'0')}-${String(r._id.d).padStart(2,'0')}`;
      calMap[key] = { count: r.count, revenue: r.revenue };
    }

    const kpi = (kpiResult as any[])[0] ?? { totalRevenue: 0, totalOrders: 0 };
    const topProduct = (revenueByProduct as any[])[0]?._id ?? '—';

    return {
      kpis: {
        totalRevenue: kpi.totalRevenue,
        totalOrders:  kpi.totalOrders,
        avgOrderValue: kpi.totalOrders > 0 ? Math.round(kpi.totalRevenue / kpi.totalOrders) : 0,
        topProduct
      },
      dailyRevenue: dailyFilled,
      monthlyRevenue: monthlyFilled,
      revenueByProduct: (revenueByProduct as any[]).map(r => ({ label: r._id, value: r.revenue, units: r.units })),
      stockByProduct: (stockByProduct as any[]).map(r => ({ label: r.name, value: r.totalStock })),
      recentOrders: (recentOrders as any[]).map(r => ({ ...r, id: r._id.toString(), _id: undefined })),
      calendarData: calMap
    };
  });
}
