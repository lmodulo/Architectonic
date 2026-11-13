<svelte:head>
  <title>Commerce — Documentation</title>
</svelte:head>

<div class="space-y-10">

  <div class="space-y-3">
    <h1 class="text-3xl font-bold">Commerce</h1>
    <p class="text-base opacity-70 leading-relaxed">
      The Commerce module manages a product catalog with variants and stock, organizes it into categories, tracks
      orders through fulfillment, and publishes a public storefront at <code class="bg-base-300 px-1 rounded text-xs">/shop</code>.
      Sales figures appear on the dashboard.
    </p>
    <div class="alert alert-info text-sm">
      There is no checkout yet: the storefront shows products but "Add to cart" is not wired up, and the API has no
      endpoint that creates orders. Orders arrive once a checkout is added (or with demo data — see below).
    </div>
  </div>

  <!-- Pages -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Pages</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Route</th><th>Access</th><th>What it does</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">/commerce/products</td><td class="text-sm">commerce_products.read</td><td class="text-sm opacity-70">Search and filter the catalog; create products; archive.</td></tr>
          <tr><td class="font-mono text-xs">/commerce/products/:id</td><td class="text-sm">commerce_products.read</td><td class="text-sm opacity-70">Edit details, images, variant options, per-variant price and stock, and discounts.</td></tr>
          <tr><td class="font-mono text-xs">/commerce/categories</td><td class="text-sm">commerce_categories.read</td><td class="text-sm opacity-70">Nested categories (optional parent) with a sort order.</td></tr>
          <tr><td class="font-mono text-xs">/commerce/inventory</td><td class="text-sm">commerce_products.read</td><td class="text-sm opacity-70">Low-stock report: variants at or below their low-stock threshold.</td></tr>
          <tr><td class="font-mono text-xs">/commerce/orders</td><td class="text-sm">commerce_orders.read</td><td class="text-sm opacity-70">Search orders by number or email; open one to update its status and notes.</td></tr>
          <tr><td class="font-mono text-xs">/shop</td><td class="text-sm">Public</td><td class="text-sm opacity-70">Storefront: category landing, category pages, and product pages with variant pickers. Rendered without the app shell, for visitors and signed-in users alike.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Data model -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Data Model</h2>
    <pre class="bg-base-300 rounded-box p-4 text-sm overflow-x-auto leading-relaxed"><code>categories   ← name, slug, parentId, order
products     ← name, slug, description, basePrice (cents), status, category (id), tags, images[]
  ├── variantOptions[]  ← e.g. &#123; name: 'Size', values: ['S','M','L'] &#125;
  └── variants[]        ← sku, combination, price? (cents), stock, lowStockThreshold?
orders       ← orderNumber (ORD-YYYY-000001), guestEmail | userId, status, notes,
  └── items[]           ← productId, productName, sku, variantLabel, quantity,
                          unitPrice, discountApplied, lineTotal (cents)
               subtotal, discountTotal, total (cents)
