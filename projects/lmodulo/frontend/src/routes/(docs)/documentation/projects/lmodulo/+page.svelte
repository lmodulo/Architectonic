<svelte:head>
  <title>lmodulo — Documentation</title>
</svelte:head>

<div class="space-y-10">

  <div class="space-y-3">
    <h1 class="text-3xl font-bold">lmodulo</h1>
    <p class="text-lg opacity-70 leading-relaxed max-w-2xl">
      A full-stack SvelteKit + Fastify application scaffold built for teams that move fast. lmodulo ships with agile project management, in-app messaging, calendar events, fine-grained role-based access control, and an AI assistant — all wired up and ready to extend.
    </p>
  </div>

  <!-- Feature grid -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-2">
      <p class="text-sm font-semibold">Agile Tracker</p>
      <p class="text-sm opacity-60 leading-relaxed">Milestones, sprints, jobs, and tasks in a clean hierarchy. Kanban board, Gantt timeline, burndown charts, and dependency tracking.</p>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-2">
      <p class="text-sm font-semibold">In-App Messaging</p>
      <p class="text-sm opacity-60 leading-relaxed">Email-style threaded messaging with rich-text composition, reply chains, archiving, and a live unread badge.</p>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-2">
      <p class="text-sm font-semibold">Roles & Permissions</p>
      <p class="text-sm opacity-60 leading-relaxed">Six built-in roles from Owner to Customer, each with granular CRUD permissions enforced on both the API and UI layers.</p>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-2">
      <p class="text-sm font-semibold">Calendar Events</p>
      <p class="text-sm opacity-60 leading-relaxed">Shared and personal events, time-off blocking, email reminder subscriptions, and a fully searchable event browser.</p>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-2">
      <p class="text-sm font-semibold">AI Assistant</p>
      <p class="text-sm opacity-60 leading-relaxed">An Ollama-powered chat panel available to all authenticated users. Connects to your local model server — no API keys required.</p>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-2">
      <p class="text-sm font-semibold">File Storage</p>
      <p class="text-sm opacity-60 leading-relaxed">Attachments on jobs and tasks, avatar uploads, and brand logo management — backed by MinIO (S3-compatible) or local disk.</p>
    </div>
  </div>

  <!-- Tech stack -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Tech Stack</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead>
          <tr class="bg-base-200">
            <th>Layer</th>
            <th>Technology</th>
            <th>Version</th>
          </tr>
        </thead>
        <tbody>
          <tr><td class="opacity-60">Frontend</td><td>SvelteKit + Svelte 5 runes</td><td>SvelteKit 2</td></tr>
          <tr><td class="opacity-60">UI</td><td>Tailwind CSS + DaisyUI + Skeleton v4</td><td>Tailwind v4</td></tr>
          <tr><td class="opacity-60">API</td><td>Fastify</td><td>v5</td></tr>
          <tr><td class="opacity-60">Database</td><td>MongoDB</td><td>v7</td></tr>
          <tr><td class="opacity-60">Storage</td><td>MinIO (S3-compatible)</td><td>Latest</td></tr>
          <tr><td class="opacity-60">Auth</td><td>Session cookies via @fastify/session</td><td>—</td></tr>
          <tr><td class="opacity-60">Language</td><td>TypeScript</td><td>5.x</td></tr>
          <tr><td class="opacity-60">Runtime</td><td>Docker + Docker Compose</td><td>—</td></tr>
          <tr><td class="opacity-60">AI</td><td>Ollama (local LLM)</td><td>—</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Quick links -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Where to Start</h2>
    <ul class="space-y-2 text-sm">
      <li><a href="/documentation/projects/lmodulo/getting-started" class="link link-primary">Getting Started</a> — spin up the full stack in under five minutes with Docker Compose.</li>
      <li><a href="/documentation/projects/lmodulo/architecture" class="link link-primary">Architecture</a> — understand how the frontend, API, database, and storage services connect.</li>
      <li><a href="/documentation/projects/lmodulo/rbac" class="link link-primary">Roles & Permissions</a> — learn how the six built-in roles map to resources and actions.</li>
      <li><a href="/documentation/projects/lmodulo/api" class="link link-primary">API Reference</a> — explore every endpoint with its expected inputs, outputs, and auth requirements.</li>
      <li><a href="/documentation/projects/lmodulo/agile" class="link link-primary">Agile Module</a> — deep-dive into milestones, sprints, jobs, and tasks.</li>
    </ul>
  </div>

</div>
