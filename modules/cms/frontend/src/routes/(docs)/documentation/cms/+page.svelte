<script lang="ts">
  // The Content module's documentation page (registered in $lib/config/module-docs/cms.ts).
</script>

<svelte:head>
  <title>Content — Documentation</title>
</svelte:head>

{#snippet c(text: string)}<code class="bg-base-300 px-1 rounded text-xs">{text}</code>{/snippet}

<div class="space-y-10">

  <div class="space-y-3">
    <h1 class="text-3xl font-bold">Content</h1>
    <p class="text-base opacity-70 leading-relaxed">
      Content (module {@render c('cms')}) runs the public website from the same app. Staff build it at {@render c('/cms')}: a site tree that is both the menu and the URL structure, a block page builder, images from the Vault, and custom Svelte components such as the Calendar's upcoming events. Visitors see published pages at the site root ({@render c('/')}, {@render c('/about')}, {@render c('/about/team')}) with no app shell and no sign-in.
    </p>
  </div>

  <!-- Site tree -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">The Site Tree</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Every item has a slug, and an item's URL is the slugs of it and its parents joined: {@render c('about')} under nothing is {@render c('/about')}, {@render c('team')} under it is {@render c('/about/team')}. Paths are computed when the tree is read, so moving an item moves everything under it without rewriting anything. Items can be dragged (before, after or inside another item) or moved with Alt + arrow keys.
    </p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Type</th><th>What it is</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">page</td><td class="text-sm opacity-70">A page of blocks, built in the page builder.</td></tr>
          <tr><td class="font-mono text-xs">component</td><td class="text-sm opacity-70">A whole page rendered by a registry component (for example the sitemap or the events list).</td></tr>
          <tr><td class="font-mono text-xs">link</td><td class="text-sm opacity-70">A menu entry that goes somewhere else: an external URL or a path. It has no slug and no children.</td></tr>
          <tr><td class="font-mono text-xs">label</td><td class="text-sm opacity-70">A heading in the menu with no page of its own. Its slug is part of its children's URLs, and its own URL redirects to its first visible child.</td></tr>
        </tbody>
      </table>
    </div>
    <ul class="list-disc pl-5 space-y-1 text-sm opacity-70 leading-relaxed">
      <li><strong>Publishing.</strong> An item is public only when it <em>and every item above it</em> are published. Publishing a page copies its draft to the live copy in one write; unpublishing removes the live copy and hides everything under the item too.</li>
      <li><strong>Menu.</strong> Items marked "Show in menu" appear in the site header (dropdowns to any depth on desktop, an accordion drawer on phones). Hidden items keep their URL.</li>
      <li><strong>Home page.</strong> Any published page can be made the home page in the item's panel or in Settings. It is then served at {@render c('/')}, and its own path redirects there. With no published home page, {@render c('/')} shows the scaffold's default page.</li>
      <li><strong>Reserved slugs.</strong> A top-level slug can't take a URL the application uses ({@render c('/login')}, {@render c('/dashboard')}, {@render c('/vault')} and so on). The admin checks the project's real route list, and the API keeps a fixed list too. An item whose slug a newly installed module has since claimed shows a <em>Shadowed</em> badge: the app's route wins.</li>
      <li><strong>Unknown and odd URLs.</strong> Site URLs use lowercase letters, numbers and dashes. Anything else, and anything under {@render c('/api')}, {@render c('/uploads')} or {@render c('/_app')}, never reaches the site.</li>
    </ul>
  </div>

  <!-- Page builder -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">The Page Builder</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      A page is a list of blocks. Add one with the + between blocks, drag the handle (or use the arrows) to reorder, and edit text in place. The draft saves itself about a second after each change. Each save sends the version it was based on, so if someone else saved the page in the meantime the editor stops and asks whether to load their version or keep yours. Preview opens the draft as the site would show it.
    </p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Block</th><th>Contents</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">richText</td><td class="text-sm opacity-70">Paragraphs, headings (levels 2–4), lists, quotes, lines, bold, italic, underline, strike, links, and Vault images that sit left or right with the text wrapping round them, centred or full width.</td></tr>
          <tr><td class="font-mono text-xs">hero</td><td class="text-sm opacity-70">A full-width banner: heading, subtitle, optional background image and one button. A hero that starts the page is the page's main heading.</td></tr>
          <tr><td class="font-mono text-xs">gallery</td><td class="text-sm opacity-70">A grid of Vault images (2–6 columns, square, 4:3 or as uploaded). Clicking one opens a full-screen viewer with arrow keys, swipe and Esc.</td></tr>
          <tr><td class="font-mono text-xs">buttons</td><td class="text-sm opacity-70">Up to ten buttons, each linking to a site page or a URL.</td></tr>
          <tr><td class="font-mono text-xs">divider</td><td class="text-sm opacity-70">A line or a blank space.</td></tr>
          <tr><td class="font-mono text-xs">component</td><td class="text-sm opacity-70">A registry component placed on the page, with its settings.</td></tr>
        </tbody>
      </table>
    </div>
    <ul class="list-disc pl-5 space-y-1 text-sm opacity-70 leading-relaxed">
      <li><strong>Everything is sanitized on save.</strong> Only the block types, text nodes, marks and attributes above are stored; link addresses must start with {@render c('https://')}, {@render c('http://')}, {@render c('mailto:')}, {@render c('tel:')}, {@render c('/')} or {@render c('#')}. Text is stored as Tiptap JSON, never HTML, and the site renders it without raw HTML.</li>
      <li><strong>Links to site pages follow them.</strong> Buttons, hero buttons, footer links and links inside text store the page's id, not its path, so moving or renaming a page doesn't break them. A link to a page that isn't public shows as plain text (buttons are left out) until the page is published.</li>
      <li><strong>Problems show under the block</strong>: red for what a save would drop (a button with no label), amber for what needs attention (missing alt text, an image no longer in the Vault, a link to a deleted page). Publishing also warns about links to unpublished pages and missing images.</li>
    </ul>
  </div>

  <!-- Images -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Images from the Vault</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Images come from the Vault module; without it, image actions are hidden and say so. The picker lists the Vault's web images by folder, with search, and uploads new ones into a Vault folder (by default "Website Media", created on first use; Settings can choose another).
    </p>
    <ul class="list-disc pl-5 space-y-1 text-sm opacity-70 leading-relaxed">
      <li><strong>Images placed on pages are publicly visible.</strong> Only PNG, JPEG, GIF, WebP and AVIF files are offered or shown (checked by type and file extension). SVGs and admin-only documents never are.</li>
      <li><strong>Pages store the Vault document, not the file.</strong> Each page view looks up the current version, so a new version appears on the site straight away, and an image that is deleted or made admin-only disappears from it.</li>
      <li>Width and height are read when an image is chosen and used as layout hints; there are no thumbnails, so large files load at full size (lazily).</li>
    </ul>
  </div>

  <!-- SEO -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Search and Sharing</h2>
    <p class="text-sm opacity-70 leading-relaxed">Each page's settings panel has a search title, a description, a share image and "Hide from search engines". The page head then carries:</p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Tag</th><th>Value</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">&lt;title&gt;, og:title</td><td class="text-sm opacity-70">The search title, else the page title, then " · " and the brand name (else the app name).</td></tr>
          <tr><td class="font-mono text-xs">description, og:description</td><td class="text-sm opacity-70">The description, else the first hero's subtitle, else the start of the first text block, cut to about 160 characters.</td></tr>
          <tr><td class="font-mono text-xs">canonical, og:url</td><td class="text-sm opacity-70">The site's origin plus the page's public path ({@render c('/')} for the home page). In production the origin comes from the {@render c('ORIGIN')} variable of the web service, so set it to the public address.</td></tr>
          <tr><td class="font-mono text-xs">og:image, twitter:card</td><td class="text-sm opacity-70">The share image's current Vault file as an absolute URL, with its alt text and size; the card is "summary_large_image" with an image, "summary" without. Left out if the Vault no longer allows the image.</td></tr>
          <tr><td class="font-mono text-xs">robots</td><td class="text-sm opacity-70">{@render c('noindex')} when the page is hidden from search engines. Draft previews are always {@render c('noindex, nofollow')}.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Components -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Custom Components</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      A component is a Svelte component that can be a whole page (a {@render c('component')} item), a block, or both. Each one is a file in {@render c('src/lib/config/cms-components/')} that default-exports an entry; the registry picks the files up automatically. Content ships two:
    </p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Key</th><th>Shows</th><th>Settings</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">sitemap</td><td class="text-sm opacity-70">Every published page as a nested list.</td><td class="text-sm opacity-70">Include pages hidden from the menu.</td></tr>
          <tr><td class="font-mono text-xs">events</td><td class="text-sm opacity-70">Upcoming public events from the Calendar module, soonest first: date, title, location and a plain-text description. As a page they are grouped by month. Without the Calendar module it says events are unavailable, and the admin warns.</td><td class="text-sm opacity-70">How many to show (1–50, default 10); which event type.</td></tr>
        </tbody>
      </table>
    </div>
    <p class="text-sm opacity-70 leading-relaxed">
      The events list comes from the Calendar's public feed, which only includes events that are active, public and start after the current moment. An event that has already started, including one on today's date, is not listed.
    </p>
    <p class="text-sm opacity-70 leading-relaxed">Another module can add a component by shipping its own file in that folder. The entry's shape:</p>
    <pre class="bg-base-300 rounded-box p-4 text-sm overflow-x-auto leading-relaxed"><code>export default &#123;
  key: 'my-widget',                 // lowercase letters, numbers, dashes
  label: 'My widget',
  description: 'One line for the admin.',
  modes: ['page', 'block'],         // where it can be used
  component: MyWidget,              // receives &#123; props, data, mode, rest &#125;
  props: [                          // optional settings form
    &#123; name: 'limit', label: 'How many', type: 'number', default: 5 &#125;,
  ],
  subpaths: false,                  // page mode: /widget/anything resolves here, with rest = 'anything'
  requires: &#123; resource: 'my_items', module: 'My module' &#125;,   // optional: admin warns if missing
  load: async (&#123; fetch, url, rest, props &#125;) => (await fetch('/api/my-module/public')).json(),
&#125;;</code></pre>
    <ul class="list-disc pl-5 space-y-1 text-sm opacity-70 leading-relaxed">
      <li>{@render c('load')} runs on the server for the public page and in the browser for the admin preview, so it may only use the {@render c('fetch')} it is given, against this app's {@render c('/api/...')} routes, and must never import {@render c('$env/dynamic/private')}. It has five seconds; a failure gives the component {@render c('data = { unavailable: true }')}.</li>
      <li>Match the shape without importing Content's types, so the module still builds when Content isn't installed. An unknown key renders nothing on the site and a warning in the admin.</li>
      <li>Render text only, never raw HTML: data from other modules may contain markup.</li>
    </ul>
  </div>

  <!-- Data model -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Data Model</h2>
    <p class="text-sm opacity-70 leading-relaxed">There is one public site per deployment, so these collections have no workspace. Only image lookups use the editor's workspace.</p>
    <pre class="bg-base-300 rounded-box p-4 text-sm overflow-x-auto leading-relaxed"><code>cms_nodes      ← the site tree: one document per item (flat; the tree is built in memory)
cms_pages      ← one per page item: the draft and the published copy together
cms_settings   ← one document, _id 'site': home page, footer, upload folder</code></pre>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">cms_nodes</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Field</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">parentId</td><td class="text-xs opacity-60">ObjectId | null</td><td class="text-sm opacity-70">{@render c('null')} = top level</td></tr>
          <tr><td class="font-mono text-xs">order</td><td class="text-xs opacity-60">number</td><td class="text-sm opacity-70">Position among its siblings</td></tr>
          <tr><td class="font-mono text-xs">type</td><td class="text-xs opacity-60">page | component | link | label</td><td class="text-sm opacity-70"></td></tr>
          <tr><td class="font-mono text-xs">title</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Menu text and page title</td></tr>
          <tr><td class="font-mono text-xs">slug</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Unique among siblings; absent for links</td></tr>
          <tr><td class="font-mono text-xs">showInMenu</td><td class="text-xs opacity-60">boolean</td><td class="text-sm opacity-70"></td></tr>
          <tr><td class="font-mono text-xs">status</td><td class="text-xs opacity-60">draft | published</td><td class="text-sm opacity-70">Changed only by publish and unpublish</td></tr>
          <tr><td class="font-mono text-xs">component</td><td class="text-xs opacity-60">&#123; key, props &#125;</td><td class="text-sm opacity-70">Component items</td></tr>
          <tr><td class="font-mono text-xs">url, newTab</td><td class="text-xs opacity-60">string, boolean</td><td class="text-sm opacity-70">Link items</td></tr>
          <tr><td class="font-mono text-xs">createdAt, updatedAt, createdBy, updatedBy</td><td class="text-xs opacity-60">date, ObjectId</td><td class="text-sm opacity-70"></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">cms_pages</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Field</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">nodeId</td><td class="text-xs opacity-60">ObjectId (unique)</td><td class="text-sm opacity-70">The page item</td></tr>
          <tr><td class="font-mono text-xs">draft</td><td class="text-xs opacity-60">&#123; blocks, seo &#125;</td><td class="text-sm opacity-70">What editors see and save</td></tr>
          <tr><td class="font-mono text-xs">published</td><td class="text-xs opacity-60">&#123; blocks, seo &#125; | null</td><td class="text-sm opacity-70">What the site shows; {@render c('null')} when unpublished</td></tr>
          <tr><td class="font-mono text-xs">rev</td><td class="text-xs opacity-60">number</td><td class="text-sm opacity-70">Goes up on every save; a save or publish based on an older rev gets 409</td></tr>
          <tr><td class="font-mono text-xs">publishedAt, updatedAt, updatedBy</td><td class="text-xs opacity-60">date, ObjectId</td><td class="text-sm opacity-70"></td></tr>
        </tbody>
      </table>
    </div>
    <p class="text-sm opacity-70 leading-relaxed">
      A block is {@render c('{ id, type, data }')}. Links are {@render c('{ nodeId }')} or {@render c('{ url }')}; a link inside text is a link mark with {@render c('href')}, {@render c('target')} and, for a site page, {@render c('nodeId')}. Images are {@render c('{ vaultId, src, alt, w, h }')}, where {@render c('src')} is only the editor's preview: the site uses the Vault's current file.
    </p>
  </div>

  <div class="space-y-4">
    <h2 class="text-xl font-semibold">cms_settings</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Field</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">homeNodeId</td><td class="text-xs opacity-60">ObjectId | null</td><td class="text-sm opacity-70">The page served at {@render c('/')}</td></tr>
          <tr><td class="font-mono text-xs">footer</td><td class="text-xs opacity-60">&#123; text, links[] &#125;</td><td class="text-sm opacity-70">Footer text, and links of {@render c('{ label, link, newTab }')}</td></tr>
          <tr><td class="font-mono text-xs">mediaFolderId</td><td class="text-xs opacity-60">ObjectId | null</td><td class="text-sm opacity-70">The Vault folder uploads go to</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Scaffold extension points -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">How It Plugs Into the App</h2>
    <ul class="list-disc pl-5 space-y-1 text-sm opacity-70 leading-relaxed">
      <li>Public pages are one catch-all route, {@render c('routes/(site)/[...path=cmspath]')}, made public and shell-free by a route rule that matches its route id ({@render c('src/lib/config/module-routes/cms.ts')}). The app's own routes always win over it.</li>
      <li>The home page uses the scaffold's home override ({@render c('src/lib/server/module-home/cms.ts')} and {@render c('src/lib/config/module-home/cms.svelte')}), which returns nothing until a published home page is set.</li>
      <li>The admin and the site's own components call the API through {@render c('/api/cms/...')}, which forwards the session cookie. The public site's server loads call the API directly.</li>
      <li>Images go through the Vault's own upload route, so the Vault's validation, permissions and audit log apply. Content reads the Vault's collections by name and imports none of its code.</li>
    </ul>
  </div>

  <!-- Permissions -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Permissions</h2>
    <p class="text-sm opacity-70 leading-relaxed">Publishing has its own resource because the scaffold's actions are only create, read, update and delete. The public site needs no permissions.</p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Role</th><th>cms_nodes</th><th>cms_pages</th><th>cms_publish</th></tr></thead>
        <tbody>
          <tr><td>owner / admin</td><td class="text-xs opacity-70">CRUD</td><td class="text-xs opacity-70">CRUD</td><td class="text-xs opacity-70">U</td></tr>
          <tr><td>lead</td><td class="text-xs opacity-70">CRU</td><td class="text-xs opacity-70">CRU</td><td class="text-xs opacity-70">U</td></tr>
          <tr><td>contributor</td><td class="text-xs opacity-70">R</td><td class="text-xs opacity-70">RU (edit drafts)</td><td class="text-xs opacity-70">—</td></tr>
          <tr><td>viewer</td><td class="text-xs opacity-70">R</td><td class="text-xs opacity-70">R</td><td class="text-xs opacity-70">—</td></tr>
          <tr><td>customer</td><td class="text-xs opacity-70">—</td><td class="text-xs opacity-70">—</td><td class="text-xs opacity-70">—</td></tr>
        </tbody>
      </table>
    </div>
    <p class="text-sm opacity-70 leading-relaxed">
      {@render c('cms_nodes')} covers the site tree and the settings; {@render c('cms_pages')} covers page content. Choosing images also needs {@render c('vault_documents:read')}; uploading needs {@render c('vault_documents:create')} (and {@render c('vault_folders:create')} to create the upload folder).
    </p>
  </div>

  <!-- Audit log -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Audit Log Events</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Event</th><th>Triggered by</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">cms_node.create</td><td class="text-sm opacity-70">A site tree item was added</td></tr>
          <tr><td class="font-mono text-xs">cms_node.update</td><td class="text-sm opacity-70">An item's title, slug, type, menu flag, link or component changed</td></tr>
          <tr><td class="font-mono text-xs">cms_node.move</td><td class="text-sm opacity-70">An item was moved or reordered</td></tr>
          <tr><td class="font-mono text-xs">cms_node.delete</td><td class="text-sm opacity-70">An item (and its page content) was deleted</td></tr>
          <tr><td class="font-mono text-xs">cms_page.update</td><td class="text-sm opacity-70">A page draft was saved</td></tr>
          <tr><td class="font-mono text-xs">cms_node.publish</td><td class="text-sm opacity-70">An item was published (a page's draft became live)</td></tr>
          <tr><td class="font-mono text-xs">cms_node.unpublish</td><td class="text-sm opacity-70">An item was unpublished</td></tr>
          <tr><td class="font-mono text-xs">cms_settings.update</td><td class="text-sm opacity-70">Home page, footer or upload folder changed</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Indexes -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">MongoDB Indexes</h2>
    <pre class="bg-base-300 rounded-box p-4 text-sm overflow-x-auto leading-relaxed"><code>// cms_nodes
&#123; parentId: 1, order: 1 &#125;
&#123; parentId: 1, slug: 1 &#125;   // unique, for string slugs only (links have none)

// cms_pages
&#123; nodeId: 1 &#125;               // unique</code></pre>
  </div>

  <!-- API Reference -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">API Reference</h2>
    <p class="text-sm opacity-70 leading-relaxed">Paths are on the API server; the app reaches them through {@render c('/api/cms/...')}.</p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Endpoint</th><th>Auth</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/cms/nodes</td><td class="text-xs opacity-60">cms_nodes:read</td><td class="text-sm opacity-70">Every item in tree order, each with its computed {@render c('path')}, public {@render c('href')}, {@render c('visible')} and {@render c('isHome')}.</td></tr>
          <tr><td class="font-mono text-xs">POST</td><td class="font-mono text-xs">/cms/nodes</td><td class="text-xs opacity-60">cms_nodes:create</td><td class="text-sm opacity-70">Add an item. Body: {@render c('type, title, slug, showInMenu, component, url, newTab, parentId, index')}. A slug the application uses gets 400; one a sibling already has gets 409.</td></tr>
          <tr><td class="font-mono text-xs">PATCH</td><td class="font-mono text-xs">/cms/nodes/:id</td><td class="text-xs opacity-60">cms_nodes:update</td><td class="text-sm opacity-70">Change an item's fields (not its status). An item with children can't become a link.</td></tr>
          <tr><td class="font-mono text-xs">DELETE</td><td class="font-mono text-xs">/cms/nodes/:id</td><td class="text-xs opacity-60">cms_nodes:delete</td><td class="text-sm opacity-70">Delete an item and its page content. 409 if it has children.</td></tr>
          <tr><td class="font-mono text-xs">POST</td><td class="font-mono text-xs">/cms/nodes/:id/move</td><td class="text-xs opacity-60">cms_nodes:update</td><td class="text-sm opacity-70">Body: {@render c('{ parentId, index }')}. Refuses moves under itself or a descendant, under a link, or next to a sibling with the same slug.</td></tr>
          <tr class="border-t border-base-300"><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/cms/pages/:nodeId</td><td class="text-xs opacity-60">cms_pages:read</td><td class="text-sm opacity-70">The draft, its {@render c('rev')}, status, whether it has unpublished changes, and {@render c('media')} (current URLs of its usable images).</td></tr>
          <tr><td class="font-mono text-xs">PUT</td><td class="font-mono text-xs">/cms/pages/:nodeId/draft</td><td class="text-xs opacity-60">cms_pages:update</td><td class="text-sm opacity-70">Body: {@render c('{ blocks, seo, rev }')}. Sanitized; returns {@render c('{ rev, draft, removed }')}. A stale {@render c('rev')} gets 409 with the current one.</td></tr>
          <tr><td class="font-mono text-xs">POST</td><td class="font-mono text-xs">/cms/pages/:nodeId/publish</td><td class="text-xs opacity-60">cms_publish:update</td><td class="text-sm opacity-70">Publish any item; a page's draft becomes live. Optional {@render c('{ rev }')}. Returns {@render c('{ status, publishedAt, visible, warnings }')}.</td></tr>
          <tr><td class="font-mono text-xs">POST</td><td class="font-mono text-xs">/cms/pages/:nodeId/unpublish</td><td class="text-xs opacity-60">cms_publish:update</td><td class="text-sm opacity-70">Back to draft; warns how many items under it are hidden too.</td></tr>
          <tr><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/cms/pages/:nodeId/preview</td><td class="text-xs opacity-60">cms_pages:read</td><td class="text-sm opacity-70">The same shape as {@render c('resolve')}, built from the draft; links to unpublished pages included.</td></tr>
          <tr class="border-t border-base-300"><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/cms/settings</td><td class="text-xs opacity-60">cms_nodes:read</td><td class="text-sm opacity-70">Home page, footer and upload folder.</td></tr>
          <tr><td class="font-mono text-xs">PATCH</td><td class="font-mono text-xs">/cms/settings</td><td class="text-xs opacity-60">cms_nodes:update</td><td class="text-sm opacity-70">Body: any of {@render c('homeNodeId, footer, mediaFolderId')}.</td></tr>
          <tr class="border-t border-base-300"><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/cms/media</td><td class="text-xs opacity-60">cms_pages:update + vault_documents:read</td><td class="text-sm opacity-70">Vault web images in the caller's workspace. Query: {@render c('folderId')} (an id or {@render c('root')}), {@render c('q')} (name or tag contains), {@render c('skip')}, {@render c('limit')} (1–60, default 24). Returns {@render c('{ available, items, total }')}; {@render c('available: false')} without the Vault.</td></tr>
          <tr><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/cms/media/folders</td><td class="text-xs opacity-60">cms_pages:update + vault_documents:read</td><td class="text-sm opacity-70">Vault folders the caller can see, plus the upload folder's id.</td></tr>
          <tr><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/cms/media/:id</td><td class="text-xs opacity-60">cms_pages:update + vault_documents:read</td><td class="text-sm opacity-70">One image; 404 if it isn't a usable web image.</td></tr>
          <tr class="border-t border-base-300"><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/cms/site/menu</td><td class="text-xs opacity-60">none</td><td class="text-sm opacity-70">The public menu (published items shown in the menu, nested) and the footer.</td></tr>
          <tr><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/cms/site/tree</td><td class="text-xs opacity-60">none</td><td class="text-sm opacity-70">Every public page, component and label, nested, for sitemaps.</td></tr>
          <tr><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/cms/site/resolve?path=</td><td class="text-xs opacity-60">none</td><td class="text-sm opacity-70">A public path's published content: {@render c('{ node, page, media, links, breadcrumbs, rest? }')}, or {@render c('{ redirect }')}, or 404.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

</div>
