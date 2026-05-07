<svelte:head>
  <title>Administration — lmodulo Documentation</title>
</svelte:head>

<div class="space-y-10">

  <div class="space-y-3">
    <h1 class="text-3xl font-bold">Administration</h1>
    <p class="text-base opacity-70 leading-relaxed">
      lmodulo's admin features cover user management, role assignment, application settings, brand customization, and notification preferences. All admin actions require the appropriate permission — most are restricted to the <code class="bg-base-300 px-1 rounded text-xs">admin</code> and <code class="bg-base-300 px-1 rounded text-xs">owner</code> roles.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">User Management — <code class="text-base font-mono">/user-management</code></h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Accessible to users with the <code class="bg-base-300 px-1 rounded text-xs">users.read</code> permission. Shows all non-customer users in a table. From here, admins can:
    </p>
    <ul class="space-y-2 text-sm leading-relaxed list-disc list-inside opacity-80">
      <li><strong>Create users</strong> — add team members directly without requiring them to self-register. New users created this way default to the <code class="bg-base-300 px-1 rounded text-xs">viewer</code> role.</li>
      <li><strong>Edit profiles</strong> — update any user's name, username, or email address.</li>
      <li><strong>Change roles</strong> — promote or demote users by assigning a different role. Role changes take effect on the user's next login.</li>
      <li><strong>Delete users</strong> — permanently remove a user and their session. Content they created (comments, tasks) remains in the database.</li>
    </ul>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4 text-sm">
      <p class="font-semibold">Note on Role Changes</p>
      <p class="opacity-70 leading-relaxed mt-1">Permissions are loaded at login time and attached to the session. A user whose role is changed mid-session will continue operating with their old permissions until they log out and back in.</p>
    </div>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Roles Management</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Accessible from the profile dropdown to users with <code class="bg-base-300 px-1 rounded text-xs">roles.read</code>. Shows all roles with their permission sets. Admins can:
    </p>
    <ul class="space-y-2 text-sm leading-relaxed list-disc list-inside opacity-80">
      <li><strong>Create new roles</strong> — define custom roles with any combination of resource/action permissions.</li>
      <li><strong>Edit permissions</strong> — add or remove CRUD actions on any resource for an existing role.</li>
      <li><strong>Rename roles</strong> — change the display label without affecting users assigned to that role.</li>
    </ul>
    <p class="text-sm opacity-70 leading-relaxed">
      The six default roles (owner, admin, lead, contributor, viewer, customer) can be edited but not deleted.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Settings — <code class="text-base font-mono">/settings</code></h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Requires <code class="bg-base-300 px-1 rounded text-xs">settings.read</code>. All settings are stored as key-value pairs in MongoDB and editable through the UI without restarting the application.
    </p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Setting Key</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">brand.name</td><td class="opacity-50">—</td><td class="text-sm opacity-70">Team or product name shown in the nav header</td></tr>
          <tr><td class="font-mono text-xs">brand.logo</td><td class="opacity-50">—</td><td class="text-sm opacity-70">URL of the uploaded logo image</td></tr>
          <tr><td class="font-mono text-xs">app.registration_open</td><td class="opacity-50">true</td><td class="text-sm opacity-70">Whether new users can self-register at <code class="bg-base-300 px-1 rounded text-xs">/register</code></td></tr>
          <tr><td class="font-mono text-xs">chat.enabled</td><td class="opacity-50">true</td><td class="text-sm opacity-70">Show or hide the AI assistant chat panel</td></tr>
          <tr><td class="font-mono text-xs">theme.mode</td><td class="opacity-50">light</td><td class="text-sm opacity-70">Default theme. Users can override individually via the toggle in the header.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Brand Customization</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      The brand name and logo appear in the sidebar header. Both are runtime-configurable from the Settings page — no deployment required to update them.
    </p>
    <ul class="space-y-2 text-sm leading-relaxed list-disc list-inside opacity-80">
      <li><strong>Brand name</strong> — plain text, displayed as the application title in the nav. Set via the settings form (PATCH <code class="bg-base-300 px-1 rounded text-xs">/settings/brand.name</code>).</li>
      <li><strong>Logo image</strong> — upload a PNG or SVG via the logo upload form (POST <code class="bg-base-300 px-1 rounded text-xs">/settings/logo</code>). The image is stored in MinIO and served through <code class="bg-base-300 px-1 rounded text-xs">/uploads/</code>.</li>
      <li>If both a name and logo are set, the logo takes precedence in the nav. If neither is set, the nav shows nothing in that slot.</li>
      <li>Remove the logo by PATCHing <code class="bg-base-300 px-1 rounded text-xs">brand.logo</code> with an empty string value.</li>
    </ul>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Notification Settings — <code class="text-base font-mono">/notifications/settings</code></h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Each user can configure which calendar event types trigger email reminders and how far in advance those reminders are sent. Settings are per-user and stored in the <code class="bg-base-300 px-1 rounded text-xs">calendar_events.subscriptions</code> collection.
    </p>
    <p class="text-sm opacity-70 leading-relaxed">
      A background process on the API checks for upcoming events and dispatches reminder emails at the configured lead time. The notification settings page at <code class="bg-base-300 px-1 rounded text-xs">/notifications/settings</code> shows a toggle for each event type alongside a lead-time selector.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Registration Control</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Toggle <code class="bg-base-300 px-1 rounded text-xs">app.registration_open</code> to <code class="bg-base-300 px-1 rounded text-xs">false</code> to close public registration. The <code class="bg-base-300 px-1 rounded text-xs">/register</code> page will render a "Registration is closed" message. Admins can still create users directly via the User Management page regardless of this setting.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">AI Assistant Control</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      The chat assistant panel is shown to all authenticated users when <code class="bg-base-300 px-1 rounded text-xs">chat.enabled</code> is <code class="bg-base-300 px-1 rounded text-xs">true</code>. Disable it by toggling the setting in the Settings page — the panel will disappear immediately on the next page navigation without requiring a redeploy.
    </p>
    <p class="text-sm opacity-70 leading-relaxed">
      The assistant connects to Ollama at the URL defined by the <code class="bg-base-300 px-1 rounded text-xs">OLLAMA_URL</code> environment variable. If Ollama is not reachable, chat requests will time out gracefully.
    </p>
  </div>

</div>
