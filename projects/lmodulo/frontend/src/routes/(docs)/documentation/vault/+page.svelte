<svelte:head>
  <title>Vault — lmodulo Documentation</title>
</svelte:head>

<div class="space-y-10">

  <div class="space-y-3">
    <h1 class="text-3xl font-bold">Vault</h1>
    <p class="text-base opacity-70 leading-relaxed">
      The Vault is a document library for storing and distributing SOPs, policies, handbooks, certificates, and any other reference files. Documents are organised in a nested folder tree, versioned over time, and exposed to different audiences through three visibility tiers. Staff manage the full library at <code class="bg-base-300 px-1 rounded text-xs">/vault</code>; customers see only their subset at <code class="bg-base-300 px-1 rounded text-xs">/client-portal/vault</code>.
    </p>
  </div>

  <!-- Data Model -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Data Model</h2>
    <pre class="bg-base-300 rounded-box p-4 text-sm overflow-x-auto leading-relaxed"><code>vault_folders               ← nested folder tree (flat list, tree built client-side)
vault_documents             ← document metadata + pointer to current version
vault_document_versions     ← one record per uploaded file; full history retained</code></pre>
  </div>

  <!-- vault_folders -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">vault_folders</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Field</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">workspaceId</td><td class="text-xs opacity-60">ObjectId ref</td><td class="text-sm opacity-70">Multi-tenant scope</td></tr>
          <tr><td class="font-mono text-xs">name</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Display name, max 200 characters</td></tr>
          <tr><td class="font-mono text-xs">parentId</td><td class="text-xs opacity-60">ObjectId ref | null</td><td class="text-sm opacity-70"><code class="bg-base-300 px-1 rounded text-xs">null</code> = root-level folder; otherwise references the parent folder</td></tr>
          <tr><td class="font-mono text-xs">visibility</td><td class="text-xs opacity-60">staff | admin_only | customer</td><td class="text-sm opacity-70">Who can see this folder (see Visibility Tiers)</td></tr>
          <tr><td class="font-mono text-xs">ownerId</td><td class="text-xs opacity-60">ObjectId ref</td><td class="text-sm opacity-70">Staff member responsible; defaults to the creating user</td></tr>
          <tr><td class="font-mono text-xs">createdAt</td><td class="text-xs opacity-60">date</td><td class="text-sm opacity-70"></td></tr>
          <tr><td class="font-mono text-xs">updatedAt</td><td class="text-xs opacity-60">date</td><td class="text-sm opacity-70"></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- vault_documents -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">vault_documents</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Field</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">workspaceId</td><td class="text-xs opacity-60">ObjectId ref</td><td class="text-sm opacity-70">Multi-tenant scope</td></tr>
          <tr><td class="font-mono text-xs">folderId</td><td class="text-xs opacity-60">ObjectId ref | null</td><td class="text-sm opacity-70"><code class="bg-base-300 px-1 rounded text-xs">null</code> = root (no folder)</td></tr>
          <tr><td class="font-mono text-xs">name</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Display name; defaults to the uploaded filename if omitted</td></tr>
          <tr><td class="font-mono text-xs">description</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Optional summary shown on the document detail page</td></tr>
          <tr><td class="font-mono text-xs">visibility</td><td class="text-xs opacity-60">staff | admin_only | customer</td><td class="text-sm opacity-70">Audience; enforced on every read at the API layer</td></tr>
          <tr><td class="font-mono text-xs">ownerId</td><td class="text-xs opacity-60">ObjectId ref</td><td class="text-sm opacity-70">Responsible staff member</td></tr>
          <tr><td class="font-mono text-xs">currentVersionId</td><td class="text-xs opacity-60">ObjectId ref | null</td><td class="text-sm opacity-70">Points to the active <code class="bg-base-300 px-1 rounded text-xs">vault_document_versions</code> record; promotable via PATCH</td></tr>
          <tr><td class="font-mono text-xs">tags</td><td class="text-xs opacity-60">string[]</td><td class="text-sm opacity-70">Free-form tags; used for filtering and full-text search</td></tr>
          <tr><td class="font-mono text-xs">createdAt</td><td class="text-xs opacity-60">date</td><td class="text-sm opacity-70"></td></tr>
          <tr><td class="font-mono text-xs">updatedAt</td><td class="text-xs opacity-60">date</td><td class="text-sm opacity-70">Updated on metadata edits and new-version uploads</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- vault_document_versions -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">vault_document_versions</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Every upload creates a new version record. Older versions are retained indefinitely; the current version is the one pointed to by <code class="bg-base-300 px-1 rounded text-xs">vault_documents.currentVersionId</code>. Staff can roll back to any previous version by PATCHing <code class="bg-base-300 px-1 rounded text-xs">currentVersionId</code>.
    </p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Field</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">workspaceId</td><td class="text-xs opacity-60">ObjectId ref</td><td class="text-sm opacity-70">Multi-tenant scope</td></tr>
          <tr><td class="font-mono text-xs">documentId</td><td class="text-xs opacity-60">ObjectId ref</td><td class="text-sm opacity-70">Parent document</td></tr>
          <tr><td class="font-mono text-xs">versionNumber</td><td class="text-xs opacity-60">integer</td><td class="text-sm opacity-70">Auto-incremented per document starting at 1</td></tr>
          <tr><td class="font-mono text-xs">storageKey</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Storage path: <code class="bg-base-300 px-1 rounded text-xs">vault/&#123;workspaceId&#125;/&#123;documentId&#125;</code></td></tr>
          <tr><td class="font-mono text-xs">url</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Accessible URL returned by the storage backend</td></tr>
          <tr><td class="font-mono text-xs">mimetype</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">e.g. <code class="bg-base-300 px-1 rounded text-xs">application/pdf</code>, <code class="bg-base-300 px-1 rounded text-xs">image/png</code></td></tr>
          <tr><td class="font-mono text-xs">size</td><td class="text-xs opacity-60">integer (bytes)</td><td class="text-sm opacity-70">File size in bytes</td></tr>
          <tr><td class="font-mono text-xs">originalName</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Original filename as uploaded</td></tr>
          <tr><td class="font-mono text-xs">uploadedBy</td><td class="text-xs opacity-60">ObjectId ref</td><td class="text-sm opacity-70">User who uploaded this version</td></tr>
          <tr><td class="font-mono text-xs">note</td><td class="text-xs opacity-60">string</td><td class="text-sm opacity-70">Optional change note, e.g. "Updated Q3 figures"</td></tr>
          <tr><td class="font-mono text-xs">createdAt</td><td class="text-xs opacity-60">date</td><td class="text-sm opacity-70"></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Visibility tiers -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Visibility Tiers</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      Visibility is enforced by the API on every list and get request — clients never receive documents outside their tier. It applies to both folders and documents independently.
    </p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Value</th><th>Who can see</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">staff</td><td class="text-sm opacity-70">All authenticated staff (owner, admin, lead, contributor, viewer) — customers cannot see these</td></tr>
          <tr><td class="font-mono text-xs">admin_only</td><td class="text-sm opacity-70">Owner and admin roles only</td></tr>
          <tr><td class="font-mono text-xs">customer</td><td class="text-sm opacity-70">Customers via the client portal, and all staff roles</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Storage -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Storage Backends</h2>
    <p class="text-sm opacity-70 leading-relaxed">
      File storage is abstracted behind a <code class="bg-base-300 px-1 rounded text-xs">storage</code> helper. Select the backend with the <code class="bg-base-300 px-1 rounded text-xs">STORAGE_PROVIDER</code> environment variable.
    </p>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Provider</th><th>Env var</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">local</td><td class="font-mono text-xs">STORAGE_PROVIDER=local</td><td class="text-sm opacity-70">Default. Files written to <code class="bg-base-300 px-1 rounded text-xs">/app/uploads/vault/</code> inside the API container.</td></tr>
          <tr><td class="font-mono text-xs">s3</td><td class="font-mono text-xs">STORAGE_PROVIDER=s3</td><td class="text-sm opacity-70">Requires <code class="bg-base-300 px-1 rounded text-xs">AWS_BUCKET</code>, <code class="bg-base-300 px-1 rounded text-xs">AWS_REGION</code>, <code class="bg-base-300 px-1 rounded text-xs">AWS_ACCESS_KEY_ID</code>, <code class="bg-base-300 px-1 rounded text-xs">AWS_SECRET_ACCESS_KEY</code>. Compatible with any S3-compatible service (MinIO, Cloudflare R2, etc.).</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Frontend views -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Frontend Views</h2>
    <div class="space-y-3">
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">Vault library <code class="bg-base-300 px-1 rounded text-xs">/vault</code></p>
        <p class="text-sm opacity-60 leading-relaxed">Two-panel layout: collapsible folder tree on the left (root + one level of subfolders, expandable with a chevron) and a paginated document table on the right. Clicking a folder filters the table. "All Documents" resets the filter. Search bar filters by name and tags client-side. Upload button opens a modal for file + metadata; New Folder button opens a create modal. Row-level delete is gated by <code class="bg-base-300 px-1 rounded text-xs">vault_documents:delete</code>. Clicking a row navigates to the document detail page.</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">Document detail <code class="bg-base-300 px-1 rounded text-xs">/vault/[docId]</code></p>
        <p class="text-sm opacity-60 leading-relaxed">Split layout: file preview area (left) + metadata and version history sidebar (right). Images render inline; PDFs render in an <code class="bg-base-300 px-1 rounded text-xs">&lt;iframe&gt;</code>; all other types show a download prompt. The version history card lists all versions newest-first; the current version is highlighted with a "current" badge. Staff with <code class="bg-base-300 px-1 rounded text-xs">vault_documents:update</code> can promote any past version to current, or upload a new version. The Edit button opens a metadata modal (name, description, visibility, folder, owner, tags).</p>
      </div>
      <div class="card bg-base-200 border border-base-300 rounded-box p-4 space-y-1">
        <p class="text-sm font-semibold">Client portal <code class="bg-base-300 px-1 rounded text-xs">/client-portal/vault</code></p>
        <p class="text-sm opacity-60 leading-relaxed">Read-only view for customers. Shows only documents with <code class="bg-base-300 px-1 rounded text-xs">visibility: 'customer'</code>. Name, folder, date, and a Download button per row. Search by name or tag. No upload, folder management, or version history exposed.</p>
      </div>
    </div>
  </div>

  <!-- API Reference -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">API Reference</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Method</th><th>Endpoint</th><th>Auth</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/vault/folders</td><td class="text-xs opacity-60">vault_folders:read</td><td class="text-sm opacity-70">List all folders for the workspace (visibility-filtered). Query: <code class="bg-base-300 px-1 rounded text-xs">parentId</code>.</td></tr>
          <tr><td class="font-mono text-xs">POST</td><td class="font-mono text-xs">/vault/folders</td><td class="text-xs opacity-60">vault_folders:create</td><td class="text-sm opacity-70">Create a folder. Body: <code class="bg-base-300 px-1 rounded text-xs">name, visibility, parentId?</code></td></tr>
          <tr><td class="font-mono text-xs">PATCH</td><td class="font-mono text-xs">/vault/folders/:id</td><td class="text-xs opacity-60">vault_folders:update</td><td class="text-sm opacity-70">Update name, visibility, parentId, or ownerId.</td></tr>
          <tr><td class="font-mono text-xs">DELETE</td><td class="font-mono text-xs">/vault/folders/:id</td><td class="text-xs opacity-60">vault_folders:delete</td><td class="text-sm opacity-70">Delete folder. Returns 409 if it contains documents or subfolders.</td></tr>
          <tr class="border-t border-base-300"><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/vault/documents</td><td class="text-xs opacity-60">vault_documents:read</td><td class="text-sm opacity-70">List documents with pagination. Query: <code class="bg-base-300 px-1 rounded text-xs">folderId</code>, <code class="bg-base-300 px-1 rounded text-xs">q</code> (text search), <code class="bg-base-300 px-1 rounded text-xs">tags</code> (comma-separated), <code class="bg-base-300 px-1 rounded text-xs">visibility</code>, <code class="bg-base-300 px-1 rounded text-xs">limit</code> (max 100), <code class="bg-base-300 px-1 rounded text-xs">skip</code>. Returns <code class="bg-base-300 px-1 rounded text-xs">&#123; documents, total, skip, limit &#125;</code>.</td></tr>
          <tr><td class="font-mono text-xs">POST</td><td class="font-mono text-xs">/vault/documents</td><td class="text-xs opacity-60">vault_documents:create</td><td class="text-sm opacity-70">Upload a document. Multipart: <code class="bg-base-300 px-1 rounded text-xs">file</code> (required) + fields <code class="bg-base-300 px-1 rounded text-xs">name, description, visibility, folderId, ownerId, tags, note</code>. Returns <code class="bg-base-300 px-1 rounded text-xs">&#123; id &#125;</code>.</td></tr>
          <tr><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/vault/documents/:id</td><td class="text-xs opacity-60">vault_documents:read</td><td class="text-sm opacity-70">Get a single document (visibility-checked).</td></tr>
          <tr><td class="font-mono text-xs">PATCH</td><td class="font-mono text-xs">/vault/documents/:id</td><td class="text-xs opacity-60">vault_documents:update</td><td class="text-sm opacity-70">Update metadata. Body fields: <code class="bg-base-300 px-1 rounded text-xs">name, description, visibility, ownerId, folderId, tags, currentVersionId</code>. Pass <code class="bg-base-300 px-1 rounded text-xs">currentVersionId</code> to promote a previous version.</td></tr>
          <tr><td class="font-mono text-xs">DELETE</td><td class="font-mono text-xs">/vault/documents/:id</td><td class="text-xs opacity-60">vault_documents:delete</td><td class="text-sm opacity-70">Delete document and all stored files (all versions removed from storage).</td></tr>
          <tr><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/vault/documents/:id/file</td><td class="text-xs opacity-60">vault_documents:read</td><td class="text-sm opacity-70">Returns <code class="bg-base-300 px-1 rounded text-xs">&#123; url, mimetype, originalName &#125;</code> for the current version. Use this URL to display or download the file.</td></tr>
          <tr><td class="font-mono text-xs">GET</td><td class="font-mono text-xs">/vault/documents/:id/versions</td><td class="text-xs opacity-60">vault_documents:read</td><td class="text-sm opacity-70">Returns <code class="bg-base-300 px-1 rounded text-xs">&#123; currentVersionId, versions[] &#125;</code> sorted newest-first.</td></tr>
          <tr><td class="font-mono text-xs">POST</td><td class="font-mono text-xs">/vault/documents/:id/versions</td><td class="text-xs opacity-60">vault_documents:update</td><td class="text-sm opacity-70">Upload a new version. Multipart: <code class="bg-base-300 px-1 rounded text-xs">file</code> (required) + <code class="bg-base-300 px-1 rounded text-xs">note</code> (optional). Automatically becomes the current version. Returns <code class="bg-base-300 px-1 rounded text-xs">&#123; id, versionNumber &#125;</code>.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Permissions -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Permissions</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Role</th><th>vault_documents</th><th>vault_folders</th></tr></thead>
        <tbody>
          <tr><td>owner / admin</td><td class="text-xs opacity-70">CRUD</td><td class="text-xs opacity-70">CRUD</td></tr>
          <tr><td>lead</td><td class="text-xs opacity-70">CRU</td><td class="text-xs opacity-70">CRU</td></tr>
          <tr><td>contributor</td><td class="text-xs opacity-70">CR</td><td class="text-xs opacity-70">R</td></tr>
          <tr><td>viewer</td><td class="text-xs opacity-70">R</td><td class="text-xs opacity-70">R</td></tr>
          <tr><td>customer</td><td class="text-xs opacity-70">R (customer-visible only)</td><td class="text-xs opacity-70">R (customer-visible only)</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Audit log -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Audit Log Events</h2>
    <div class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead><tr class="bg-base-200"><th>Event</th><th>Triggered by</th></tr></thead>
        <tbody>
          <tr><td class="font-mono text-xs">vault_document.upload</td><td class="text-sm opacity-70">New document uploaded (<code class="bg-base-300 px-1 rounded text-xs">POST /vault/documents</code>)</td></tr>
          <tr><td class="font-mono text-xs">vault_document.update</td><td class="text-sm opacity-70">Metadata updated (<code class="bg-base-300 px-1 rounded text-xs">PATCH /vault/documents/:id</code>)</td></tr>
          <tr><td class="font-mono text-xs">vault_document.delete</td><td class="text-sm opacity-70">Document and all versions deleted</td></tr>
          <tr><td class="font-mono text-xs">vault_document.version_upload</td><td class="text-sm opacity-70">New version uploaded (<code class="bg-base-300 px-1 rounded text-xs">POST /vault/documents/:id/versions</code>)</td></tr>
          <tr><td class="font-mono text-xs">vault_folder.create</td><td class="text-sm opacity-70">Folder created</td></tr>
          <tr><td class="font-mono text-xs">vault_folder.update</td><td class="text-sm opacity-70">Folder renamed, moved, or visibility changed</td></tr>
          <tr><td class="font-mono text-xs">vault_folder.delete</td><td class="text-sm opacity-70">Folder deleted</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- MongoDB Indexes -->
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">MongoDB Indexes</h2>
    <pre class="bg-base-300 rounded-box p-4 text-sm overflow-x-auto leading-relaxed"><code>// vault_folders
&#123; workspaceId: 1, parentId: 1 &#125;
&#123; workspaceId: 1, name: 1 &#125;

// vault_documents
&#123; workspaceId: 1, folderId: 1, createdAt: -1 &#125;
&#123; workspaceId: 1, visibility: 1, createdAt: -1 &#125;
&#123; name: 'text', tags: 'text' &#125;    // weights: name ×2, tags ×1

// vault_document_versions
&#123; workspaceId: 1, documentId: 1, versionNumber: -1 &#125;</code></pre>
  </div>

</div>
