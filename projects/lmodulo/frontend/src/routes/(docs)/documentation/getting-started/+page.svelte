<svelte:head>
  <title>Getting Started — lmodulo Documentation</title>
</svelte:head>

<div class="space-y-10">

  <div class="space-y-3">
    <h1 class="text-3xl font-bold">Getting Started</h1>
    <p class="text-base opacity-70 leading-relaxed">
      lmodulo runs entirely inside Docker. You don't need Node.js, MongoDB, or MinIO installed locally — Docker Compose handles everything.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Prerequisites</h2>
    <ul class="space-y-2 text-sm leading-relaxed list-disc list-inside opacity-80">
      <li><strong>Docker Desktop</strong> — version 4.x or later. On Windows, use WSL 2 backend.</li>
      <li><strong>Git</strong> — to clone the repository.</li>
      <li><strong>Ollama</strong> (optional) — install on the host machine for AI assistant support. The app connects to it at <code class="bg-base-300 px-1 rounded text-xs">http://host.docker.internal:11434</code>.</li>
    </ul>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">1. Clone the Repository</h2>
    <pre class="bg-base-300 rounded-box p-4 text-sm overflow-x-auto leading-relaxed"><code>git clone &lt;repo-url&gt; lmodulo
cd lmodulo</code></pre>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">2. Configure Environment Variables</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Copy the example environment file and fill in your values. The only required change for local development is <code class="bg-base-300 px-1 rounded text-xs">SESSION_SECRET</code>.
    </p>
    <pre class="bg-base-300 rounded-box p-4 text-sm overflow-x-auto leading-relaxed"><code>cp .env.example .env</code></pre>

    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead>
          <tr class="bg-base-200">
            <th>Variable</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr><td class="font-mono text-xs">SESSION_SECRET</td><td class="opacity-50">—</td><td class="text-sm">Required. A long random string used to sign session cookies.</td></tr>
          <tr><td class="font-mono text-xs">MONGO_DB</td><td class="opacity-50">appdb</td><td class="text-sm">MongoDB database name.</td></tr>
          <tr><td class="font-mono text-xs">APP_NAME</td><td class="opacity-50">Application</td><td class="text-sm">Shown in the browser tab title.</td></tr>
          <tr><td class="font-mono text-xs">APP_URL</td><td class="opacity-50">http://localhost:3000</td><td class="text-sm">Public URL — used to build links in emails.</td></tr>
          <tr><td class="font-mono text-xs">SMTP_HOST</td><td class="opacity-50">—</td><td class="text-sm">SMTP server for email (password resets, reminders).</td></tr>
          <tr><td class="font-mono text-xs">SMTP_USER</td><td class="opacity-50">—</td><td class="text-sm">SMTP username / sender address.</td></tr>
          <tr><td class="font-mono text-xs">SMTP_PASS</td><td class="opacity-50">—</td><td class="text-sm">SMTP password.</td></tr>
          <tr><td class="font-mono text-xs">STORAGE_PROVIDER</td><td class="opacity-50">s3</td><td class="text-sm">Set to <code class="bg-base-300 px-1 rounded">local</code> to store uploads on disk instead of MinIO.</td></tr>
          <tr><td class="font-mono text-xs">OLLAMA_URL</td><td class="opacity-50">http://host.docker.internal:11434</td><td class="text-sm">URL of your local Ollama instance.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">3. Start the Stack</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      The development configuration adds bind mounts so the frontend recompiles on file changes. The API does not hot-reload on Windows — you need to rebuild it after any server-side code changes.
    </p>
    <pre class="bg-base-300 rounded-box p-4 text-sm overflow-x-auto leading-relaxed"><code># Start all services in development mode
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Or start in the background
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d</code></pre>

    <div class="card bg-base-200 border border-base-300 rounded-box p-4 text-sm space-y-1">
      <p class="font-semibold text-warning">Windows Note</p>
      <p class="opacity-70 leading-relaxed">Bind mounts on Windows do not propagate filesystem events reliably. Frontend changes may not trigger a hot reload — run <code class="bg-base-300 px-1 rounded">docker compose ... build web</code> after editing <code>.svelte</code> files.</p>
    </div>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">4. Access the App</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead>
          <tr class="bg-base-200">
            <th>Service</th>
            <th>URL</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Frontend (SvelteKit)</td><td class="font-mono text-xs">http://localhost:3000</td></tr>
          <tr><td>API (Fastify)</td><td class="font-mono text-xs">http://localhost:4000</td></tr>
          <tr><td>MongoDB</td><td class="font-mono text-xs">mongodb://localhost:27017</td></tr>
          <tr><td>MinIO Console</td><td class="font-mono text-xs">http://localhost:9001</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">5. Default Credentials</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      The database is seeded on first run with demo users spanning all roles. Use any of these to log in:
    </p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead>
          <tr class="bg-base-200">
            <th>Username</th>
            <th>Email</th>
            <th>Password</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          <tr><td class="font-mono text-xs">jnicora</td><td class="font-mono text-xs">joenicora@me.com</td><td class="font-mono text-xs">password123</td><td><span class="badge badge-sm badge-error">owner</span></td></tr>
          <tr><td class="font-mono text-xs">knicora</td><td class="font-mono text-xs">kylenicora@me.com</td><td class="font-mono text-xs">password123</td><td><span class="badge badge-sm badge-warning">admin</span></td></tr>
          <tr><td class="font-mono text-xs">alex</td><td class="font-mono text-xs">alex@example.com</td><td class="font-mono text-xs">password123</td><td><span class="badge badge-sm badge-info">lead</span></td></tr>
          <tr><td class="font-mono text-xs">jordan</td><td class="font-mono text-xs">jordan@example.com</td><td class="font-mono text-xs">password123</td><td><span class="badge badge-sm badge-success">contributor</span></td></tr>
          <tr><td class="font-mono text-xs">sam</td><td class="font-mono text-xs">sam@example.com</td><td class="font-mono text-xs">password123</td><td><span class="badge badge-sm badge-ghost">viewer</span></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Rebuilding After Code Changes</h2>
    <pre class="bg-base-300 rounded-box p-4 text-sm overflow-x-auto leading-relaxed"><code># Rebuild and restart the frontend
docker compose -f docker-compose.yml -f docker-compose.dev.yml build web
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d web

# Rebuild and restart the API
docker compose -f docker-compose.yml -f docker-compose.dev.yml build api
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d api</code></pre>
  </div>

</div>
