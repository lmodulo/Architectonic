<svelte:head>
  <title>Messaging — lmodulo Documentation</title>
</svelte:head>

<div class="space-y-10">

  <div class="space-y-3">
    <h1 class="text-3xl font-bold">Messaging</h1>
    <p class="text-base opacity-70 leading-relaxed">
      lmodulo includes a full email-style messaging system for in-app communication between team members. Messages are organized into threads, support rich text, and track unread status per recipient.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Concepts</h2>
    <ul class="space-y-3 text-sm leading-relaxed list-disc list-inside opacity-80">
      <li><strong>Thread</strong> — a conversation started by a single message. Replies extend the thread rather than creating a new one.</li>
      <li><strong>Recipient</strong> — one or more users addressed in the original message. All recipients see the thread in their inbox.</li>
      <li><strong>Unread</strong> — each user has their own read/unread state per thread. Opening a thread marks it as read.</li>
      <li><strong>Archive</strong> — threads can be archived to move them out of the inbox without deleting them.</li>
      <li><strong>Soft delete</strong> — deleting a thread hides it for the deleting user but preserves it for other recipients.</li>
    </ul>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Inbox</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      The inbox at <code class="bg-base-300 px-1 rounded text-xs">/messages</code> shows all non-archived, non-deleted threads where the current user is a recipient. Threads are listed in reverse chronological order of their last message. Unread threads are visually highlighted.
    </p>
    <p class="text-sm opacity-70 leading-relaxed">
      The sidebar layout of the messages section shows the thread list on the left and the selected thread on the right. On mobile, the panels stack vertically.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Composing a Message</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Navigate to <code class="bg-base-300 px-1 rounded text-xs">/messages/compose</code> or press the compose button in the messages sidebar. Required fields:
    </p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Field</th><th>Required</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">to</td><td>Yes</td><td class="text-sm opacity-70">One or more recipients selected from the user list</td></tr>
          <tr><td class="font-mono text-xs">subject</td><td>Yes</td><td class="text-sm opacity-70">Short summary shown in the thread list</td></tr>
          <tr><td class="font-mono text-xs">body</td><td>Yes</td><td class="text-sm opacity-70">Rich text content — supports bold, italic, lists, links via Tiptap editor</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Rich Text Editor</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Message composition uses <strong>Tiptap</strong>, a headless rich text editor built on ProseMirror. The editor is integrated via <code class="bg-base-300 px-1 rounded text-xs">svelte-tiptap</code> and supports:
    </p>
    <ul class="space-y-1 text-sm leading-relaxed list-disc list-inside opacity-80">
      <li>Bold, italic, underline, strikethrough</li>
      <li>Ordered and unordered lists</li>
      <li>Headings (H1–H3)</li>
      <li>Hyperlinks</li>
      <li>Block quotes</li>
    </ul>
    <p class="text-sm opacity-70 leading-relaxed">
      The editor outputs HTML that is stored in MongoDB and rendered safely in the thread detail view.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Tabs</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Tab</th><th>Contents</th></tr></thead>
        <tbody>
          <tr><td class="font-semibold">Inbox</td><td class="text-sm opacity-70">Threads where you are a recipient, not archived or deleted.</td></tr>
          <tr><td class="font-semibold">Sent</td><td class="text-sm opacity-70">Threads you originated, ordered by most recent activity.</td></tr>
          <tr><td class="font-semibold">Archive</td><td class="text-sm opacity-70">Threads you have archived. You can unarchive them to restore them to the inbox.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Unread Badge</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      The sidebar navigation shows a live unread count badge on the Messages link. The count is fetched from <code class="bg-base-300 px-1 rounded text-xs">GET /api/messages/unread-count</code> on every route change. Opening a thread clears the unread flag for that thread immediately.
    </p>
    <p class="text-sm opacity-70 leading-relaxed">
      The unread count is also fetched on the server during the root layout load, so the correct number appears even on first page render without a client-side fetch.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Permissions</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      All roles except <code class="bg-base-300 px-1 rounded text-xs">customer</code> can send and receive messages. Customers have no access to the messaging system. There are no further sub-permissions — any staff user can message any other staff user.
    </p>
  </div>

</div>
