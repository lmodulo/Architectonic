<script lang="ts">
  import { Rocket, Layers, ShieldCheck, Code2, ListTodo, Receipt, FileSignature, ArrowRight } from 'lucide-svelte';

  const quickLinks = [
    { href: '/documentation/getting-started', icon: Rocket,        label: 'Getting Started',    desc: 'Spin up the full stack in under five minutes with Docker Compose.' },
    { href: '/documentation/architecture',    icon: Layers,        label: 'Architecture',        desc: 'Understand how the frontend, API, database, and storage services connect.' },
    { href: '/documentation/rbac',            icon: ShieldCheck,   label: 'Roles & Permissions', desc: 'Learn how the six built-in roles map to resources and actions.' },
    { href: '/documentation/api',             icon: Code2,         label: 'API Reference',       desc: 'Explore every endpoint with its expected inputs, outputs, and auth requirements.' },
    { href: '/documentation/agile',           icon: ListTodo,      label: 'Agile Module',        desc: 'Deep-dive into milestones, sprints, jobs, and tasks.' },
    { href: '/documentation/folio',           icon: Receipt,       label: 'Folio',               desc: 'Manage invoices, collect Stripe payments, and onboard CRM contacts as billing clients.' },
    { href: '/documentation/contracts',       icon: FileSignature, label: 'Contracts',           desc: 'Create MSA/SOW/NDA contracts, send for e-signature, and track execution.' },
  ];
</script>

<svelte:head>
  <title>lmodulo — Documentation</title>
</svelte:head>

<div class="space-y-10">

  <div class="space-y-3">
    <h1 class="text-3xl font-bold">A full-stack SvelteKit + Fastify application scaffold built for teams that move fast.</h1>
    <p class="text-lg opacity-70 leading-relaxed max-w-2xl">
      Architectonic ships with agile project management, in-app messaging, calendar events, fine-grained role-based access control, and an AI assistant — all wired up and ready to extend.
    </p>
  </div>

  <!-- Feature grid -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-2">
      <p class="text-sm font-semibold">Agile</p>
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
      <p class="text-sm font-semibold">Folio</p>
      <p class="text-sm opacity-60 leading-relaxed">Invoice management and client billing. Staff create and send invoices with dynamic line items; customers pay online via Stripe. Includes a client portal and CRM-linked client conversion flow.</p>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-2">
      <p class="text-sm font-semibold">Contracts</p>
      <p class="text-sm opacity-60 leading-relaxed">Native e-signatures and contract management. MSA, SOW, and NDA templates with IP ownership, maintenance, and late-payment clauses built in. Token-based signing links with canvas signature capture — no third-party service required.</p>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-2">
      <p class="text-sm font-semibold">AI Assistant</p>
      <p class="text-sm opacity-60 leading-relaxed">An Ollama-powered chat panel available to all authenticated users. Connects to your local model server — no API keys required.</p>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-2">
      <p class="text-sm font-semibold">File Storage</p>
      <p class="text-sm opacity-60 leading-relaxed">Attachments on jobs and tasks, avatar uploads, and brand logo management — backed by MinIO (S3-compatible) or local disk.</p>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-2">
      <p class="text-sm font-semibold">Automation</p>
      <p class="text-sm opacity-60 leading-relaxed">Event-driven rules that connect modules. Define trigger → condition → action workflows — send notifications, create messages, or schedule calendar events when platform events occur.</p>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-2">
      <p class="text-sm font-semibold">Dashboard</p>
      <p class="text-sm opacity-60 leading-relaxed">Customizable multi-module dashboard with sections for Agile, Nexus CRM, Folio, Contracts, and Calendar. Drag to reorder sections, show or hide individual panels, and filter by date range. Layout persists per user.</p>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-2">
      <p class="text-sm font-semibold">Nexus CRM</p>
      <p class="text-sm opacity-60 leading-relaxed">Lightweight CRM covering the prospect-to-customer lifecycle. Companies, contacts, and deals in a pipeline kanban with drag-to-stage. Health scoring, activity feed, per-client hours rollup, and SVG-based reports.</p>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-5 space-y-2">
      <p class="text-sm font-semibold">Vault</p>
      <p class="text-sm opacity-60 leading-relaxed">Document library for SOPs, policies, handbooks, and certificates. Nested folders, three visibility tiers (staff / admin-only / customer), full version history with rollback, and inline preview for images and PDFs.</p>
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
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {#each quickLinks as link}
        {@const Icon = link.icon}
        <a
          href={link.href}
          class="group flex items-start gap-4 p-4 rounded-box bg-base-200 border border-base-300 hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <div class="shrink-0 size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mt-0.5">
            <Icon class="size-4" />
          </div>
          <div class="flex-1 min-w-0 space-y-0.5">
            <p class="text-sm font-semibold group-hover:text-primary transition-colors">{link.label}</p>
            <p class="text-xs opacity-60 leading-relaxed">{link.desc}</p>
          </div>
          <ArrowRight class="size-4 shrink-0 opacity-30 group-hover:opacity-70 group-hover:translate-x-0.5 transition-all mt-1" />
        </a>
      {/each}
    </div>
  </div>

</div>
