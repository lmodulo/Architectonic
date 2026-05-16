<svelte:head>
  <title>Workspaces — lmodulo Documentation</title>
</svelte:head>

<div class="space-y-10">

  <div class="space-y-3">
    <h1 class="text-3xl font-bold">Workspaces</h1>
    <p class="text-base opacity-70 leading-relaxed">
      Workspaces are the top-level container for all application data. Every user belongs to one or more workspaces, and their role — and therefore their permissions — is scoped to each workspace independently. Teams, events, and other resources belong to exactly one workspace and are never visible across workspace boundaries.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Data Model</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Two collections drive the workspace system:
    </p>
    <div class="space-y-3">
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-2">
        <p class="font-mono text-xs font-semibold">workspaces</p>
        <pre class="text-xs opacity-70 leading-relaxed"><code>&#123;
  _id, name, slug (unique),
  description, logoUrl, ownerId,
  createdAt, updatedAt
&#125;</code></pre>
        <p class="text-sm opacity-60">One document per workspace. The <code class="bg-base-300 px-1 rounded">slug</code> is URL-safe and unique across all workspaces.</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-2">
        <p class="font-mono text-xs font-semibold">workspace_members</p>
        <pre class="text-xs opacity-70 leading-relaxed"><code>&#123;
  _id, workspaceId, userId,
  role, createdAt, updatedAt
&#125;
// unique index on &#123; workspaceId, userId &#125;</code></pre>
        <p class="text-sm opacity-60">One record per user per workspace. The <code class="bg-base-300 px-1 rounded">role</code> field here replaces the old <code class="bg-base-300 px-1 rounded">user.role</code> field — roles are no longer stored on the user document.</p>
      </div>
    </div>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">How Roles Work Now</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Before workspaces, every user had a single global <code class="bg-base-300 px-1 rounded text-xs">role</code> field on their user document. That field is gone. Role is now resolved at request time by looking up the user's <code class="bg-base-300 px-1 rounded text-xs">workspace_members</code> record for the active workspace.
    </p>
    <p class="text-sm opacity-70 leading-relaxed">
      This means the same user can be an <code class="bg-base-300 px-1 rounded text-xs">admin</code> in one workspace and a <code class="bg-base-300 px-1 rounded text-xs">contributor</code> in another. Permissions are fully isolated between workspaces.
    </p>
    <pre class="bg-base-300 rounded-box p-4 text-sm overflow-x-auto leading-relaxed"><code>// API auth plugin — requirePermission flow
