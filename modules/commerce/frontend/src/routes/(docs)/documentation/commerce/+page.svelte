<svelte:head>
  <title>Commerce — Documentation</title>
</svelte:head>

<div class="space-y-10">

  <div class="space-y-3">
    <h1 class="text-3xl font-bold">Commerce</h1>
    <p class="text-base opacity-70 leading-relaxed">
      The Commerce module manages a product catalog with variants and stock, organizes it into categories, tracks
      orders through fulfillment, and publishes a public storefront at <code class="bg-base-300 px-1 rounded text-xs">/shop</code>.
      Where the Content module is installed it also adds a <strong>Shop</strong> page type, so the shop can be a page of
      the public website (see <a href="#shop-page" class="link">Shop page</a>). Sales figures appear on the dashboard.
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
          <tr><td class="font-mono text-xs">/commerce/products/:id</td><td class="text-sm">commerce_products.read</td><td class="text-sm opacity-70">Edit details (including whether the product tracks inventory), images, variant options, per-variant price and stock, and discounts.</td></tr>
          <tr><td class="font-mono text-xs">/commerce/categories</td><td class="text-sm">commerce_categories.read</td><td class="text-sm opacity-70">Nested categories (optional parent) with a sort order.</td></tr>
          <tr><td class="font-mono text-xs">/commerce/inventory</td><td class="text-sm">commerce_products.read</td><td class="text-sm opacity-70">Low-stock report: variants at or below their low-stock threshold, for products that track inventory.</td></tr>
          <tr><td class="font-mono text-xs">/commerce/orders</td><td class="text-sm">commerce_orders.read</td><td class="text-sm opacity-70">Search orders by number or email; open one to update its status and notes.</td></tr>
          <tr><td class="font-mono text-xs">/shop</td><td class="text-sm">Public</td><td class="text-sm opacity-70">Storefront: every product with category filters, a page per category and per product (option pickers, stock, sale prices), and tag filters; the URLs are listed under <a href="#shop-page" class="link">Shop page</a>, with /shop as the base. Rendered under its own menu bar (categories and tags) without the app shell, for visitors and signed-in users alike.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Shop page (Content) -->
  <div class="space-y-4" id="shop-page">
    <h2 class="text-xl font-semibold">Shop Page (with Content)</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      With the Content module installed, Commerce adds a <strong>Shop</strong> page type: in Content, add a component
      item of type Shop wherever the shop belongs in the site tree. It uses the public site's header, footer and
      breadcrumbs. Its one setting is products per page (1–100, default 24). Commerce ships it as a Content registry
      entry, <code class="bg-base-300 px-1 rounded text-xs">$lib/config/cms-components/shop.ts</code>; without
      Content nothing reads that file.
    </p>
    <p class="text-sm opacity-70 leading-relaxed">
      <strong>One storefront, two places.</strong> The Shop page and <code class="bg-base-300 px-1 rounded text-xs">/shop</code>
      are the same code: <code class="bg-base-300 px-1 rounded text-xs">$lib/utils/storefront.ts</code> loads the products,
      works out sale prices and builds the URLs, and <code class="bg-base-300 px-1 rounded text-xs">$lib/components/commerce/ShopComponent.svelte</code>
      shows them. <code class="bg-base-300 px-1 rounded text-xs">/shop</code> (<code class="bg-base-300 px-1 rounded text-xs">routes/shop/[...rest]</code>)
      adds its own heading and breadcrumbs under <code class="bg-base-300 px-1 rounded text-xs">StorefrontNav</code>;
      a Shop page gets them from the public site. A change to the storefront shows in both.
    </p>
    <p class="text-sm opacity-70 leading-relaxed">
      A Shop page answers its own URLs. With the page at <code class="bg-base-300 px-1 rounded text-xs">/store</code>:
      <code class="bg-base-300 px-1 rounded text-xs">/store</code> lists every product (filter chips for the categories,
      <code class="bg-base-300 px-1 rounded text-xs">?tag=</code> for a tag, <code class="bg-base-300 px-1 rounded text-xs">?page=</code> past the first page),
      <code class="bg-base-300 px-1 rounded text-xs">/store/&lt;category&gt;</code> one category,
      <code class="bg-base-300 px-1 rounded text-xs">/store/&lt;category&gt;/&lt;product&gt;</code> a product, and
      <code class="bg-base-300 px-1 rounded text-xs">/store/&lt;product&gt;</code> a product that has no category. Each gets its own
      heading, breadcrumbs (parent categories included) and search tags; anything else under the page is a 404. A page
      added under the Shop item in the tree wins over a category with the same slug. Add to cart stays disabled until
      there's a checkout. Both read the public <code class="bg-base-300 px-1 rounded text-xs">/storefront</code> API, so
      they show what any visitor may see. Fixed-amount discounts are in dollars, as the product form enters them.
    </p>
    <p class="text-sm opacity-70 leading-relaxed">
      <strong>Using /shop for the page.</strong> While the standalone storefront is installed, Content keeps
      <code class="bg-base-300 px-1 rounded text-xs">shop</code> as a reserved slug. Where the Shop page replaces it,
      delete <code class="bg-base-300 px-1 rounded text-xs">routes/shop</code>, Commerce's
      <code class="bg-base-300 px-1 rounded text-xs">module-routes/commerce.ts</code> and
      <code class="bg-base-300 px-1 rounded text-xs">StorefrontNav</code> (only <code class="bg-base-300 px-1 rounded text-xs">/shop</code> uses them), then take
      <code class="bg-base-300 px-1 rounded text-xs">'shop'</code> out of <code class="bg-base-300 px-1 rounded text-xs">RESERVED_SLUGS</code> in the
      API's <code class="bg-base-300 px-1 rounded text-xs">routes/cms/nodes.ts</code> and in
      <code class="bg-base-300 px-1 rounded text-xs">$lib/server/cms/reserved.ts</code>.
    </p>
  </div>

  <!-- Data model -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Data Model</h2>
    <pre class="bg-base-300 rounded-box p-4 text-sm overflow-x-auto leading-relaxed"><code>categories   ← name, slug, parentId, order
