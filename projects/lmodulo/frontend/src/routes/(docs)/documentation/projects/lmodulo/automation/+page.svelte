<svelte:head>
  <title>Automation — lmodulo Documentation</title>
</svelte:head>

<div class="space-y-10">

  <div class="space-y-3">
    <h1 class="text-3xl font-bold">Automation</h1>
    <p class="text-base opacity-70 leading-relaxed">
      Automation connects lmodulo's modules behaviorally. Rather than requiring developers to wire cross-module side effects into every route handler, an event/rule engine lets admins define trigger → condition → action rules that execute automatically when platform events occur.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">How it works</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      The engine has three layers:
    </p>
    <ol class="space-y-3 text-sm leading-relaxed list-decimal list-inside opacity-80">
      <li><strong>Event bus</strong> — an in-process bus (<code class="bg-base-300 px-1 rounded text-xs">app.bus</code>) registered as a Fastify plugin. Route handlers call <code class="bg-base-300 px-1 rounded text-xs">app.bus.fire(event, payload)</code> after key mutations.</li>
      <li><strong>Rule cache</strong> — on server start, all enabled rules are loaded from MongoDB into a <code class="bg-base-300 px-1 rounded text-xs">Map&lt;event, Rule[]&gt;</code>. When an event fires the cache is consulted — no DB round-trip per event.</li>
      <li><strong>Action executor</strong> — matched rules are evaluated for conditions; passing rules have each action executed in sequence. Results (pass/fail + error) are written to <code class="bg-base-300 px-1 rounded text-xs">automation_logs</code>.</li>
    </ol>
    <p class="text-sm opacity-70 leading-relaxed">
      Action execution is fire-and-forget — the originating request is never delayed by automation. Errors surface in the execution log, not in the HTTP response that triggered the event.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Trigger Events</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      These are the platform events that rules can subscribe to. The payload fields listed are available for use in conditions and template interpolation.
    </p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Event</th><th>Emitted when</th><th>Key payload fields</th></tr></thead>
        <tbody>
          <tr>
            <td class="font-mono text-xs">auth.user.registered</td>
            <td class="text-sm opacity-70">A new user self-registers</td>
            <td class="text-xs opacity-60">user.id, user.email, user.role, user.firstName, user.username</td>
          </tr>
          <tr>
            <td class="font-mono text-xs">auth.user.invited</td>
            <td class="text-sm opacity-70">An admin invites a user via email</td>
            <td class="text-xs opacity-60">user.id, user.email, user.role, invitedBy.username</td>
          </tr>
          <tr>
            <td class="font-mono text-xs">auth.user.invite.accepted</td>
            <td class="text-sm opacity-70">An invited user accepts and activates their account</td>
            <td class="text-xs opacity-60">user.id, user.email, user.username, user.role</td>
          </tr>
          <tr>
            <td class="font-mono text-xs">calendar.event.created</td>
            <td class="text-sm opacity-70">A new calendar event is created</td>
            <td class="text-xs opacity-60">event.id, event.title, event.startDate, createdBy.username</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4 text-sm">
      <p class="font-semibold">Extending triggers</p>
      <p class="opacity-70 leading-relaxed mt-1">
        Adding a new trigger requires two changes: call <code class="bg-base-300 px-1 rounded text-xs">app.bus.fire('module.event.name', payload)</code> in the route handler after the mutation, and add the event string to the <code class="bg-base-300 px-1 rounded text-xs">TRIGGER_EVENTS</code> array in <code class="bg-base-300 px-1 rounded text-xs">routes/automation/index.ts</code>. The engine and UI pick it up automatically.
      </p>
    </div>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Actions</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Each rule can have one or more actions. Actions run sequentially within a rule. All string param values support <code class="bg-base-300 px-1 rounded text-xs">&#123;&#123; field.path &#125;&#125;</code> interpolation against the event payload.
    </p>

    <div class="space-y-4">

      <div class="card border border-base-300 rounded-box p-4 space-y-3">
        <p class="text-sm font-semibold font-mono">notification.send</p>
        <p class="text-sm opacity-70">Dispatches an in-app notification via the existing notification infrastructure (WebSocket push + persistence). Respects per-user mute settings and quiet hours.</p>
        <div class="overflow-x-auto">
          <table class="table table-xs w-full">
            <thead><tr class="bg-base-200"><th>Param</th><th>Required</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td class="font-mono">title</td><td>Yes</td><td class="opacity-70">Notification title. Supports interpolation.</td></tr>
              <tr><td class="font-mono">body</td><td>No</td><td class="opacity-70">Optional longer description. Supports interpolation.</td></tr>
              <tr><td class="font-mono">type</td><td>No</td><td class="opacity-70">Notification type key (e.g. <code class="bg-base-300 px-1 rounded text-xs">automation.welcome</code>). Used for grouping and muting.</td></tr>
              <tr><td class="font-mono">link</td><td>No</td><td class="opacity-70">URL navigated to when the user clicks the notification.</td></tr>
              <tr><td class="font-mono">userId</td><td>No</td><td class="opacity-70">Recipient user ID. If omitted, all admin/owner accounts are notified.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card border border-base-300 rounded-box p-4 space-y-3">
        <p class="text-sm font-semibold font-mono">message.send</p>
        <p class="text-sm opacity-70">Creates a new in-app message thread from the first admin/owner in the system to the specified recipient. Appears in the recipient's inbox.</p>
        <div class="overflow-x-auto">
          <table class="table table-xs w-full">
            <thead><tr class="bg-base-200"><th>Param</th><th>Required</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td class="font-mono">to</td><td>Yes</td><td class="opacity-70">Recipient user ID.</td></tr>
              <tr><td class="font-mono">subject</td><td>Yes</td><td class="opacity-70">Message subject line. Supports interpolation.</td></tr>
              <tr><td class="font-mono">body</td><td>Yes</td><td class="opacity-70">Message body HTML. Supports interpolation.</td></tr>
              <tr><td class="font-mono">from</td><td>No</td><td class="opacity-70">Sender user ID. Defaults to the earliest admin/owner.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card border border-base-300 rounded-box p-4 space-y-3">
        <p class="text-sm font-semibold font-mono">calendar.event.create</p>
        <p class="text-sm opacity-70">Creates a calendar event on behalf of the first admin/owner in the system.</p>
        <div class="overflow-x-auto">
          <table class="table table-xs w-full">
            <thead><tr class="bg-base-200"><th>Param</th><th>Required</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td class="font-mono">title</td><td>Yes</td><td class="opacity-70">Event title. Supports interpolation.</td></tr>
              <tr><td class="font-mono">startDate</td><td>No</td><td class="opacity-70">ISO date string. Defaults to now if omitted.</td></tr>
              <tr><td class="font-mono">content</td><td>No</td><td class="opacity-70">Rich-text description of the event.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Conditions</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Rules can have zero or more conditions. All conditions must pass for the rule's actions to execute. Conditions filter on fields in the event payload using dot-notation paths (e.g. <code class="bg-base-300 px-1 rounded text-xs">user.role</code>).
    </p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Operator</th><th>Behaviour</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">==</td><td class="text-sm opacity-70">Field value equals the condition value (string comparison)</td></tr>
          <tr><td class="font-mono text-xs">!=</td><td class="text-sm opacity-70">Field value does not equal the condition value</td></tr>
          <tr><td class="font-mono text-xs">contains</td><td class="text-sm opacity-70">Field value (string) includes the condition value as a substring</td></tr>
        </tbody>
      </table>
    </div>
    <p class="text-sm opacity-70 leading-relaxed">
      A rule with no conditions fires on every occurrence of the trigger event. Add a condition <code class="bg-base-300 px-1 rounded text-xs">user.role == customer</code> to make a rule apply only to customer registrations.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Template Interpolation</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Action param strings can include <code class="bg-base-300 px-1 rounded text-xs">&#123;&#123; field.path &#125;&#125;</code> tokens. They are resolved against the event payload before the action executes. Unresolved tokens (missing field) are replaced with an empty string.
    </p>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4 text-sm space-y-2">
      <p class="font-semibold">Examples</p>
      <ul class="space-y-1 text-xs font-mono opacity-70">
        <li>Welcome, <span class="opacity-100">&#123;&#123; user.firstName &#125;&#125;</span>!</li>
        <li>&#123;&#123; event.title &#125;&#125; has been added to the calendar.</li>
        <li>&#123;&#123; invitedBy.username &#125;&#125; has invited &#123;&#123; user.email &#125;&#125; as &#123;&#123; user.role &#125;&#125;.</li>
      </ul>
    </div>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Managing Rules — <code class="text-base font-mono">/settings/automation</code></h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Requires the <code class="bg-base-300 px-1 rounded text-xs">automation.read</code> permission. Creating, editing, and deleting rules requires <code class="bg-base-300 px-1 rounded text-xs">automation.create</code>, <code class="bg-base-300 px-1 rounded text-xs">automation.update</code>, and <code class="bg-base-300 px-1 rounded text-xs">automation.delete</code> respectively. Both <code class="bg-base-300 px-1 rounded text-xs">owner</code> and <code class="bg-base-300 px-1 rounded text-xs">admin</code> roles have full automation access by default.
    </p>
    <ul class="space-y-2 text-sm leading-relaxed list-disc list-inside opacity-80">
      <li><strong>Enable / disable</strong> — toggle a rule on or off without deleting it. Disabled rules are excluded from the cache and never fire.</li>
      <li><strong>New Rule</strong> — opens a modal to define the trigger event, optional conditions, and one or more actions.</li>
      <li><strong>Logs</strong> — each rule has an execution log showing timestamp, success/failure, and error message for every time it fired.</li>
    </ul>
    <div class="card bg-base-200 border border-base-300 rounded-box p-4 text-sm">
      <p class="font-semibold">Cache refresh</p>
      <p class="opacity-70 leading-relaxed mt-1">
        The in-memory rule cache is reloaded automatically after every create, update, or delete via the API. There is no need to restart the server when rules change.
      </p>
    </div>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">API Reference</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Path</th><th>Permission</th><th>Description</th></tr></thead>
        <tbody>
          <tr>
            <td class="font-mono text-xs">GET</td>
            <td class="font-mono text-xs">/automation</td>
            <td class="text-xs opacity-60">automation.read</td>
            <td class="text-sm opacity-70">List all rules, newest first</td>
          </tr>
          <tr>
            <td class="font-mono text-xs">GET</td>
            <td class="font-mono text-xs">/automation/meta</td>
            <td class="text-xs opacity-60">automation.read</td>
            <td class="text-sm opacity-70">Available trigger events and action types</td>
          </tr>
          <tr>
            <td class="font-mono text-xs">POST</td>
            <td class="font-mono text-xs">/automation</td>
            <td class="text-xs opacity-60">automation.create</td>
            <td class="text-sm opacity-70">Create a rule. Body: <code class="bg-base-300 px-1 rounded text-xs">&#123; name, trigger, actions &#125;</code></td>
          </tr>
          <tr>
            <td class="font-mono text-xs">PATCH</td>
            <td class="font-mono text-xs">/automation/:id</td>
            <td class="text-xs opacity-60">automation.update</td>
            <td class="text-sm opacity-70">Partial update — any combination of name, trigger, actions, enabled</td>
          </tr>
          <tr>
            <td class="font-mono text-xs">DELETE</td>
            <td class="font-mono text-xs">/automation/:id</td>
            <td class="text-xs opacity-60">automation.delete</td>
            <td class="text-sm opacity-70">Permanently delete a rule and its logs</td>
          </tr>
          <tr>
            <td class="font-mono text-xs">GET</td>
            <td class="font-mono text-xs">/automation/:id/logs</td>
            <td class="text-xs opacity-60">automation.read</td>
            <td class="text-sm opacity-70">Execution history for a rule. Paginated, 20/page.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">MongoDB Collections</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Collection</th><th>Purpose</th><th>Key indexes</th></tr></thead>
        <tbody>
          <tr>
            <td class="font-mono text-xs">automation_rules</td>
            <td class="text-sm opacity-70">Rule definitions with trigger, conditions, and actions</td>
            <td class="text-xs opacity-60">enabled + trigger.event, createdAt</td>
          </tr>
          <tr>
            <td class="font-mono text-xs">automation_logs</td>
            <td class="text-sm opacity-70">Per-execution records: ruleId, event, success, error, executedAt</td>
            <td class="text-xs opacity-60">ruleId + executedAt, executedAt</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

</div>
