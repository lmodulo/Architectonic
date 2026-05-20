<svelte:head>
  <title>Roles & Permissions — lmodulo Documentation</title>
</svelte:head>

<div class="space-y-10">

  <div class="space-y-3">
    <h1 class="text-3xl font-bold">Roles & Permissions</h1>
    <p class="text-base opacity-70 leading-relaxed">
      Access control in lmodulo is role-based and workspace-scoped. Every user has a role <em>per workspace</em>, and every role carries a set of permissions that define which resources the user can create, read, update, or delete. The same user can hold different roles in different workspaces. Permissions are enforced on both the API and the frontend.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Built-in Roles</h2>
    <p class="text-sm opacity-70 leading-relaxed">Six roles are seeded on first run. They can be edited by an admin, and new roles can be created from the Roles management page.</p>

    <div class="space-y-3">
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <div class="flex items-center gap-2"><span class="badge badge-error badge-sm">owner</span><span class="text-sm font-semibold">Owner</span></div>
        <p class="text-sm opacity-60 leading-relaxed">Unrestricted access to every resource in the system. Intended for the founding account or platform administrator.</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <div class="flex items-center gap-2"><span class="badge badge-warning badge-sm">admin</span><span class="text-sm font-semibold">Admin</span></div>
        <p class="text-sm opacity-60 leading-relaxed">Full access within the workspace. Can manage users, roles, settings, and all content. Cannot delete workspaces (owner-only).</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <div class="flex items-center gap-2"><span class="badge badge-info badge-sm">lead</span><span class="text-sm font-semibold">Lead</span></div>
        <p class="text-sm opacity-60 leading-relaxed">Can create, read, and update agile resources (milestones, sprints, jobs, tasks, comments) and calendar events. Cannot manage users or system settings.</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <div class="flex items-center gap-2"><span class="badge badge-success badge-sm">contributor</span><span class="text-sm font-semibold">Contributor</span></div>
        <p class="text-sm opacity-60 leading-relaxed">Read access to agile resources. Can create and update tasks and comments. Cannot create milestones, sprints, or jobs.</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <div class="flex items-center gap-2"><span class="badge badge-ghost badge-sm">viewer</span><span class="text-sm font-semibold">Viewer</span></div>
        <p class="text-sm opacity-60 leading-relaxed">Read-only access to agile content and calendar events. Can send and receive messages. No write access to any content.</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <div class="flex items-center gap-2"><span class="badge badge-neutral badge-sm">customer</span><span class="text-sm font-semibold">Customer</span></div>
        <p class="text-sm opacity-60 leading-relaxed">External user role. Has no access to agile, messaging, or admin features. Restricted to a minimal set of public-facing paths. New self-registered users default to this role. The workspace switcher is not shown to customers.</p>
      </div>
    </div>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Permission Matrix</h2>
    <p class="text-sm opacity-70 leading-relaxed">Permissions are defined as resource + action pairs. Each role holds a list of permitted combinations.</p>
    <div class="overflow-x-auto">
      <table class="table table-xs w-full">
        <thead>
          <tr class="bg-base-200">
            <th>Resource</th>
            <th>Owner</th>
            <th>Admin</th>
            <th>Lead</th>
            <th>Contributor</th>
            <th>Viewer</th>
            <th>Customer</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="font-semibold opacity-60">users</td>
            <td>CRUD</td><td>CRUD</td><td>—</td><td>—</td><td>—</td><td>—</td>
          </tr>
          <tr>
            <td class="font-semibold opacity-60">roles</td>
            <td>CRUD</td><td>CRUD</td><td>—</td><td>—</td><td>—</td><td>—</td>
          </tr>
          <tr>
            <td class="font-semibold opacity-60">settings</td>
            <td>CRUD</td><td>CRUD</td><td>—</td><td>—</td><td>—</td><td>—</td>
          </tr>
          <tr>
            <td class="font-semibold opacity-60">agile_milestones</td>
            <td>CRUD</td><td>CRUD</td><td>CRU</td><td>R</td><td>R</td><td>—</td>
          </tr>
          <tr>
            <td class="font-semibold opacity-60">agile_sprints</td>
            <td>CRUD</td><td>CRUD</td><td>CRU</td><td>R</td><td>R</td><td>—</td>
          </tr>
          <tr>
            <td class="font-semibold opacity-60">agile_jobs</td>
            <td>CRUD</td><td>CRUD</td><td>CRU</td><td>R</td><td>R</td><td>—</td>
          </tr>
          <tr>
            <td class="font-semibold opacity-60">agile_tasks</td>
            <td>CRUD</td><td>CRUD</td><td>CRU</td><td>CRU</td><td>R</td><td>—</td>
          </tr>
          <tr>
            <td class="font-semibold opacity-60">agile_comments</td>
            <td>CRUD</td><td>CRUD</td><td>CRU</td><td>CRU</td><td>R</td><td>—</td>
          </tr>
          <tr>
            <td class="font-semibold opacity-60">calendar_events</td>
            <td>CRUD</td><td>CRUD</td><td>CRU</td><td>R</td><td>CR</td><td>—</td>
          </tr>
          <tr>
            <td class="font-semibold opacity-60">messages</td>
            <td>CRUD</td><td>CRUD</td><td>CRU</td><td>CRU</td><td>CRU</td><td>—</td>
          </tr>
          <tr>
            <td class="font-semibold opacity-60">workspaces</td>
            <td>CRUD</td><td>CRU</td><td>R</td><td>R</td><td>R</td><td>—</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="text-xs opacity-50">C = create, R = read, U = update, D = delete</p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">API Enforcement</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Every protected route on the Fastify API uses a <code class="bg-base-300 px-1 rounded text-xs">preHandler</code> to check permissions before the request reaches the handler:
    </p>
    <pre class="bg-base-300 rounded-box p-4 text-sm overflow-x-auto leading-relaxed"><code>// Require authentication only
