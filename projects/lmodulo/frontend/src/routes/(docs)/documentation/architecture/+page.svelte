<svelte:head>
  <title>Architecture — lmodulo Documentation</title>
</svelte:head>

<div class="space-y-10">

  <div class="space-y-3">
    <h1 class="text-3xl font-bold">Architecture</h1>
    <p class="text-base opacity-70 leading-relaxed">
      lmodulo is a monorepo with two separate applications — a SvelteKit frontend and a Fastify API — connected by Docker Compose. Each service runs in its own container and communicates over an internal Docker network.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Services</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead>
          <tr class="bg-base-200">
            <th>Service</th>
            <th>Port</th>
            <th>Technology</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="font-mono text-xs">web</td>
            <td>3000</td>
            <td>SvelteKit</td>
            <td class="text-sm opacity-70">Serves the UI, SSR, and proxy routes to the API</td>
          </tr>
          <tr>
            <td class="font-mono text-xs">api</td>
            <td>4000</td>
            <td>Fastify</td>
            <td class="text-sm opacity-70">Business logic, authentication, data access</td>
          </tr>
          <tr>
            <td class="font-mono text-xs">mongo</td>
            <td>27017</td>
            <td>MongoDB 7</td>
            <td class="text-sm opacity-70">Primary data store for all application data</td>
          </tr>
          <tr>
            <td class="font-mono text-xs">minio</td>
            <td>9000 / 9001</td>
            <td>MinIO</td>
            <td class="text-sm opacity-70">S3-compatible object storage for file uploads</td>
          </tr>
          <tr>
            <td class="font-mono text-xs">minio-init</td>
            <td>—</td>
            <td>mc (MinIO client)</td>
            <td class="text-sm opacity-70">One-shot container that creates the default bucket on first run</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Request Flow</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      The browser communicates only with the SvelteKit frontend (<code class="bg-base-300 px-1 rounded text-xs">:3000</code>). Server-side route handlers in SvelteKit forward authenticated requests to the Fastify API (<code class="bg-base-300 px-1 rounded text-xs">:4000</code>) by forwarding the session cookie. The API never exposes itself directly to the browser in production.
    </p>
    <pre class="bg-base-300 rounded-box p-4 text-sm overflow-x-auto leading-relaxed"><code>Browser
  │
  ├── GET /dashboard         → SvelteKit (+page.server.ts load)
  │                              → fetch http://api:4000/agile/milestones  (internal)
  │
  ├── POST /api/agile/jobs   → SvelteKit (+server.ts proxy route)
  │                              → fetch http://api:4000/agile/jobs  (forwards session cookie)
  │
  └── GET /uploads/logo.png  → SvelteKit → MinIO (proxied)</code></pre>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Directory Structure</h2>
    <pre class="bg-base-300 rounded-box p-4 text-sm overflow-x-auto leading-relaxed"><code>lmodulo/
├── frontend/                   SvelteKit application
│   └── src/
│       ├── routes/             Pages, layouts, and API proxy routes
│       │   ├── +layout.svelte  Authenticated app shell (sidebar + content)
│       │   ├── (public)/       Login, register, forgot-password pages
│       │   ├── api/            Server-side proxy routes → Fastify API
│       │   ├── agile/          Agile tracker pages
│       │   ├── messages/       Messaging pages
│       │   ├── calendar-events/ Calendar event pages
│       │   └── documentation/  This documentation site
│       └── lib/
│           ├── components/     Shared UI components
│           ├── config/         Nav, theme, logo config
│           ├── stores/         Svelte state stores
│           ├── utils/          Data types and helper functions
│           └── permissions.ts  Client-side permission checker
│
├── api/                        Fastify application
│   └── src/
│       ├── routes/             HTTP route handlers
│       │   ├── auth/           Authentication endpoints
│       │   ├── users/          User management
│       │   ├── roles/          Role management
│       │   ├── settings/       Application settings
│       │   ├── messages/       In-app messaging
│       │   ├── agile/          Agile module endpoints
│       │   └── calendar-events/ Calendar event endpoints
│       ├── plugins/            Fastify plugins (auth, MongoDB, seed)
│       └── lib/                Shared utility functions
│
├── docker-compose.yml          Production service definitions
└── docker-compose.dev.yml      Development overrides (bind mounts)</code></pre>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Data Layer</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      lmodulo uses MongoDB directly — there is no ORM or model layer. Route handlers in <code class="bg-base-300 px-1 rounded text-xs">api/src/routes/</code> query the database using the native MongoDB driver. Shared query logic lives in <code class="bg-base-300 px-1 rounded text-xs">api/src/lib/</code> as small helper functions imported by multiple route files.
    </p>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4 text-sm space-y-1">
      <p class="font-semibold">Collections</p>
      <p class="opacity-70 leading-relaxed">
        <code class="bg-base-300 px-1 rounded">users</code>, <code class="bg-base-300 px-1 rounded">roles</code>, <code class="bg-base-300 px-1 rounded">sessions</code>, <code class="bg-base-300 px-1 rounded">settings</code>, <code class="bg-base-300 px-1 rounded">messages</code>, <code class="bg-base-300 px-1 rounded">agile_milestones</code>, <code class="bg-base-300 px-1 rounded">agile_sprints</code>, <code class="bg-base-300 px-1 rounded">agile_jobs</code>, <code class="bg-base-300 px-1 rounded">agile_tasks</code>, <code class="bg-base-300 px-1 rounded">agile_comments</code>, <code class="bg-base-300 px-1 rounded">calendar_events</code>
      </p>
    </div>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">File Storage</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Uploads (avatars, brand logo, job and task attachments) go to MinIO by default. The storage provider is configurable via the <code class="bg-base-300 px-1 rounded text-xs">STORAGE_PROVIDER</code> environment variable. Set it to <code class="bg-base-300 px-1 rounded text-xs">local</code> to write files to disk instead — useful for development without MinIO.
    </p>
    <p class="text-sm opacity-70 leading-relaxed">
      Files are served back through the SvelteKit frontend at <code class="bg-base-300 px-1 rounded text-xs">/uploads/[...path]</code>, which proxies to the API's upload serving logic. This keeps MinIO off the public internet in production.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">AI Assistant</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      The chat assistant connects to an Ollama instance running on the host machine at <code class="bg-base-300 px-1 rounded text-xs">http://host.docker.internal:11434</code>. This address resolves to the Windows or macOS host from inside a Docker container. The frontend proxies chat messages through <code class="bg-base-300 px-1 rounded text-xs">/api/chat</code> — responses are streamed back using server-sent events.
    </p>
    <p class="text-sm opacity-70 leading-relaxed">
      If Ollama is not running or the model is not available, the chat panel degrades gracefully — it stays hidden until an admin enables it in Settings.
    </p>
  </div>

</div>
