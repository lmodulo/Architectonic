<svelte:head>
  <title>Authentication — lmodulo Documentation</title>
</svelte:head>

<div class="space-y-10">

  <div class="space-y-3">
    <h1 class="text-3xl font-bold">Authentication</h1>
    <p class="text-base opacity-70 leading-relaxed">
      lmodulo uses session-cookie authentication. When a user logs in, the server creates a server-side session and sets a <code class="bg-base-300 px-1 rounded text-xs">session</code> cookie in the browser. All subsequent requests carry that cookie — no tokens, no JWTs.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">How Sessions Work</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Sessions are managed by <code class="bg-base-300 px-1 rounded text-xs">@fastify/session</code> on the API. Session data is stored in MongoDB under the <code class="bg-base-300 px-1 rounded text-xs">sessions</code> collection. When the SvelteKit frontend makes a server-side request to the API, it forwards the raw session cookie so the API can authenticate it.
    </p>
    <pre class="bg-base-300 rounded-box p-4 text-sm overflow-x-auto leading-relaxed"><code>// SvelteKit server route forwarding the session cookie
const sessionCookie = cookies.get('session');
const res = await fetch(`$&#123;API_URL&#125;/agile/milestones`, &#123;
  headers: &#123; cookie: `session=$&#123;sessionCookie&#125;` &#125;
&#125;);</code></pre>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Registration</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      New users register at <code class="bg-base-300 px-1 rounded text-xs">/register</code>. Registration can be toggled on or off by an admin in Settings. When registration is open:
    </p>
    <ul class="space-y-2 text-sm leading-relaxed list-disc list-inside opacity-80">
      <li>The <strong>first user to register</strong> is automatically assigned the <code class="bg-base-300 px-1 rounded text-xs">admin</code> role.</li>
      <li>All subsequent users receive the <code class="bg-base-300 px-1 rounded text-xs">customer</code> role. An admin can promote them to a staff role afterwards.</li>
      <li>Usernames and email addresses must be unique across all users.</li>
      <li>Passwords are hashed with bcryptjs before storage — they are never stored in plain text.</li>
    </ul>

    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead>
          <tr class="bg-base-200">
            <th>Field</th>
            <th>Required</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr><td class="font-mono text-xs">username</td><td>Yes</td><td class="text-sm opacity-70">Unique, used for login display</td></tr>
          <tr><td class="font-mono text-xs">email</td><td>Yes</td><td class="text-sm opacity-70">Unique, used for login and password reset</td></tr>
          <tr><td class="font-mono text-xs">password</td><td>Yes</td><td class="text-sm opacity-70">Minimum length enforced by the UI</td></tr>
          <tr><td class="font-mono text-xs">firstName</td><td>No</td><td class="text-sm opacity-70">Display name in the sidebar and messages</td></tr>
          <tr><td class="font-mono text-xs">lastName</td><td>No</td><td class="text-sm opacity-70">Combined with firstName for full name display</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Login</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Users log in at <code class="bg-base-300 px-1 rounded text-xs">/login</code> with their email and password. On success, the API creates a session, sets the <code class="bg-base-300 px-1 rounded text-xs">session</code> cookie, and the frontend redirects authenticated users to <code class="bg-base-300 px-1 rounded text-xs">/dashboard</code>. Customers are redirected to <code class="bg-base-300 px-1 rounded text-xs">/</code>.
    </p>
    <p class="text-sm opacity-70 leading-relaxed">
      Already-authenticated users who visit <code class="bg-base-300 px-1 rounded text-xs">/login</code> or <code class="bg-base-300 px-1 rounded text-xs">/register</code> are bounced away by <code class="bg-base-300 px-1 rounded text-xs">hooks.server.ts</code> before the page even loads.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Route Protection</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      <code class="bg-base-300 px-1 rounded text-xs">hooks.server.ts</code> runs on every request and enforces three layers of access control:
    </p>
    <ol class="space-y-3 text-sm leading-relaxed list-decimal list-inside opacity-80">
      <li><strong>Unauthenticated redirect</strong> — any path not in <code class="bg-base-300 px-1 rounded text-xs">PUBLIC_PATHS</code> sends the user to <code class="bg-base-300 px-1 rounded text-xs">/login</code>.</li>
      <li><strong>Customer restriction</strong> — users with the <code class="bg-base-300 px-1 rounded text-xs">customer</code> role are limited to a small set of paths (home, profile, logout, upcoming events).</li>
      <li><strong>Permission-based guards</strong> — specific routes like <code class="bg-base-300 px-1 rounded text-xs">/user-management</code> require an explicit permission (<code class="bg-base-300 px-1 rounded text-xs">users.read</code>). Failure redirects to <code class="bg-base-300 px-1 rounded text-xs">/403</code>.</li>
    </ol>
    <p class="text-sm opacity-70 leading-relaxed">
      Public paths include: <code class="bg-base-300 px-1 rounded text-xs">/login</code>, <code class="bg-base-300 px-1 rounded text-xs">/register</code>, <code class="bg-base-300 px-1 rounded text-xs">/forgot-password</code>, <code class="bg-base-300 px-1 rounded text-xs">/reset-password</code>, <code class="bg-base-300 px-1 rounded text-xs">/upcoming-events</code>, and all paths under <code class="bg-base-300 px-1 rounded text-xs">/documentation/</code>.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Password Reset</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      The forgot-password flow generates a time-limited reset token and emails a link to the user. When the user clicks the link, they land on <code class="bg-base-300 px-1 rounded text-xs">/reset-password?token=...</code> where they set a new password. Reset tokens are single-use and expire after a short window.
    </p>
    <p class="text-sm opacity-70 leading-relaxed">
      Email delivery requires a configured SMTP server via the <code class="bg-base-300 px-1 rounded text-xs">SMTP_*</code> environment variables. In development without SMTP, the reset token is typically logged to the API console.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Profile Management</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Authenticated users can update their profile at <code class="bg-base-300 px-1 rounded text-xs">/profile</code>. Editable fields include:
    </p>
    <ul class="space-y-1 text-sm leading-relaxed list-disc list-inside opacity-80">
      <li><strong>Name</strong> — first name and last name</li>
      <li><strong>Username</strong> — must remain unique</li>
      <li><strong>Email</strong> — must remain unique</li>
      <li><strong>Avatar color</strong> — background color for the initials avatar</li>
      <li><strong>Avatar image</strong> — upload a photo; replaces the initials avatar</li>
    </ul>
    <p class="text-sm opacity-70 leading-relaxed">
      Avatar images are stored in MinIO and served at <code class="bg-base-300 px-1 rounded text-xs">/uploads/avatars/[userId]</code>. Users can remove their avatar to revert to the initials display.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">API Endpoints</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead>
          <tr class="bg-base-200">
            <th>Method</th>
            <th>Path</th>
            <th>Auth</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/auth/config</td><td>Public</td><td class="text-sm opacity-70">Whether registration is open</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/auth/register</td><td>Public</td><td class="text-sm opacity-70">Create a new account</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/auth/login</td><td>Public</td><td class="text-sm opacity-70">Authenticate and start a session</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/auth/logout</td><td>Required</td><td class="text-sm opacity-70">Destroy the current session</td></tr>
          <tr><td><span class="badge badge-sm">GET</span></td><td class="font-mono text-xs">/auth/me</td><td>Required</td><td class="text-sm opacity-70">Get authenticated user, role, and permissions</td></tr>
          <tr><td><span class="badge badge-sm badge-warning">PATCH</span></td><td class="font-mono text-xs">/auth/profile</td><td>Required</td><td class="text-sm opacity-70">Update username, email, name, avatar color</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/auth/avatar</td><td>Required</td><td class="text-sm opacity-70">Upload a profile picture</td></tr>
          <tr><td><span class="badge badge-sm badge-error">DELETE</span></td><td class="font-mono text-xs">/auth/avatar</td><td>Required</td><td class="text-sm opacity-70">Remove profile picture</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/auth/forgot-password</td><td>Public</td><td class="text-sm opacity-70">Request a password reset email</td></tr>
          <tr><td><span class="badge badge-sm badge-success">POST</span></td><td class="font-mono text-xs">/auth/reset-password</td><td>Public</td><td class="text-sm opacity-70">Set a new password using a reset token</td></tr>
        </tbody>
      </table>
    </div>
  </div>

</div>
