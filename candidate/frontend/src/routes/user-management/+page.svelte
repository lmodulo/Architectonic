<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { Search, Pencil, Trash2, X, UserPlus, Plus } from 'lucide-svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import UserNameLink from '$lib/components/UserNameLink.svelte';
  import { hasPermission } from '$lib/permissions';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type User = typeof data.users[0];
  type TeamSummary = typeof data.teams[0];
  type Member = { id: string; username: string; firstName: string; lastName: string; avatarUrl: string; avatarColor: string; email: string };
  type TeamDetail = { id: string; name: string; description: string; members: Member[] };

  const firstTab = data.canReadUsers ? 'users' : data.canReadRoles ? 'roles' : 'teams';
  let activeTab = $state<'users' | 'roles' | 'teams'>(firstTab as 'users' | 'roles' | 'teams');

  // ── Users tab ─────────────────────────────────────────────────────────────
  let users = $state([...data.users]);
  let query = $state('');
  let currentPage = $state(1);
  const PAGE_SIZE = 20;

  const filtered = $derived(
    query.trim()
      ? users.filter((u) => {
          const q = query.toLowerCase();
          return u.username?.toLowerCase().includes(q)
            || u.email?.toLowerCase().includes(q)
            || u.firstName?.toLowerCase().includes(q)
            || u.lastName?.toLowerCase().includes(q);
        })
      : users
  );

  const pageUsers = $derived(filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE));
  $effect(() => { query; currentPage = 1; });

  let newUserOpen = $state(false);
  let newForm     = $state({ firstName: '', lastName: '', username: '', email: '', password: '', confirmPassword: '' });
  let creating    = $state(false);
  let newError    = $state('');

  function openNewUser() {
    newForm  = { firstName: '', lastName: '', username: '', email: '', password: '', confirmPassword: '' };
    newError = '';
    newUserOpen = true;
  }

  async function submitNewUser() {
    if (!newForm.username || !newForm.email || !newForm.password) { newError = 'Username, email, and password are required'; return; }
    if (newForm.password !== newForm.confirmPassword) { newError = 'Passwords do not match'; return; }
    if (newForm.password.length < 8) { newError = 'Password must be at least 8 characters'; return; }
    creating = true; newError = '';
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ firstName: newForm.firstName, lastName: newForm.lastName, username: newForm.username, email: newForm.email, password: newForm.password })
      });
      if (!res.ok) { const body = await res.json().catch(() => ({})); newError = body.message ?? 'Create failed'; return; }
      const created = await res.json();
      users = [{ ...created, createdAt: created.createdAt ?? new Date().toISOString() }, ...users];
      newUserOpen = false;
    } catch { newError = 'Network error'; }
    finally { creating = false; }
  }

  let editTarget = $state<User | null>(null);
  let editForm   = $state({ firstName: '', lastName: '', username: '', email: '' });
  let saving     = $state(false);
  let editError  = $state('');

  function openEdit(user: User) {
    editForm = { firstName: user.firstName ?? '', lastName: user.lastName ?? '', username: user.username, email: user.email };
    editError = ''; editTarget = user;
  }

  async function submitEdit() {
    if (!editTarget) return;
    saving = true; editError = '';
    try {
      const res = await fetch(`/api/users/${editTarget.id}`, {
        method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(editForm)
      });
      if (!res.ok) { const body = await res.json().catch(() => ({})); editError = body.message ?? 'Update failed'; return; }
      users = users.map(u => u.id === editTarget!.id ? { ...u, ...editForm } : u);
      editTarget = null;
    } catch { editError = 'Network error'; }
    finally { saving = false; }
  }

  let deleteTarget = $state<User | null>(null);
  let deleting     = $state(false);
  let deleteError  = $state('');

  function openDelete(user: User) { deleteError = ''; deleteTarget = user; }

  async function confirmDelete() {
    if (!deleteTarget) return;
    deleting = true; deleteError = '';
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) { const body = await res.json().catch(() => ({})); deleteError = body.message ?? 'Delete failed'; return; }
      users = users.filter(u => u.id !== deleteTarget!.id);
      deleteTarget = null;
    } catch { deleteError = 'Network error'; }
    finally { deleting = false; }
  }

  // ── Roles tab ─────────────────────────────────────────────────────────────
  const ACTIONS   = ['create', 'read', 'update', 'delete'] as const;
  const RESOURCES = ['dashboard', 'users', 'roles', 'teams'] as const;

  let openRoles = $state<Set<string>>(new Set([data.roles[0]?.name]));
  function toggleRole(name: string) {
    const next = new Set(openRoles);
    next.has(name) ? next.delete(name) : next.add(name);
    openRoles = next;
  }

  let roleUsers = $state([...data.users]);

  async function assignRole(userId: string, role: string) {
    const res = await fetch(`/api/users/${userId}/role`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ role })
    });
    if (res.ok) {
      roleUsers = roleUsers.map(u => u.id === userId ? { ...u, role } : u);
      users     = users.map(u => u.id === userId ? { ...u, role } : u);
    }
  }

  let userQuery   = $state('');
  let rolesPage   = $state(1);

  const filteredRoleUsers = $derived(
    userQuery.trim()
      ? roleUsers.filter((u) => {
          const q = userQuery.toLowerCase();
          return u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
            || u.firstName?.toLowerCase().includes(q) || u.lastName?.toLowerCase().includes(q);
        })
      : roleUsers
  );

  const pageRoleUsers = $derived(filteredRoleUsers.slice((rolesPage - 1) * PAGE_SIZE, rolesPage * PAGE_SIZE));
  $effect(() => { userQuery; rolesPage = 1; });

  // ── Teams tab ─────────────────────────────────────────────────────────────
  let teams = $state([...data.teams]);
  let teamQuery = $state('');
  let teamsPage = $state(1);

  const filteredTeams = $derived(
    teamQuery.trim()
      ? teams.filter(t => {
          const q = teamQuery.toLowerCase();
          return t.name?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
        })
      : teams
  );
  const pageTeams = $derived(filteredTeams.slice((teamsPage - 1) * PAGE_SIZE, teamsPage * PAGE_SIZE));
  $effect(() => { teamQuery; teamsPage = 1; });

  let expandedTeamId  = $state<string | null>(null);
  let teamDetails     = $state(new Map<string, TeamDetail>());
  let detailLoading   = $state(false);

  async function toggleTeam(id: string) {
    if (expandedTeamId === id) { expandedTeamId = null; return; }
    expandedTeamId = id;
    if (!teamDetails.has(id)) {
      detailLoading = true;
      try {
        const res = await fetch(`/api/teams/${id}`);
        if (res.ok) {
          const detail: TeamDetail = await res.json();
          teamDetails = new Map(teamDetails).set(id, detail);
        }
      } catch { /* silent */ }
      finally { detailLoading = false; }
    }
  }

  // New team
  let newTeamOpen  = $state(false);
  let newTeamForm  = $state({ name: '', description: '' });
  let creatingTeam = $state(false);
  let newTeamError = $state('');

  async function submitNewTeam() {
    if (!newTeamForm.name.trim()) { newTeamError = 'Name is required'; return; }
    creatingTeam = true; newTeamError = '';
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(newTeamForm)
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); newTeamError = b.message ?? 'Create failed'; return; }
      const created = await res.json();
      teams = [created, ...teams];
      newTeamOpen = false;
    } catch { newTeamError = 'Network error'; }
    finally { creatingTeam = false; }
  }

  // Edit team
  let editTeam     = $state<TeamSummary | null>(null);
  let editTeamForm = $state({ name: '', description: '' });
  let savingTeam   = $state(false);
  let editTeamError = $state('');

  function openEditTeam(team: TeamSummary) {
    editTeamForm = { name: team.name, description: team.description ?? '' };
    editTeamError = '';
    editTeam = team;
  }

  async function submitEditTeam() {
    if (!editTeam) return;
    savingTeam = true; editTeamError = '';
    try {
      const res = await fetch(`/api/teams/${editTeam.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(editTeamForm)
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); editTeamError = b.message ?? 'Update failed'; return; }
      const id = editTeam.id;
      teams = teams.map(t => t.id === id ? { ...t, ...editTeamForm } : t);
      if (teamDetails.has(id)) {
        const det = teamDetails.get(id)!;
        teamDetails = new Map(teamDetails).set(id, { ...det, ...editTeamForm });
      }
      editTeam = null;
    } catch { editTeamError = 'Network error'; }
    finally { savingTeam = false; }
  }

  // Delete team
  let deleteTeam     = $state<TeamSummary | null>(null);
  let deletingTeam   = $state(false);
  let deleteTeamError = $state('');

  async function confirmDeleteTeam() {
    if (!deleteTeam) return;
    deletingTeam = true; deleteTeamError = '';
    try {
      const res = await fetch(`/api/teams/${deleteTeam.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) { const b = await res.json().catch(() => ({})); deleteTeamError = b.message ?? 'Delete failed'; return; }
      const id = deleteTeam.id;
      teams = teams.filter(t => t.id !== id);
      if (expandedTeamId === id) expandedTeamId = null;
      deleteTeam = null;
    } catch { deleteTeamError = 'Network error'; }
    finally { deletingTeam = false; }
  }

  // Member management
  let addMemberTeamId = $state<string | null>(null);
  let selectedUserId  = $state('');
  let addingMember    = $state(false);
  let addMemberError  = $state('');

  async function addMember(teamId: string, userId: string) {
    addingMember = true; addMemberError = '';
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); addMemberError = b.message ?? 'Add failed'; return; }
      const detRes = await fetch(`/api/teams/${teamId}`);
      if (detRes.ok) {
        const detail: TeamDetail = await detRes.json();
        teamDetails = new Map(teamDetails).set(teamId, detail);
        teams = teams.map(t => t.id === teamId ? { ...t, memberCount: detail.members.length } : t);
      }
      selectedUserId = '';
      addMemberTeamId = null;
    } catch { addMemberError = 'Network error'; }
    finally { addingMember = false; }
  }

  async function removeMember(teamId: string, userId: string) {
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${userId}`, { method: 'DELETE' });
      if (!res.ok) return;
      const det = teamDetails.get(teamId);
      if (det) {
        const next = { ...det, members: det.members.filter(m => m.id !== userId) };
        teamDetails = new Map(teamDetails).set(teamId, next);
        teams = teams.map(t => t.id === teamId ? { ...t, memberCount: next.members.length } : t);
      }
    } catch { /* silent */ }
  }
</script>

<svelte:head>
  <title>User Management</title>
</svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold">User Management</h1>

  {#if data.error}
    <div role="alert" class="alert alert-error text-sm">{data.error}</div>
  {/if}

  <!-- Tabs -->
  <div class="flex gap-1 border-b border-base-200">
    {#if data.canReadUsers}
      <button type="button"
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent hover:text-base-content'}"
        onclick={() => (activeTab = 'users')}>Users</button>
    {/if}
    {#if data.canReadRoles}
      <button type="button"
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'roles' ? 'border-primary text-primary' : 'border-transparent hover:text-base-content'}"
        onclick={() => (activeTab = 'roles')}>Roles</button>
    {/if}
    {#if data.canReadTeams}
      <button type="button"
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'teams' ? 'border-primary text-primary' : 'border-transparent hover:text-base-content'}"
        onclick={() => (activeTab = 'teams')}>Teams</button>
    {/if}
  </div>

  <!-- Users tab -->
  {#if activeTab === 'users'}
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <label class="input input-bordered flex items-center gap-2 flex-1">
          <Search class="size-4 opacity-50" />
          <input type="search" placeholder="Search by name or email…" class="grow" bind:value={query} />
        </label>
        {#if hasPermission(data.user, 'users', 'create')}
          <button type="button" class="btn btn-primary shrink-0" onclick={openNewUser}>
            <UserPlus class="size-4" /> New User
          </button>
        {/if}
      </div>

      <div class="card bg-base-100 border border-base-200 overflow-hidden">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each pageUsers as user}
              <tr class="hover:bg-base-200/50">
                <td>
                  <div class="font-medium">
                    <UserNameLink user={user} />
                  </div>
                  {#if user.firstName || user.lastName}
                    <div class="text-xs opacity-50">{user.username}</div>
                  {/if}
                </td>
                <td class="opacity-60">{user.email}</td>
                <td><span class="badge badge-primary badge-outline text-xs">{user.role ?? 'viewer'}</span></td>
                <td class="opacity-60">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <div class="flex items-center justify-end gap-1">
                    {#if hasPermission(data.user, 'users', 'update')}
                      <button type="button" class="btn btn-ghost btn-square btn-xs hover:btn-primary"
                        aria-label="Edit {user.username}" onclick={() => openEdit(user)}>
                        <Pencil class="size-3.5" />
                      </button>
                    {/if}
                    {#if hasPermission(data.user, 'users', 'delete')}
                      <button type="button" class="btn btn-ghost btn-square btn-xs hover:btn-error"
                        aria-label="Delete {user.username}" onclick={() => openDelete(user)}>
                        <Trash2 class="size-3.5" />
                      </button>
                    {/if}
                  </div>
                </td>
              </tr>
            {:else}
              <tr><td colspan="5" class="text-center opacity-50 py-8">No users found.</td></tr>
            {/each}
          </tbody>
        </table>

        <div class="flex items-center justify-between px-4 py-2 border-t border-base-200">
          <span class="text-xs opacity-60">
            {filtered.length === 0 ? 'No users' : `${(currentPage-1)*PAGE_SIZE+1}–${Math.min(currentPage*PAGE_SIZE,filtered.length)} of ${filtered.length}`}
          </span>
          <Pagination count={filtered.length} pageSize={PAGE_SIZE} page={currentPage}
            onPageChange={e => (currentPage = e.page)} siblingCount={1} />
        </div>
      </div>
    </div>
  {/if}

  <!-- Roles tab -->
  {#if activeTab === 'roles'}
    <div class="space-y-6">
      <div class="card bg-base-100 border border-base-200 divide-y divide-base-200 overflow-hidden">
        {#each data.roles as role}
          {@const open = openRoles.has(role.name)}
          <button type="button"
            class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-base-200/50 transition-colors"
            onclick={() => toggleRole(role.name)} aria-expanded={open}>
            <div>
              <span class="font-semibold">{role.label}</span>
              <span class="ml-2 text-xs opacity-50">{role.name}</span>
            </div>
            <svg class="size-4 opacity-40 transition-transform duration-200 {open ? 'rotate-180' : ''}"
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06z" clip-rule="evenodd"/>
            </svg>
          </button>

          {#if open}
            <div class="px-4 py-4 bg-base-200/30">
              <div class="grid gap-x-4 gap-y-3" style="grid-template-columns: minmax(7rem,1fr) repeat(4, 2.5rem);">
                <div class="text-xs font-semibold opacity-50 uppercase tracking-wide">Resource</div>
                {#each ACTIONS as action}
                  <div class="text-xs font-semibold opacity-50 uppercase tracking-wide text-center">{action[0].toUpperCase()}</div>
                {/each}
                {#each RESOURCES as resource}
                  <div class="flex items-center text-sm capitalize font-medium">{resource}</div>
                  {#each ACTIONS as action}
                    <div class="flex items-center justify-center">
                      <span class="inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold
                        {role.permissions?.[resource]?.[action] ? 'bg-success text-success-content' : 'bg-base-300 opacity-40'}">
                        {action[0].toUpperCase()}
                      </span>
                    </div>
                  {/each}
                {/each}
              </div>
              <p class="mt-3 text-xs opacity-40">C = create &nbsp; R = read &nbsp; U = update &nbsp; D = delete</p>
            </div>
          {/if}
        {:else}
          <div class="px-4 py-8 text-center opacity-50 text-sm">No roles found.</div>
        {/each}
      </div>

      {#if data.canAssign && roleUsers.length > 0}
        <div class="space-y-3">
          <h2 class="text-lg font-semibold">User Assignments</h2>

          <label class="input input-bordered flex items-center gap-2">
            <Search class="size-4 opacity-50" />
            <input type="search" placeholder="Search by name or email…" class="grow" bind:value={userQuery} />
          </label>

          <div class="card bg-base-100 border border-base-200 overflow-hidden">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {#each pageRoleUsers as user}
                  <tr class="hover:bg-base-200/50">
                    <td>
                      <div class="font-medium"><UserNameLink user={user} /></div>
                      {#if user.firstName || user.lastName}
                        <div class="text-xs opacity-50">{user.username}</div>
                      {/if}
                    </td>
                    <td class="opacity-60">{user.email}</td>
                    <td>
                      <select class="select select-bordered select-xs"
                        value={user.role ?? 'viewer'}
                        onchange={(e) => assignRole(user.id, (e.currentTarget as HTMLSelectElement).value)}>
                        {#each data.roles as role}
                          <option value={role.name}>{role.label}</option>
                        {/each}
                      </select>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>

            <div class="flex items-center justify-between px-4 py-2 border-t border-base-200">
              <span class="text-xs opacity-60">
                {filteredRoleUsers.length === 0 ? 'No users' : `${(rolesPage-1)*PAGE_SIZE+1}–${Math.min(rolesPage*PAGE_SIZE,filteredRoleUsers.length)} of ${filteredRoleUsers.length}`}
              </span>
              <Pagination count={filteredRoleUsers.length} pageSize={PAGE_SIZE} page={rolesPage}
                onPageChange={e => (rolesPage = e.page)} siblingCount={1} />
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Teams tab -->
  {#if activeTab === 'teams'}
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <label class="input input-bordered flex items-center gap-2 flex-1">
          <Search class="size-4 opacity-50" />
          <input type="search" placeholder="Search teams…" class="grow" bind:value={teamQuery} />
        </label>
        {#if data.canCreateTeam}
          <button type="button" class="btn btn-primary shrink-0"
            onclick={() => { newTeamForm = { name: '', description: '' }; newTeamError = ''; newTeamOpen = true; }}>
            <Plus class="size-4" /> New Team
          </button>
        {/if}
      </div>

      <div class="card bg-base-100 border border-base-200 divide-y divide-base-200 overflow-hidden">
        {#each pageTeams as team}
          {@const expanded = expandedTeamId === team.id}
          {@const detail = teamDetails.get(team.id)}
          <div>
            <div class="flex items-center gap-2 px-4 py-3 hover:bg-base-200/50 transition-colors">
              <button type="button" class="flex-1 flex items-center gap-3 text-left min-w-0"
                onclick={() => toggleTeam(team.id)}>
                <svg class="size-4 opacity-40 transition-transform duration-200 shrink-0 {expanded ? 'rotate-90' : ''}"
                  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02z" clip-rule="evenodd" />
                </svg>
                <div class="min-w-0">
                  <span class="font-semibold">{team.name}</span>
                  {#if team.description}
                    <span class="ml-2 text-sm opacity-50 truncate">{team.description}</span>
                  {/if}
                </div>
                <span class="badge badge-ghost text-xs ml-auto shrink-0">
                  {team.memberCount ?? 0} {(team.memberCount ?? 0) === 1 ? 'member' : 'members'}
                </span>
              </button>
              <div class="flex items-center gap-1 shrink-0">
                {#if data.canUpdateTeam}
                  <button type="button" class="btn btn-ghost btn-square btn-xs hover:btn-primary"
                    aria-label="Edit {team.name}" onclick={() => openEditTeam(team)}>
                    <Pencil class="size-3.5" />
                  </button>
                {/if}
                {#if data.canDeleteTeam}
                  <button type="button" class="btn btn-ghost btn-square btn-xs hover:btn-error"
                    aria-label="Delete {team.name}" onclick={() => { deleteTeamError = ''; deleteTeam = team; }}>
                    <Trash2 class="size-3.5" />
                  </button>
                {/if}
              </div>
            </div>

            {#if expanded}
              <div class="px-4 py-4 bg-base-200/30 space-y-3">
                {#if detailLoading && !detail}
                  <p class="text-sm opacity-50">Loading…</p>
                {:else if detail}
                  {#if detail.members.length > 0}
                    <ul class="space-y-2">
                      {#each detail.members as member}
                        <li class="flex items-center gap-3">
                          <Avatar user={member} size="sm" />
                          <div class="flex-1 min-w-0">
                            <div class="text-sm font-medium truncate">
                              <UserNameLink user={member} />
                            </div>
                            <div class="text-xs opacity-50">{member.username}</div>
                          </div>
                          {#if data.canUpdateTeam}
                            <button type="button" class="btn btn-ghost btn-square btn-xs hover:btn-error shrink-0"
                              aria-label="Remove {member.username}" onclick={() => removeMember(team.id, member.id)}>
                              <X class="size-3.5" />
                            </button>
                          {/if}
                        </li>
                      {/each}
                    </ul>
                  {:else}
                    <p class="text-sm opacity-50">No members yet.</p>
                  {/if}

                  {#if data.canUpdateTeam}
                    {#if addMemberTeamId === team.id}
                      <div class="space-y-2 pt-1">
                        <div class="flex items-center gap-2">
                          <select class="select select-bordered select-sm flex-1" bind:value={selectedUserId}>
                            <option value="">Select a user…</option>
                            {#each data.users.filter(u => !detail.members.some(m => m.id === u.id)) as u}
                              <option value={u.id}>
                                {[u.firstName, u.lastName].filter(Boolean).join(' ') || u.username} ({u.email})
                              </option>
                            {/each}
                          </select>
                          <button type="button" class="btn btn-primary btn-sm shrink-0"
                            disabled={!selectedUserId || addingMember}
                            onclick={() => addMember(team.id, selectedUserId)}>
                            {addingMember ? 'Adding…' : 'Add'}
                          </button>
                          <button type="button" class="btn btn-ghost btn-sm shrink-0"
                            onclick={() => { addMemberTeamId = null; selectedUserId = ''; addMemberError = ''; }}>
                            Cancel
                          </button>
                        </div>
                        {#if addMemberError}
                          <p class="text-xs text-error">{addMemberError}</p>
                        {/if}
                      </div>
                    {:else}
                      <button type="button" class="btn btn-ghost btn-sm"
                        onclick={() => { addMemberTeamId = team.id; selectedUserId = ''; addMemberError = ''; }}>
                        <UserPlus class="size-4" /> Add Member
                      </button>
                    {/if}
                  {/if}
                {/if}
              </div>
            {/if}
          </div>
        {:else}
          <div class="px-4 py-8 text-center opacity-50 text-sm">No teams found.</div>
        {/each}
      </div>

      <div class="flex items-center justify-between">
        <span class="text-xs opacity-60">
          {filteredTeams.length === 0 ? 'No teams' : `${(teamsPage-1)*PAGE_SIZE+1}–${Math.min(teamsPage*PAGE_SIZE,filteredTeams.length)} of ${filteredTeams.length}`}
        </span>
        <Pagination count={filteredTeams.length} pageSize={PAGE_SIZE} page={teamsPage}
          onPageChange={e => (teamsPage = e.page)} siblingCount={1} />
      </div>
    </div>
  {/if}
</div>

<!-- New User modal -->
{#if newUserOpen}
  <div transition:fade={{ duration: 200 }} class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }} class="card bg-base-100 w-full max-w-md shadow-xl">
      <div class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-200">
        <h2 class="text-lg font-semibold">New User</h2>
        <button type="button" class="btn btn-ghost btn-square btn-sm" onclick={() => (newUserOpen = false)}><X class="size-5" /></button>
      </div>
      <div class="p-6 space-y-4">
        {#if newError}<div role="alert" class="alert alert-error text-sm">{newError}</div>{/if}
        <div class="grid grid-cols-2 gap-4">
          <div class="form-control gap-1">
            <span class="label-text font-medium">First Name</span>
            <input type="text" class="input input-bordered" bind:value={newForm.firstName} maxlength="50" placeholder="Jane" />
          </div>
          <div class="form-control gap-1">
            <span class="label-text font-medium">Last Name</span>
            <input type="text" class="input input-bordered" bind:value={newForm.lastName} maxlength="50" placeholder="Doe" />
          </div>
        </div>
        <div class="form-control gap-1">
          <span class="label-text font-medium">Username <span class="text-error">*</span></span>
          <input type="text" class="input input-bordered" bind:value={newForm.username} minlength="2" maxlength="50" placeholder="johndoe" />
        </div>
        <div class="form-control gap-1">
          <span class="label-text font-medium">Email <span class="text-error">*</span></span>
          <input type="email" class="input input-bordered" bind:value={newForm.email} placeholder="you@example.com" />
        </div>
        <div class="form-control gap-1">
          <span class="label-text font-medium">Password <span class="text-error">*</span></span>
          <input type="password" class="input input-bordered" bind:value={newForm.password} minlength="8" placeholder="Min. 8 characters" />
        </div>
        <div class="form-control gap-1">
          <span class="label-text font-medium">Confirm Password <span class="text-error">*</span></span>
          <input type="password" class="input input-bordered" bind:value={newForm.confirmPassword} minlength="8" placeholder="••••••••" />
        </div>
      </div>
      <div class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn btn-ghost" onclick={() => (newUserOpen = false)}>Cancel</button>
        <button type="button" class="btn btn-primary" disabled={creating} onclick={submitNewUser}>
          {creating ? 'Creating…' : 'Create User'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Edit User modal -->
{#if editTarget}
  <div transition:fade={{ duration: 200 }} class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }} class="card bg-base-100 w-full max-w-md shadow-xl">
      <div class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-200">
        <h2 class="text-lg font-semibold">Edit User</h2>
        <button type="button" class="btn btn-ghost btn-square btn-sm" onclick={() => (editTarget = null)}><X class="size-5" /></button>
      </div>
      <div class="p-6 space-y-4">
        {#if editError}<div role="alert" class="alert alert-error text-sm">{editError}</div>{/if}
        <div class="grid grid-cols-2 gap-4">
          <div class="form-control gap-1">
            <span class="label-text font-medium">First Name</span>
            <input type="text" class="input input-bordered" bind:value={editForm.firstName} maxlength="50" />
          </div>
          <div class="form-control gap-1">
            <span class="label-text font-medium">Last Name</span>
            <input type="text" class="input input-bordered" bind:value={editForm.lastName} maxlength="50" />
          </div>
        </div>
        <div class="form-control gap-1">
          <span class="label-text font-medium">Username</span>
          <input type="text" class="input input-bordered" bind:value={editForm.username} minlength="2" maxlength="50" required />
        </div>
        <div class="form-control gap-1">
          <span class="label-text font-medium">Email</span>
          <input type="email" class="input input-bordered" bind:value={editForm.email} required />
        </div>
      </div>
      <div class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn btn-ghost" onclick={() => (editTarget = null)}>Cancel</button>
        <button type="button" class="btn btn-primary" disabled={saving} onclick={submitEdit}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Delete User modal -->
{#if deleteTarget}
  <div transition:fade={{ duration: 200 }} class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }} class="card bg-base-100 w-full max-w-sm shadow-xl">
      <div class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-200">
        <h2 class="text-lg font-semibold">Delete User</h2>
        <button type="button" class="btn btn-ghost btn-square btn-sm" onclick={() => (deleteTarget = null)}><X class="size-5" /></button>
      </div>
      <div class="p-6 space-y-3">
        {#if deleteError}<div role="alert" class="alert alert-error text-sm">{deleteError}</div>{/if}
        <p class="text-sm">Are you sure you want to delete <span class="font-semibold">{deleteTarget.username}</span>? This action cannot be undone.</p>
      </div>
      <div class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn btn-ghost" onclick={() => (deleteTarget = null)}>Cancel</button>
        <button type="button" class="btn btn-error" disabled={deleting} onclick={confirmDelete}>
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- New Team modal -->
{#if newTeamOpen}
  <div transition:fade={{ duration: 200 }} class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }} class="card bg-base-100 w-full max-w-md shadow-xl">
      <div class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-200">
        <h2 class="text-lg font-semibold">New Team</h2>
        <button type="button" class="btn btn-ghost btn-square btn-sm" onclick={() => (newTeamOpen = false)}><X class="size-5" /></button>
      </div>
      <div class="p-6 space-y-4">
        {#if newTeamError}<div role="alert" class="alert alert-error text-sm">{newTeamError}</div>{/if}
        <div class="form-control gap-1">
          <span class="label-text font-medium">Name <span class="text-error">*</span></span>
          <input type="text" class="input input-bordered" bind:value={newTeamForm.name} maxlength="100" placeholder="Engineering" />
        </div>
        <div class="form-control gap-1">
          <span class="label-text font-medium">Description</span>
          <textarea class="textarea textarea-bordered" bind:value={newTeamForm.description} maxlength="500" rows="2" placeholder="Optional description"></textarea>
        </div>
      </div>
      <div class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn btn-ghost" onclick={() => (newTeamOpen = false)}>Cancel</button>
        <button type="button" class="btn btn-primary" disabled={creatingTeam} onclick={submitNewTeam}>
          {creatingTeam ? 'Creating…' : 'Create Team'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Edit Team modal -->
{#if editTeam}
  <div transition:fade={{ duration: 200 }} class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }} class="card bg-base-100 w-full max-w-md shadow-xl">
      <div class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-200">
        <h2 class="text-lg font-semibold">Edit Team</h2>
        <button type="button" class="btn btn-ghost btn-square btn-sm" onclick={() => (editTeam = null)}><X class="size-5" /></button>
      </div>
      <div class="p-6 space-y-4">
        {#if editTeamError}<div role="alert" class="alert alert-error text-sm">{editTeamError}</div>{/if}
        <div class="form-control gap-1">
          <span class="label-text font-medium">Name <span class="text-error">*</span></span>
          <input type="text" class="input input-bordered" bind:value={editTeamForm.name} maxlength="100" />
        </div>
        <div class="form-control gap-1">
          <span class="label-text font-medium">Description</span>
          <textarea class="textarea textarea-bordered" bind:value={editTeamForm.description} maxlength="500" rows="2"></textarea>
        </div>
      </div>
      <div class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn btn-ghost" onclick={() => (editTeam = null)}>Cancel</button>
        <button type="button" class="btn btn-primary" disabled={savingTeam} onclick={submitEditTeam}>
          {savingTeam ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Delete Team modal -->
{#if deleteTeam}
  <div transition:fade={{ duration: 200 }} class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div transition:scale={{ duration: 300, start: 0.95, easing: cubicOut }} class="card bg-base-100 w-full max-w-sm shadow-xl">
      <div class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-200">
        <h2 class="text-lg font-semibold">Delete Team</h2>
        <button type="button" class="btn btn-ghost btn-square btn-sm" onclick={() => (deleteTeam = null)}><X class="size-5" /></button>
      </div>
      <div class="p-6 space-y-3">
        {#if deleteTeamError}<div role="alert" class="alert alert-error text-sm">{deleteTeamError}</div>{/if}
        <p class="text-sm">Are you sure you want to delete <span class="font-semibold">{deleteTeam.name}</span>? This action cannot be undone.</p>
      </div>
      <div class="flex justify-end gap-3 px-6 pb-5">
        <button type="button" class="btn btn-ghost" onclick={() => (deleteTeam = null)}>Cancel</button>
        <button type="button" class="btn btn-error" disabled={deletingTeam} onclick={confirmDeleteTeam}>
          {deletingTeam ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
{/if}