counters     ← &#123; _id: 'orders', seq &#125; drives order numbers</code></pre>
    <p class="text-sm opacity-70 leading-relaxed">
      Product status is <code class="bg-base-300 px-1 rounded text-xs">active</code>, <code class="bg-base-300 px-1 rounded text-xs">draft</code>, or
      <code class="bg-base-300 px-1 rounded text-xs">archived</code> — only active products appear in the storefront; deleting a product archives it.
      Order status is <code class="bg-base-300 px-1 rounded text-xs">pending</code> → <code class="bg-base-300 px-1 rounded text-xs">processing</code> →
      <code class="bg-base-300 px-1 rounded text-xs">shipped</code> → <code class="bg-base-300 px-1 rounded text-xs">delivered</code>, or
      <code class="bg-base-300 px-1 rounded text-xs">cancelled</code> / <code class="bg-base-300 px-1 rounded text-xs">refunded</code>.
    </p>
  </div>

  <!-- Dashboard -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Dashboard &amp; Analytics</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      The module adds a Sales section to the dashboard: total revenue, order count, average order value, and top product,
      plus daily (30 days) and monthly (12 months) revenue, revenue by product, and recent orders. Figures come from
      <code class="bg-base-300 px-1 rounded text-xs">GET /analytics</code> and count orders that are processing, shipped,
      or delivered. With no orders yet, the section shows an empty state.
    </p>
  </div>

  <!-- Storage -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Images &amp; Demo Data</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Product images use the app's storage provider (<code class="bg-base-300 px-1 rounded text-xs">STORAGE_PROVIDER</code>: local disk by
      default, or S3-compatible storage). With <code class="bg-base-300 px-1 rounded text-xs">SEED_DEMO_DATA=true</code>, the module seeds three
      categories, eight products (some low on stock), and about a year of sample orders into empty collections.
    </p>
  </div>

  <!-- Permissions -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Permissions</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Resources: <code class="bg-base-300 px-1 rounded text-xs">commerce_products</code>, <code class="bg-base-300 px-1 rounded text-xs">commerce_categories</code>,
      and <code class="bg-base-300 px-1 rounded text-xs">commerce_orders</code>, each with create / read / update / delete.
      Storefront endpoints are public and only return active products.
    </p>
  </div>

  <!-- ── API ─────────────────────────────────────────────── -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold border-b border-base-300 pb-2">Commerce — <code class="text-base font-mono">/commerce</code>, <code class="text-base font-mono">/storefront</code>, <code class="text-base font-mono">/analytics</code></h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Access</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/commerce/categories</td><td class="text-sm">commerce_categories.read</td><td class="text-sm opacity-70">List all categories.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/commerce/categories</td><td class="text-sm">commerce_categories.create</td><td class="text-sm opacity-70">Create. Body: name, description, parentId, order.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/commerce/categories/:id</td><td class="text-sm">commerce_categories.update</td><td class="text-sm opacity-70">Update a category.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/commerce/categories/:id</td><td class="text-sm">commerce_categories.delete</td><td class="text-sm opacity-70">Delete (refused while active products use it).</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/commerce/products</td><td class="text-sm">commerce_products.read</td><td class="text-sm opacity-70">List products with search, status, and category filters.</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/commerce/products</td><td class="text-sm">commerce_products.create</td><td class="text-sm opacity-70">Create. Body: name, basePrice, description, status, category, tags, variantOptions, variants.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/commerce/products/:id</td><td class="text-sm">commerce_products.read</td><td class="text-sm opacity-70">Get a product.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/commerce/products/:id</td><td class="text-sm">commerce_products.update</td><td class="text-sm opacity-70">Update a product.</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/commerce/products/:id</td><td class="text-sm">commerce_products.delete</td><td class="text-sm opacity-70">Archive a product (soft delete).</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/commerce/products/:id/images</td><td class="text-sm">commerce_products.update</td><td class="text-sm opacity-70">Upload image(s) (multipart).</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/commerce/products/:id/images</td><td class="text-sm">commerce_products.update</td><td class="text-sm opacity-70">Remove an image. Body: url.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/commerce/products/:id/variants/:sku/stock</td><td class="text-sm">commerce_products.update</td><td class="text-sm opacity-70">Adjust a variant's stock. Body: adjustment (±integer).</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/commerce/inventory</td><td class="text-sm">commerce_products.read</td><td class="text-sm opacity-70">Low-stock report.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/commerce/orders</td><td class="text-sm">commerce_orders.read</td><td class="text-sm opacity-70">List orders with search and status filters.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/commerce/orders/:id</td><td class="text-sm">commerce_orders.read</td><td class="text-sm opacity-70">Full order detail including items.</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/commerce/orders/:id/status</td><td class="text-sm">commerce_orders.update</td><td class="text-sm opacity-70">Update status. Body: status, notes.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/storefront/meta</td><td class="text-sm">Public</td><td class="text-sm opacity-70">Categories, variant types, and tags for the storefront menu.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/storefront/products</td><td class="text-sm">Public</td><td class="text-sm opacity-70">Active products. Query: category, tag, search, limit, skip.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/storefront/products/:slug</td><td class="text-sm">Public</td><td class="text-sm opacity-70">One active product.</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/analytics</td><td class="text-sm">Signed in</td><td class="text-sm opacity-70">Sales KPIs and chart data for the dashboard.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

</div>