1. Check session.userId
2. Find workspace_members where &#123; workspaceId: session.workspaceId, userId &#125;
3. Read role from membership
4. Look up roles collection for that role's permissions
5. Check permissions[resource][action]</code></pre>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Session & Active Workspace</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      The session stores a <code class="bg-base-300 px-1 rounded text-xs">workspaceId</code> alongside <code class="bg-base-300 px-1 rounded text-xs">userId</code>. This determines which workspace's data is returned for every request. It is set automatically on login (to the user's first membership) and can be changed by calling the switch endpoint.
    </p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Endpoint</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">POST /workspaces/:id/switch</td><td class="text-sm opacity-70">Sets <code class="bg-base-300 px-1 rounded text-xs">session.workspaceId</code> to the given workspace. The next request will operate within that workspace.</td></tr>
        </tbody>
      </table>
    </div>
    <p class="text-sm opacity-70 leading-relaxed">
      The frontend <code class="bg-base-300 px-1 rounded text-xs">WorkspaceSwitcher</code> component calls this endpoint and then calls <code class="bg-base-300 px-1 rounded text-xs">invalidateAll()</code> to reload all page data. It is rendered in the sidebar for all non-customer users and is hidden when the user only belongs to one workspace.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">API Reference</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead>
          <tr class="bg-base-200">
            <th>Method</th>
            <th>Path</th>
            <th>Gate</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="font-mono text-xs">GET</td>
            <td class="font-mono text-xs">/workspaces</td>
            <td class="text-xs opacity-60">auth</td>
            <td class="text-sm opacity-70">List workspaces the current user belongs to, with their role in each</td>
          </tr>
          <tr>
            <td class="font-mono text-xs">POST</td>
            <td class="font-mono text-xs">/workspaces</td>
            <td class="text-xs opacity-60">auth</td>
            <td class="text-sm opacity-70">Create a new workspace; caller is added as <code class="bg-base-300 px-1 rounded">owner</code></td>
          </tr>
          <tr>
            <td class="font-mono text-xs">GET</td>
            <td class="font-mono text-xs">/workspaces/:id</td>
            <td class="text-xs opacity-60">member</td>
            <td class="text-sm opacity-70">Get workspace details including caller's role</td>
          </tr>
          <tr>
            <td class="font-mono text-xs">PATCH</td>
            <td class="font-mono text-xs">/workspaces/:id</td>
            <td class="text-xs opacity-60">workspaces:update</td>
            <td class="text-sm opacity-70">Update name, slug, or description</td>
          </tr>
          <tr>
            <td class="font-mono text-xs">DELETE</td>
            <td class="font-mono text-xs">/workspaces/:id</td>
            <td class="text-xs opacity-60">workspaces:delete</td>
            <td class="text-sm opacity-70">Delete workspace and all memberships</td>
          </tr>
          <tr>
            <td class="font-mono text-xs">GET</td>
            <td class="font-mono text-xs">/workspaces/:id/members</td>
            <td class="text-xs opacity-60">member</td>
            <td class="text-sm opacity-70">List all members with user details and role</td>
          </tr>
          <tr>
            <td class="font-mono text-xs">POST</td>
            <td class="font-mono text-xs">/workspaces/:id/members</td>
            <td class="text-xs opacity-60">workspaces:update</td>
            <td class="text-sm opacity-70">Add an existing user by email with a specified role</td>
          </tr>
          <tr>
            <td class="font-mono text-xs">PATCH</td>
            <td class="font-mono text-xs">/workspaces/:id/members/:userId</td>
            <td class="text-xs opacity-60">workspaces:update</td>
            <td class="text-sm opacity-70">Change a member's role</td>
          </tr>
          <tr>
            <td class="font-mono text-xs">DELETE</td>
            <td class="font-mono text-xs">/workspaces/:id/members/:userId</td>
            <td class="text-xs opacity-60">workspaces:update</td>
            <td class="text-sm opacity-70">Remove a member from the workspace</td>
          </tr>
          <tr>
            <td class="font-mono text-xs">POST</td>
            <td class="font-mono text-xs">/workspaces/:id/switch</td>
            <td class="text-xs opacity-60">member</td>
            <td class="text-sm opacity-70">Set this workspace as the active one in the session</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Data Scoping</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Every resource that belongs to a workspace carries a <code class="bg-base-300 px-1 rounded text-xs">workspaceId</code> field. Route handlers read <code class="bg-base-300 px-1 rounded text-xs">req.session.workspaceId</code> and include it in all queries and inserts.
    </p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Collection</th><th>Scoped</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">teams</td><td><span class="badge badge-success badge-xs">yes</span></td><td class="text-sm opacity-70">Fully scoped — teams list and create filter by workspaceId</td></tr>
          <tr><td class="font-mono text-xs">events</td><td><span class="badge badge-success badge-xs">yes</span></td><td class="text-sm opacity-70">Fully scoped — authenticated list and create filter by workspaceId. Public <code class="bg-base-300 px-1 rounded">/events/public</code> remains unscoped.</td></tr>
          <tr><td class="font-mono text-xs">users (via workspace_members)</td><td><span class="badge badge-success badge-xs">yes</span></td><td class="text-sm opacity-70">GET /users returns workspace members only. Role changes update workspace_members, not the user document.</td></tr>
          <tr><td class="font-mono text-xs">messages</td><td><span class="badge badge-warning badge-xs">partial</span></td><td class="text-sm opacity-70">workspaceId is stored on new messages but reads are not yet filtered by it. Full scoping is a planned follow-up.</td></tr>
          <tr><td class="font-mono text-xs">audit_logs</td><td><span class="badge badge-warning badge-xs">partial</span></td><td class="text-sm opacity-70">workspaceId is stored on new log entries; UI filtering not yet implemented.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Workspace Settings UI — <code class="text-base font-mono">/settings/workspaces</code></h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Accessible to users with <code class="bg-base-300 px-1 rounded text-xs">workspaces.read</code>. The page has two tabs:
    </p>
    <ul class="space-y-2 text-sm leading-relaxed list-disc list-inside opacity-80">
      <li><strong>General</strong> — edit the workspace name and description. Requires <code class="bg-base-300 px-1 rounded text-xs">workspaces.update</code>.</li>
      <li><strong>Members</strong> — view all members and their roles. Admins and owners can change roles and remove members. Adding a member by email requires the user to already have an account.</li>
    </ul>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Default Workspace</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      On first boot the seed plugin creates one workspace with <code class="bg-base-300 px-1 rounded text-xs">slug: 'default'</code> and adds all seed users to it with their respective roles. New users who self-register are also automatically added to the first workspace found (typically the default one) with the <code class="bg-base-300 px-1 rounded text-xs">customer</code> role. The first user to register receives the <code class="bg-base-300 px-1 rounded text-xs">owner</code> role.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Customer Visibility</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Users with the <code class="bg-base-300 px-1 rounded text-xs">customer</code> role see single-workspace behaviour — the <code class="bg-base-300 px-1 rounded text-xs">WorkspaceSwitcher</code> is not rendered for them, and they have no <code class="bg-base-300 px-1 rounded text-xs">workspaces</code> permissions. From their perspective, the workspace concept is invisible.
    </p>
  </div>

</div>