&#123; preHandler: app.requireAuth &#125;

// Require a specific permission
&#123; preHandler: app.requirePermission('agile_milestones', 'create') &#125;</code></pre>
    <p class="text-sm opacity-70 leading-relaxed">
      If a user lacks the required permission, the API returns <code class="bg-base-300 px-1 rounded text-xs">403 Forbidden</code> before any database access occurs. On each protected request, <code class="bg-base-300 px-1 rounded text-xs">requirePermission</code> reads the user's role from <code class="bg-base-300 px-1 rounded text-xs">workspace_members</code> for the active workspace, then looks up the role's permissions in the <code class="bg-base-300 px-1 rounded text-xs">roles</code> collection. This means permission changes take effect immediately — no re-login required.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Frontend Enforcement</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      The <code class="bg-base-300 px-1 rounded text-xs">hasPermission(user, resource, action)</code> helper from <code class="bg-base-300 px-1 rounded text-xs">$lib/permissions</code> gates UI controls so users only see actions they can perform:
    </p>
    <pre class="bg-base-300 rounded-box p-4 text-sm overflow-x-auto leading-relaxed"><code>&lt;script&gt;
  import &lbrace; hasPermission &rbrace; from '$lib/permissions';
&lt;/script&gt;

&lbrace;#if hasPermission(data.user, 'agile_milestones', 'create')&rbrace;
  &lt;button&gt;New Milestone&lt;/button&gt;
&lbrace;/if&rbrace;</code></pre>
    <p class="text-sm opacity-70 leading-relaxed">
      This is a UI convenience — the API always enforces the same rules independently. Hiding a button does not prevent a determined user from calling the endpoint directly, which is why API-level checks are authoritative.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Managing Roles</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Admins can create new roles and adjust permissions from the <strong>Roles</strong> page (accessible via the profile menu). Changes take effect the next time affected users log in, since permissions are loaded at login. Existing sessions continue with the old permissions until they re-authenticate.
    </p>
  </div>

</div>
