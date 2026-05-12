<svelte:head>
  <title>Folio — lmodulo Documentation</title>
</svelte:head>

<div class="space-y-10">

  <div class="space-y-3">
    <h1 class="text-3xl font-bold">Folio</h1>
    <p class="text-base opacity-70 leading-relaxed">
      Folio is lmodulo's finance module. Staff create and manage invoices, convert CRM contacts into billing clients, and collect payment online via Stripe. Customers access their invoices and pay through a dedicated client portal. The module lives at <code class="bg-base-300 px-1 rounded text-xs">/folio</code> for staff and <code class="bg-base-300 px-1 rounded text-xs">/client-portal</code> + <code class="bg-base-300 px-1 rounded text-xs">/payments</code> for customers.
    </p>
  </div>

  <!-- Data Model -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Data Model</h2>
    <pre class="bg-base-300 rounded-box p-4 text-sm overflow-x-auto leading-relaxed"><code>finance_invoices   ← one invoice per client per billing cycle
  └── lineItems[]  ← embedded array of line items

finance_payments   ← one record per Stripe PaymentIntent attempt
  └── invoiceId    ← references finance_invoices</code></pre>
    <p class="text-sm opacity-70 leading-relaxed">
      Line items are embedded in the invoice document — not a separate collection. A payment record is inserted when a PaymentIntent is initiated and updated to <code class="bg-base-300 px-1 rounded text-xs">succeeded</code> or <code class="bg-base-300 px-1 rounded text-xs">failed</code> by the Stripe webhook.
    </p>
  </div>

  <!-- Invoice Lifecycle -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Invoice Lifecycle</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Status</th><th>Meaning</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">draft</td><td class="text-sm opacity-70">Created but not yet sent — invisible to the customer</td></tr>
          <tr><td class="font-mono text-xs">sent</td><td class="text-sm opacity-70">Staff clicked "Send to client" — customer can now see and pay it</td></tr>
          <tr><td class="font-mono text-xs">paid</td><td class="text-sm opacity-70">Stripe webhook confirmed <code class="bg-base-300 px-1 rounded text-xs">payment_intent.succeeded</code></td></tr>
          <tr><td class="font-mono text-xs">overdue</td><td class="text-sm opacity-70">Past <code class="bg-base-300 px-1 rounded text-xs">dueDate</code> and still unpaid</td></tr>
        </tbody>
      </table>
    </div>
    <p class="text-sm opacity-70 leading-relaxed">
      Invoice numbers are auto-assigned on create in <code class="bg-base-300 px-1 rounded text-xs">INV-0001</code>, <code class="bg-base-300 px-1 rounded text-xs">INV-0002</code>, … format — not shown in the create form. Moving from <code class="bg-base-300 px-1 rounded text-xs">sent</code> to <code class="bg-base-300 px-1 rounded text-xs">paid</code> is webhook-driven only; the API does not accept a manual <code class="bg-base-300 px-1 rounded text-xs">paid</code> status from the client.
    </p>

    <h3 class="text-base font-semibold mt-2">finance_invoices</h3>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Field</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">invoiceNumber</td><td class="text-xs opacity-60">string (auto)</td><td class="text-sm opacity-70"><code class="bg-base-300 px-1 rounded text-xs">INV-0001</code> format, assigned on create</td></tr>
          <tr><td class="font-mono text-xs">customerId</td><td class="text-xs opacity-60">ObjectId ref</td><td class="text-sm opacity-70">The billing customer (user with role <code class="bg-base-300 px-1 rounded text-xs">customer</code>)</td></tr>
          <tr><td class="font-mono text-xs">companyId</td><td class="text-xs opacity-60">ObjectId ref</td><td class="text-sm opacity-70">The company being invoiced (from <code class="bg-base-300 px-1 rounded text-xs">crm_companies</code>)</td></tr>
          <tr><td class="font-mono text-xs">lineItems</td><td class="text-xs opacity-60">&#123;description, quantity, unitPrice, amount&#125;[]</td><td class="text-sm opacity-70">Embedded array, min 1 item; <code class="bg-base-300 px-1 rounded text-xs">amount = quantity × unitPrice</code></td></tr>
          <tr><td class="font-mono text-xs">subtotal</td><td class="text-xs opacity-60">number</td><td class="text-sm opacity-70">Sum of all <code class="bg-base-300 px-1 rounded text-xs">lineItems[].amount</code></td></tr>
          <tr><td class="font-mono text-xs">taxRate</td><td class="text-xs opacity-60">number</td><td class="text-sm opacity-70">Percentage, e.g. <code class="bg-base-300 px-1 rounded text-xs">8.5</code></td></tr>
          <tr><td class="font-mono text-xs">taxAmount</td><td class="text-xs opacity-60">number</td><td class="text-sm opacity-70"><code class="bg-base-300 px-1 rounded text-xs">subtotal × taxRate / 100</code></td></tr>
          <tr><td class="font-mono text-xs">total</td><td class="text-xs opacity-60">number</td><td class="text-sm opacity-70"><code class="bg-base-300 px-1 rounded text-xs">subtotal + taxAmount</code></td></tr>
          <tr><td class="font-mono text-xs">currency</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">ISO 4217, e.g. <code class="bg-base-300 px-1 rounded text-xs">USD</code></td></tr>
          <tr><td class="font-mono text-xs">status</td><td class="text-xs opacity-60">draft | sent | paid | overdue</td><td class="text-sm opacity-70">Invoice lifecycle state</td></tr>
          <tr><td class="font-mono text-xs">dueDate</td><td class="text-xs opacity-60">date</td><td class="text-sm opacity-70">Payment deadline</td></tr>
          <tr><td class="font-mono text-xs">notes</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Optional memo visible on the invoice</td></tr>
          <tr><td class="font-mono text-xs">stripePaymentIntentId</td><td class="text-xs opacity-60">string?</td><td class="text-sm opacity-70">Set when a PaymentIntent is created</td></tr>
          <tr><td class="font-mono text-xs">paidAt</td><td class="text-xs opacity-60">date?</td><td class="text-sm opacity-70">Set by webhook on <code class="bg-base-300 px-1 rounded text-xs">payment_intent.succeeded</code></td></tr>
          <tr><td class="font-mono text-xs">createdBy</td><td class="text-xs opacity-60">userId</td><td class="text-sm opacity-70">Staff member who created the invoice</td></tr>
        </tbody>
      </table>
    </div>

    <h3 class="text-base font-semibold mt-2">finance_payments</h3>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Field</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">invoiceId</td><td class="text-xs opacity-60">ObjectId ref</td><td class="text-sm opacity-70">The invoice being paid</td></tr>
          <tr><td class="font-mono text-xs">customerId</td><td class="text-xs opacity-60">ObjectId ref</td><td class="text-sm opacity-70">The paying customer</td></tr>
          <tr><td class="font-mono text-xs">stripePaymentIntentId</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Stripe PaymentIntent id</td></tr>
          <tr><td class="font-mono text-xs">stripeChargeId</td><td class="text-xs opacity-60">string?</td><td class="text-sm opacity-70">Set after payment captures</td></tr>
          <tr><td class="font-mono text-xs">amount</td><td class="text-xs opacity-60">number</td><td class="text-sm opacity-70">Invoice total (in major currency units, not cents)</td></tr>
          <tr><td class="font-mono text-xs">currency</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">ISO 4217</td></tr>
          <tr><td class="font-mono text-xs">status</td><td class="text-xs opacity-60">pending | succeeded | failed</td><td class="text-sm opacity-70">Updated by Stripe webhook</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Staff Views -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Staff Views</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Staff with <code class="bg-base-300 px-1 rounded text-xs">finance_invoices:read</code> permission (owner, admin, lead, contributor, viewer) can access the Folio module. Create and update operations require the corresponding <code class="bg-base-300 px-1 rounded text-xs">finance_invoices:create</code> / <code class="bg-base-300 px-1 rounded text-xs">update</code> / <code class="bg-base-300 px-1 rounded text-xs">delete</code> permissions.
    </p>
    <div class="space-y-3">
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">Dashboard <code class="bg-base-300 px-1 rounded text-xs">/folio</code></p>
        <p class="text-sm opacity-60 leading-relaxed">Summary cards (total clients, total paid, outstanding balance, overdue count) followed by a client table. Each row shows the customer name, company, invoice counts, and aggregated totals at a glance.</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">All Invoices <code class="bg-base-300 px-1 rounded text-xs">/folio/invoices</code></p>
        <p class="text-sm opacity-60 leading-relaxed">Paginated table of every invoice across all clients. Status filter tabs (All / Draft / Sent / Paid / Overdue). Each row links to the invoice detail page.</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">Create Invoice <code class="bg-base-300 px-1 rounded text-xs">/folio/invoices/new</code></p>
        <p class="text-sm opacity-60 leading-relaxed">Customer selector (populated from <code class="bg-base-300 px-1 rounded text-xs">GET /finance/customers</code>), due date, currency, tax rate, and notes. Dynamic line items builder — add/remove rows; quantity × unit price computes the row amount and running subtotal live. Invoice number is assigned server-side on <code class="bg-base-300 px-1 rounded text-xs">POST</code> and is never shown in the form.</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">Invoice Detail <code class="bg-base-300 px-1 rounded text-xs">/folio/invoices/[id]</code></p>
        <p class="text-sm opacity-60 leading-relaxed">Full invoice view with line items table, tax breakdown, and totals. Editable fields (status, due date, notes) inline when status is not <code class="bg-base-300 px-1 rounded text-xs">paid</code>. "Send to client" button PATCHes status to <code class="bg-base-300 px-1 rounded text-xs">sent</code>, making the invoice visible to the customer in their Payments page.</p>
      </div>
    </div>
  </div>

  <!-- Client Portal & Payments -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Client Portal &amp; Payments</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Users with the <code class="bg-base-300 px-1 rounded text-xs">customer</code> role land on the client portal after login and see only these two routes.
    </p>
    <div class="space-y-3">
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">Client Portal <code class="bg-base-300 px-1 rounded text-xs">/client-portal</code></p>
        <p class="text-sm opacity-60 leading-relaxed">Compose new messages to all staff owners and admins using the same rich-text editor as the Messaging module. Below the compose panel, a scrollable thread list shows all in-app message threads the customer is a participant in. Clicking a thread opens it at <code class="bg-base-300 px-1 rounded text-xs">/messages/[threadId]</code>.</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">Payments <code class="bg-base-300 px-1 rounded text-xs">/payments</code></p>
        <p class="text-sm opacity-60 leading-relaxed">Two tabs. <strong>Invoices</strong> lists all invoices scoped to the logged-in customer — <code class="bg-base-300 px-1 rounded text-xs">sent</code> and <code class="bg-base-300 px-1 rounded text-xs">overdue</code> invoices show a Pay button; <code class="bg-base-300 px-1 rounded text-xs">paid</code> invoices are shown with a success badge. <strong>Pay</strong> mounts Stripe Elements for the selected invoice: calls <code class="bg-base-300 px-1 rounded text-xs">POST /finance/invoices/:id/pay</code> to get a <code class="bg-base-300 px-1 rounded text-xs">clientSecret</code>, then uses <code class="bg-base-300 px-1 rounded text-xs">stripe.confirmCardPayment</code>. On success the page reloads and the invoice status updates to <code class="bg-base-300 px-1 rounded text-xs">paid</code> via the webhook.</p>
      </div>
    </div>
  </div>

  <!-- CRM Integration -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">CRM Integration</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Any CRM contact with a valid <code class="bg-base-300 px-1 rounded text-xs">email</code> and a linked <code class="bg-base-300 px-1 rounded text-xs">companyId</code> is eligible to become a billing client. On the contact detail page, staff with <code class="bg-base-300 px-1 rounded text-xs">crm_contacts:update</code> permission see a <strong>Convert to Client</strong> button. The endpoint <code class="bg-base-300 px-1 rounded text-xs">POST /crm/contacts/:id/convert-to-client</code> performs three steps:
    </p>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-2 text-sm">
      <div class="flex gap-3">
        <span class="badge badge-primary badge-sm shrink-0 mt-0.5">1</span>
        <p class="opacity-70">Creates a new user account with <code class="bg-base-300 px-1 rounded text-xs">role: 'customer'</code>, linked to the contact's <code class="bg-base-300 px-1 rounded text-xs">companyId</code>. A 32-byte random token is generated and stored as a SHA-256 hash with a 48-hour expiry.</p>
      </div>
      <div class="flex gap-3">
        <span class="badge badge-primary badge-sm shrink-0 mt-0.5">2</span>
        <p class="opacity-70">Sends a password-set email to the contact. The link points to <code class="bg-base-300 px-1 rounded text-xs">/set-password?token=...</code> and expires in 48 hours. In development, the Ethereal preview URL is logged to the API console.</p>
      </div>
      <div class="flex gap-3">
        <span class="badge badge-primary badge-sm shrink-0 mt-0.5">3</span>
        <p class="opacity-70">Sends an in-app welcome message from the first owner/admin user to the new customer via the Messaging module, introducing the client portal features.</p>
      </div>
    </div>
    <p class="text-sm opacity-70 leading-relaxed">
      The <code class="bg-base-300 px-1 rounded text-xs">POST /auth/set-password</code> endpoint (public, no auth) accepts the raw token + new password, verifies the hash, bcrypt-hashes the new password, and clears the token fields. The customer can then log in normally.
    </p>
  </div>

  <!-- Stripe & Environment -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Stripe &amp; Environment</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Variable</th><th>Service</th><th>Purpose</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">STRIPE_SECRET_KEY</td><td class="text-xs opacity-60">API</td><td class="text-sm opacity-70">Server-side Stripe SDK authentication (<code class="bg-base-300 px-1 rounded text-xs">sk_test_...</code> in development)</td></tr>
          <tr><td class="font-mono text-xs">STRIPE_WEBHOOK_SECRET</td><td class="text-xs opacity-60">API</td><td class="text-sm opacity-70">Verifies the <code class="bg-base-300 px-1 rounded text-xs">Stripe-Signature</code> header on incoming webhook events</td></tr>
          <tr><td class="font-mono text-xs">PUBLIC_STRIPE_PUBLISHABLE_KEY</td><td class="text-xs opacity-60">Frontend</td><td class="text-sm opacity-70">Initialises Stripe.js / Stripe Elements in the browser (<code class="bg-base-300 px-1 rounded text-xs">pk_test_...</code> in development)</td></tr>
        </tbody>
      </table>
    </div>
    <p class="text-sm opacity-70 leading-relaxed">
      The webhook endpoint <code class="bg-base-300 px-1 rounded text-xs">POST /finance/stripe/webhook</code> receives a raw (unparsed) body so the HMAC signature can be verified. It handles <code class="bg-base-300 px-1 rounded text-xs">payment_intent.succeeded</code> — sets invoice <code class="bg-base-300 px-1 rounded text-xs">status: 'paid'</code> and <code class="bg-base-300 px-1 rounded text-xs">paidAt</code>, and inserts a <code class="bg-base-300 px-1 rounded text-xs">finance_payments</code> record with <code class="bg-base-300 px-1 rounded text-xs">status: 'succeeded'</code>. Other event types are acknowledged with a 200 and ignored.
    </p>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4 text-sm space-y-1">
      <p class="font-semibold">Testing without Stripe</p>
      <p class="opacity-60 leading-relaxed">If <code class="bg-base-300 px-1 rounded text-xs">STRIPE_SECRET_KEY</code> is not set, the <code class="bg-base-300 px-1 rounded text-xs">POST /finance/invoices/:id/pay</code> endpoint returns <code class="bg-base-300 px-1 rounded text-xs">503 Service Unavailable</code>. Set it to any Stripe test key (<code class="bg-base-300 px-1 rounded text-xs">sk_test_...</code>) to enable the payment flow. Use test card <code class="bg-base-300 px-1 rounded text-xs">4242 4242 4242 4242</code> with any future expiry and any CVC.</p>
    </div>
  </div>

  <!-- API Reference -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">API Reference</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Endpoint</th><th>Permission</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/finance/invoices</td><td class="text-xs opacity-60">requireAuth</td><td class="text-sm opacity-70">List invoices; customers auto-scoped to own; <code class="bg-base-300 px-1 rounded text-xs">status</code>, <code class="bg-base-300 px-1 rounded text-xs">limit</code>, <code class="bg-base-300 px-1 rounded text-xs">skip</code> filters</td></tr>
          <tr><td class="font-mono text-xs">POST</td><td class="font-mono text-xs">/finance/invoices</td><td class="text-xs opacity-60">finance_invoices:create</td><td class="text-sm opacity-70">Create invoice; <code class="bg-base-300 px-1 rounded text-xs">invoiceNumber</code> assigned server-side</td></tr>
          <tr><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/finance/invoices/:id</td><td class="text-xs opacity-60">requireAuth</td><td class="text-sm opacity-70">Single invoice; scope-checked for customers</td></tr>
          <tr><td class="font-mono text-xs">PATCH</td><td class="font-mono text-xs">/finance/invoices/:id</td><td class="text-xs opacity-60">finance_invoices:update</td><td class="text-sm opacity-70">Partial update; send <code class="bg-base-300 px-1 rounded text-xs">&#123;"status":"sent"&#125;</code> to send to client</td></tr>
          <tr><td class="font-mono text-xs">DELETE</td><td class="font-mono text-xs">/finance/invoices/:id</td><td class="text-xs opacity-60">finance_invoices:delete</td><td class="text-sm opacity-70">Delete invoice</td></tr>
          <tr class="border-t border-base-300"><td class="font-mono text-xs">POST</td><td class="font-mono text-xs">/finance/invoices/:id/pay</td><td class="text-xs opacity-60">requireAuth</td><td class="text-sm opacity-70">Creates Stripe PaymentIntent; returns <code class="bg-base-300 px-1 rounded text-xs">&#123;"clientSecret":"..."&#125;</code></td></tr>
          <tr><td class="font-mono text-xs">POST</td><td class="font-mono text-xs">/finance/stripe/webhook</td><td class="text-xs opacity-60">Stripe-Signature</td><td class="text-sm opacity-70">Raw body; verifies signature; updates invoice + inserts payment record on success</td></tr>
          <tr class="border-t border-base-300"><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/finance/customers</td><td class="text-xs opacity-60">users:read</td><td class="text-sm opacity-70">List users with <code class="bg-base-300 px-1 rounded text-xs">role: 'customer'</code> with company name joined; used to populate the invoice customer selector</td></tr>
          <tr class="border-t border-base-300"><td class="font-mono text-xs">POST</td><td class="font-mono text-xs">/crm/contacts/:id/convert-to-client</td><td class="text-xs opacity-60">crm_contacts:update</td><td class="text-sm opacity-70">Converts CRM contact to customer user; sends password-set email + welcome message; returns <code class="bg-base-300 px-1 rounded text-xs">&#123;"userId":"..."&#125;</code></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Permissions -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Permissions</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Role</th><th>finance_invoices</th><th>finance_payments</th><th>client_portal</th></tr></thead>
        <tbody>
          <tr><td>owner / admin</td><td class="text-xs opacity-70">CRUD</td><td class="text-xs opacity-70">CRUD</td><td class="text-xs opacity-70">CRUD</td></tr>
          <tr><td>lead</td><td class="text-xs opacity-70">R</td><td class="text-xs opacity-70">R</td><td class="text-xs opacity-70">—</td></tr>
          <tr><td>contributor</td><td class="text-xs opacity-70">R</td><td class="text-xs opacity-70">R</td><td class="text-xs opacity-70">—</td></tr>
          <tr><td>viewer</td><td class="text-xs opacity-70">R</td><td class="text-xs opacity-70">R</td><td class="text-xs opacity-70">—</td></tr>
          <tr><td>customer</td><td class="text-xs opacity-70">R</td><td class="text-xs opacity-70">CR</td><td class="text-xs opacity-70">CR</td></tr>
        </tbody>
      </table>
    </div>
    <p class="text-sm opacity-70 leading-relaxed">
      Customers can read their own invoices and initiate payments (create payment records), but cannot create, update, or delete invoices. The <code class="bg-base-300 px-1 rounded text-xs">client_portal</code> resource governs access to the <code class="bg-base-300 px-1 rounded text-xs">/client-portal</code> messaging view and the <code class="bg-base-300 px-1 rounded text-xs">/payments</code> page — staff roles do not need it. Route guards in <code class="bg-base-300 px-1 rounded text-xs">hooks.server.ts</code> enforce that customers can only reach their allowed paths and are redirected to <code class="bg-base-300 px-1 rounded text-xs">/client-portal</code> for all other routes.
    </p>
  </div>

</div>