products     ← name, slug, description, basePrice (cents), status, category (id), tags, images[], trackInventory
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
    <p class="text-sm opacity-70 leading-relaxed">
      <strong>Track inventory.</strong> A product keeps stock per variant unless its Track inventory switch is off
      (<code class="bg-base-300 px-1 rounded text-xs">trackInventory: false</code>), for donations, memberships and anything else that can't run out. Such a product is
      always in stock: the admin hides its stock and low-stock fields, the storefront never shows stock or "Out of stock",
      it stays out of the low-stock report and the stock analytics, and its stock can't be adjusted. Its variants still
      carry their own prices (donation amounts, say). Turning tracking back on brings back the stock figures it had.
      Products saved before the switch existed track inventory.
    </p>
    <p class="text-sm opacity-70 leading-relaxed">
      <strong>Description.</strong> A product's description is rich text from the base editor (bold, italic, underline,
      lists, quotes), stored as HTML, up to 20,000 characters. Descriptions saved as plain text before then open as
      paragraphs. Storefront pages never insert it as raw HTML: <code class="bg-base-300 px-1 rounded text-xs">$lib/utils/richText.ts</code> reads it into the
      editor's own elements, without attributes, and <code class="bg-base-300 px-1 rounded text-xs">RichTextView</code> renders them, so anything else in the
      string shows as text or is dropped.
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
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/commerce/products/:id/variants/:sku/stock</td><td class="text-sm">commerce_products.update</td><td class="text-sm opacity-70">Adjust a variant's stock. Body: adjustment (±integer). 409 for a product that doesn't track inventory.</td></tr>
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
