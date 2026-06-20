<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { Search, Pencil, Trash2, X, UserPlus, Plus, ChevronUp, ChevronDown, ChevronsUpDown, Users } from 'lucide-svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { hasPermission } from '$lib/permissions';
  import { dragScroll } from '$lib/actions/dragScroll';
  import Avatar from '$lib/components/Avatar.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import UserSelect from '$lib/components/UserSelect.svelte';
  import type { PageData } from './$types';
  import { m } from '$lib/paraglide/messages.js';

  let { data }: { data: PageData } = $props();

  type User = typeof data.users[0];
  type TeamSummary = typeof data.teams[0];
  type Member = { id: string; username: string; firstName: string; lastName: string; avatarUrl: string; avatarColor: string; email: string };
  type TeamDetail = { id: string; name: string; description: string; members: Member[] };

  const VALID_TABS = ['users', 'roles', 'teams'] as const;
  type Tab = typeof VALID_TABS[number];

  const firstTab = (data.canReadUsers ? 'users' : data.canReadRoles ? 'roles' : 'teams') as Tab;
  const activeTab = $derived.by<Tab>(() => {
    const p = page.url.searchParams.get('tab') as Tab | null;
    return p && VALID_TABS.includes(p) ? p : firstTab;
  });

  function setTab(tab: Tab) {
    goto(`?tab=${tab}`, { replaceState: true, noScroll: true, keepFocus: true });
  }

  const PAGE_SIZE = 20;

  // ─── Users tab ───────────────────────────────────────────────────────────────

  let users       = $state<User[]>([...data.users]);
  let usersTotal  = $state(data.usersTotal ?? 0);
  let query       = $state('');
  let currentPage = $state(1);
  let sortField   = $state('createdAt');
  let sortDir     = $state<'asc' | 'desc'>('desc');

  function toggleSort(field: string) {
    if (sortField === field) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    else { sortField = field; sortDir = 'asc'; }
    currentPage = 1;
    doSearchUsers();
  }

  async function doSearchUsers() {
    const params = new URLSearchParams();
    if (query.trim()) params.set('search', query.trim());
    params.set('sort',    sortField);
    params.set('sortDir', sortDir);
    params.set('limit',   String(PAGE_SIZE));
    params.set('skip',    String((currentPage - 1) * PAGE_SIZE));
    const res = await fetch(`/api/users?${params}`);
    if (res.ok) { const d = await res.json(); users = d.users ?? []; usersTotal = d.total ?? 0; }
  }

  function gotoUsersPage(n: number) { currentPage = n; doSearchUsers(); }

  let usersSearchTimer: ReturnType<typeof setTimeout>;
  function onUsersQueryInput() {
    clearTimeout(usersSearchTimer);
    usersSearchTimer = setTimeout(() => { currentPage = 1; doSearchUsers(); }, 300);
  }

  let newUserOpen = $state(false);
  let newForm     = $state({ firstName: '', lastName: '', email: '', role: 'viewer' });
  let creating    = $state(false);
  let newError    = $state('');

  function openNewUser() {
    newForm  = { firstName: '', lastName: '', email: '', role: 'viewer' };
    newError = '';
    newUserOpen = true;
  }

  async function submitInvite() {
    if (!newForm.email) { newError = 'Email is required'; return; }
    if (!newForm.role)  { newError = 'Role is required'; return; }
    creating = true; newError = '';
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ firstName: newForm.firstName, lastName: newForm.lastName, email: newForm.email, role: newForm.role })
      });
      if (!res.ok) { const body = await res.json().catch(() => ({})); newError = body.message ?? 'Invite failed'; return; }
      const created = await res.json();
      users = [{ ...created, username: '', status: 'pending', createdAt: created.createdAt ?? new Date().toISOString() }, ...users];
      newUserOpen = false;
    } catch { newError = 'Network error'; }
    finally { creating = false; }
  }

  let editTarget = $state<User | null>(null);
  let editForm   = $state({ firstName: '', lastName: '', username: '', email: '', phone: '' });
  let saving     = $state(false);
  let editError  = $state('');

  function openEdit(user: User) {
    editForm = { firstName: user.firstName ?? '', lastName: user.lastName ?? '', username: user.username, email: user.email, phone: user.phone ?? '' };
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

  // ─── Roles tab ───────────────────────────────────────────────────────────────

  const ACTIONS  = ['create', 'read', 'update', 'delete'] as const;
  const resources = $derived(Object.keys(data.roles[0]?.permissions ?? {}));

  let openRoles = $state<Set<string>>(new Set([data.roles[0]?.name]));

  function toggleRole(name: string) {
    const next = new Set(openRoles);
    next.has(name) ? next.delete(name) : next.add(name);
    openRoles = next;
  }

  let roleUsers      = $state<User[]>([...data.users]);
  let roleUsersTotal = $state(data.usersTotal ?? 0);

  async function assignRole(userId: string, role: string) {
    const res = await fetch(`/api/users/${userId}/role`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ role })
    });
    if (res.ok) {
      roleUsers = roleUsers.map(u => u.id === userId ? { ...u, role } : u);
      users     = users.map(u => u.id === userId ? { ...u, role } : u);
    }
  }

  let userQuery = $state('');
  let rolesPage = $state(1);

  async function doSearchRoleUsers() {
    const params = new URLSearchParams();
    if (userQuery.trim()) params.set('search', userQuery.trim());
    params.set('limit', String(PAGE_SIZE));
    params.set('skip',  String((rolesPage - 1) * PAGE_SIZE));
    const res = await fetch(`/api/users?${params}`);
    if (res.ok) { const d = await res.json(); roleUsers = d.users ?? []; roleUsersTotal = d.total ?? 0; }
  }

  function gotoRolesPage(n: number) { rolesPage = n; doSearchRoleUsers(); }

  let rolesSearchTimer: ReturnType<typeof setTimeout>;
  function onRolesQueryInput() {
    clearTimeout(rolesSearchTimer);
    rolesSearchTimer = setTimeout(() => { rolesPage = 1; doSearchRoleUsers(); }, 300);
  }

  // ─── Teams tab ───────────────────────────────────────────────────────────────

  let teams      = $state<TeamSummary[]>([...data.teams]);
  let teamsTotal = $state(data.teamsTotal ?? 0);
  let teamQuery  = $state('');
  let teamsPage  = $state(1);

  async function doSearchTeams() {
    const params = new URLSearchParams();
    if (teamQuery.trim()) params.set('search', teamQuery.trim());
    params.set('limit', String(PAGE_SIZE));
    params.set('skip',  String((teamsPage - 1) * PAGE_SIZE));
    const res = await fetch(`/api/teams?${params}`);
    if (res.ok) { const d = await res.json(); teams = d.teams ?? []; teamsTotal = d.total ?? 0; }
  }

  function gotoTeamsPage(n: number) { teamsPage = n; doSearchTeams(); }

  let teamsSearchTimer: ReturnType<typeof setTimeout>;
  function onTeamsQueryInput() {
    clearTimeout(teamsSearchTimer);
    teamsSearchTimer = setTimeout(() => { teamsPage = 1; doSearchTeams(); }, 300);
  }

  let expandedTeamId = $state<string | null>(null);
  let teamDetails    = $state(new Map<string, TeamDetail>());
  let detailLoading  = $state(false);

  async function toggleTeam(id: string) {
    if (expandedTeamId === id) { expandedTeamId = null; return; }
    expandedTeamId = id;
    if (!teamDetails.has(id)) {
      detailLoading = true;
      try {
        const res = await fetch(`/api/teams/${id}`);
        if (res.ok) teamDetails = new Map(teamDetails).set(id, await res.json());
      } catch { /* silent */ }
      finally { detailLoading = false; }
    }
  }

  let newTeamOpen  = $state(false);
  let newTeamForm  = $state({ name: '', description: '' });
  let creatingTeam = $state(false);
  let newTeamError = $state('');

  async function submitNewTeam() {
    if (!newTeamForm.name.trim()) { newTeamError = 'Name is required'; return; }
    creatingTeam = true; newTeamError = '';
    try {
      const res = await fetch('/api/teams', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(newTeamForm)
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); newTeamError = b.message ?? 'Create failed'; return; }
      teamsPage = 1; await doSearchTeams();
      newTeamOpen = false;
    } catch { newTeamError = 'Network error'; }
    finally { creatingTeam = false; }
  }

  let editTeam      = $state<TeamSummary | null>(null);
  let editTeamForm  = $state({ name: '', description: '' });
  let savingTeam    = $state(false);
  let editTeamError = $state('');

  function openEditTeam(team: TeamSummary) {
    editTeamForm = { name: team.name, description: team.description ?? '' };
    editTeamError = ''; editTeam = team;
  }

  async function submitEditTeam() {
    if (!editTeam) return;
    savingTeam = true; editTeamError = '';
    try {
      const res = await fetch(`/api/teams/${editTeam.id}`, {
        method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(editTeamForm)
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

  let deleteTeam      = $state<TeamSummary | null>(null);
  let deletingTeam    = $state(false);
  let deleteTeamError = $state('');

  async function confirmDeleteTeam() {
    if (!deleteTeam) return;
    deletingTeam = true; deleteTeamError = '';
    try {
      const id  = deleteTeam.id;
      const res = await fetch(`/api/teams/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) { const b = await res.json().catch(() => ({})); deleteTeamError = b.message ?? 'Delete failed'; return; }
      if (expandedTeamId === id) expandedTeamId = null;
      deleteTeam = null;
      await doSearchTeams();
    } catch { deleteTeamError = 'Network error'; }
    finally { deletingTeam = false; }
  }

  let addMemberTeamId = $state<string | null>(null);
  let selectedUserId  = $state('');
  let addingMember    = $state(false);
  let addMemberError  = $state('');
  let pickerUsers     = $state<User[]>([]);
  let pickerLoaded    = $state(false);

  async function loadPickerUsers() {
    if (pickerLoaded) return;
    const res = await fetch('/api/users?limit=200&skip=0');
    if (res.ok) { const d = await res.json(); pickerUsers = d.users ?? []; pickerLoaded = true; }
  }

  async function addMember(teamId: string, userId: string) {
    addingMember = true; addMemberError = '';
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId })
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); addMemberError = b.message ?? 'Add failed'; return; }
      const detRes = await fetch(`/api/teams/${teamId}`);
      if (detRes.ok) {
        const detail: TeamDetail = await detRes.json();
        teamDetails = new Map(teamDetails).set(teamId, detail);
        teams = teams.map(t => t.id === teamId ? { ...t, memberCount: detail.members.length } : t);
      }
      selectedUserId = ''; addMemberTeamId = null;
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
  <title>{m.user_mgmt_title()}</title>
</svelte:head>

<div class="flex flex-col gap-6">
  <div class="page-heading flex items-start gap-3">
    <Users class="size-6 shrink-0 mt-0.5" />
    <div>
      <h1 class="text-2xl font-bold leading-none">{m.user_mgmt_title()}</h1>
      <p class="text-xs opacity-60 mt-0.5">{m.user_mgmt_subtitle()}</p>
    </div>
  </div>

  {#if data.error}
    <aside class="alert alert-error p-3 rounded text-sm">{data.error}</aside>
  {/if}

  <!-- Tabs -->
  <nav use:dragScroll class="tab-scroll flex gap-1 border-b border-base-300 -mb-6">
    {#if data.canReadUsers}
      <button type="button"
        class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors {activeTab === 'users' ? 'bg-primary text-primary-content' : 'opacity-60 hover:opacity-100 hover:bg-base-300/50'}"
        onclick={() => setTab('users')}>{m.user_mgmt_tab_users()}</button>
    {/if}
    {#if data.canReadRoles}
      <button type="button"
        class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors {activeTab === 'roles' ? 'bg-primary text-primary-content' : 'opacity-60 hover:opacity-100 hover:bg-base-300/50'}"
        onclick={() => setTab('roles')}>{m.user_mgmt_tab_roles()}</button>
    {/if}
    {#if data.canReadTeams}
      <button type="button"
        class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors {activeTab === 'teams' ? 'bg-primary text-primary-content' : 'opacity-60 hover:opacity-100 hover:bg-base-300/50'}"
        onclick={() => setTab('teams')}>{m.user_mgmt_tab_teams()}</button>
    {/if}
  </nav>

  <div class="pt-6">

  <!-- ── Users tab ─────────────────────────────────────────────────────────── -->
  {#if activeTab === 'users'}
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <label class="input flex items-center gap-2 flex-1">
          <Search class="size-4 shrink-0 opacity-50" />
          <input type="search" placeholder={m.user_mgmt_search_users()} class="grow" bind:value={query} oninput={onUsersQueryInput} autocomplete="off" />
        </label>
        {#if hasPermission(data.user, 'users', 'create')}
          <button type="button" class="btn btn-primary shrink-0" onclick={openNewUser}>
            <UserPlus class="size-4" /> <span>{m.user_mgmt_invite_user()}</span>
          </button>
        {/if}
      </div>

      <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
        <div use:dragScroll class="table-scroll">
        <table class="table table-sm">
          <thead>
            <tr class="bg-base-300/30">
              {#snippet sortTh(label: string, field: string)}
                <th>
                  <button type="button" class="flex items-center gap-1 hover:opacity-80 transition-opacity" onclick={() => toggleSort(field)}>
                    {label}
                    {#if sortField === field}
                      {#if sortDir === 'asc'}<ChevronUp class="size-3 opacity-70" />{:else}<ChevronDown class="size-3 opacity-70" />{/if}
                    {:else}
                      <ChevronsUpDown class="size-3 opacity-30" />
                    {/if}
                  </button>
                </th>
              {/snippet}
              {@render sortTh(m.user_mgmt_col_name(), 'name')}
              {@render sortTh(m.user_mgmt_col_email(), 'email')}
              {@render sortTh(m.user_mgmt_col_role(), 'role')}
              {@render sortTh(m.user_mgmt_col_joined(), 'createdAt')}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each users as user}
              <tr class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors">
                <td>
                  <div class="flex items-center gap-3">
                    <Avatar user={user} size="sm" />
                    <div>
                      {#if user.status === 'pending'}
                        <div class="flex items-center gap-2">
                          <span class="font-medium opacity-50 italic">{user.email}</span>
                          <span class="badge badge-warning badge-sm">{m.user_mgmt_col_pending()}</span>
                        </div>
                      {:else if user.firstName || user.lastName}
                        <div class="font-medium">{[user.firstName, user.lastName].filter(Boolean).join(' ')}</div>
                        <div class="text-xs text-base-content/50">{user.username}</div>
                      {:else}
                        <div class="font-medium">{user.username}</div>
                      {/if}
                    </div>
                  </div>
                </td>
                <td class="text-base-content/40">{user.email}</td>
                <td><span class="badge badge-primary badge-outline text-xs">{user.role ?? 'viewer'}</span></td>
                <td class="text-base-content/50">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <div class="flex items-center justify-end gap-1">
                    {#if hasPermission(data.user, 'users', 'update')}
                      <button type="button" class="btn btn-ghost btn-xs btn-square" aria-label="Edit {user.username}" onclick={() => openEdit(user)}>
                        <Pencil class="size-4" />
                      </button>
                    {/if}
                    {#if hasPermission(data.user, 'users', 'delete')}
                      <button type="button" class="btn btn-ghost btn-xs btn-square text-error" aria-label="Delete {user.username}" onclick={() => openDelete(user)}>
                        <Trash2 class="size-4" />
                      </button>
                    {/if}
                  </div>
                </td>
              </tr>
            {:else}
              <tr><td colspan="5" class="px-4 py-8 text-center text-base-content/50">{m.user_mgmt_no_users()}</td></tr>
            {/each}
          </tbody>
        </table>
        </div>

        <Pagination total={usersTotal} pageSize={PAGE_SIZE} {currentPage} onPage={gotoUsersPage} class="px-4 py-2 border-t border-base-300" />
      </div>
    </div>
  {/if}

  <!-- ── Roles tab ──────────────────────────────────────────────────────────── -->
  {#if activeTab === 'roles'}
    <div class="space-y-6">
      <div class="card bg-base-200 divide-y divide-base-300 overflow-hidden">
        {#each data.roles as role}
          {@const open = openRoles.has(role.name)}
          <button type="button"
            class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-base-300/50 transition-colors"
            onclick={() => toggleRole(role.name)} aria-expanded={open}>
            <div>
              <span class="font-semibold">{role.label}</span>
              <span class="ml-2 text-xs text-base-content/50">{role.name}</span>
            </div>
            <svg class="size-4 text-base-content/40 transition-transform duration-200 {open ? 'rotate-180' : ''}"
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06z" clip-rule="evenodd"/>
            </svg>
          </button>

          {#if open}
            <div class="px-4 py-4 border-t border-base-300 bg-base-200/30">
              <div class="grid gap-x-4 gap-y-3" style="grid-template-columns: minmax(7rem,1fr) repeat(4, 2.5rem);">
                <div class="text-xs font-semibold text-base-content/50 uppercase tracking-wide">Resource</div>
                {#each ACTIONS as action}
                  <div class="text-xs font-semibold text-base-content/50 uppercase tracking-wide text-center">{action[0].toUpperCase()}</div>
                {/each}
                {#each resources as resource}
                  <div class="flex items-center text-sm capitalize font-medium">{resource}</div>
                  {#each ACTIONS as action}
                    <div class="flex items-center justify-center">
                      <span class="inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold {role.permissions?.[resource]?.[action] ? 'bg-success text-success-content' : 'bg-neutral opacity-40'}" title="{action}">
                        {action[0].toUpperCase()}
                      </span>
                    </div>
                  {/each}
                {/each}
              </div>
              <p class="mt-3 text-xs text-base-content/40">C = create &nbsp; R = read &nbsp; U = update &nbsp; D = delete</p>
            </div>
          {/if}
        {:else}
          <div class="px-4 py-8 text-center text-base-content/50 text-sm">{m.user_mgmt_no_roles()}</div>
        {/each}
      </div>

      {#if data.canAssign && roleUsers.length > 0}
        <div class="space-y-3">
          <h2 class="text-lg font-semibold">{m.user_mgmt_assignments()}</h2>
          <label class="input flex items-center gap-2">
            <Search class="size-4 shrink-0 opacity-50" />
            <input type="search" placeholder={m.user_mgmt_search_users()} class="grow" bind:value={userQuery} oninput={onRolesQueryInput} />
          </label>
          <div class="card bg-base-200 border border-base-300 rounded-box overflow-hidden">
            <div use:dragScroll class="table-scroll">
            <table class="table table-sm">
              <thead>
                <tr class="bg-base-300/30">
                  <th>{m.user_mgmt_col_user()}</th>
                  <th>{m.user_mgmt_col_email()}</th>
                  <th>{m.user_mgmt_col_role()}</th>
                </tr>
              </thead>
              <tbody>
                {#each roleUsers as user}
                  <tr class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors">
                    <td>
                      {#if user.firstName || user.lastName}
                        <div class="font-medium">{[user.firstName, user.lastName].filter(Boolean).join(' ')}</div>
                        <div class="text-xs text-base-content/50">{user.username}</div>
                      {:else}
                        <div class="font-medium">{user.username}</div>
                      {/if}
                    </td>
                    <td class="text-base-content/40">{user.email}</td>
                    <td>
                      <select class="select select-sm text-xs" value={user.role ?? 'viewer'}
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
            </div>
            <Pagination total={roleUsersTotal} pageSize={PAGE_SIZE} currentPage={rolesPage} onPage={gotoRolesPage} class="px-4 py-2 border-t border-base-300" />
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <!-- ── Teams tab ──────────────────────────────────────────────────────── -->
  {#if activeTab === 'teams'}
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <label class="input flex items-center gap-2 flex-1">
          <Search class="size-4 shrink-0 opacity-50" />
          <input type="search" placeholder={m.user_mgmt_search_teams()} class="grow" bind:value={teamQuery} oninput={onTeamsQueryInput} />
        </label>
        {#if data.canCreateTeam}
          <button type="button" class="btn btn-primary shrink-0"
            onclick={() => { newTeamForm = { name: '', description: '' }; newTeamError = ''; newTeamOpen = true; }}>
            <Plus class="size-4" /> <span>{m.user_mgmt_new_team()}</span>
          </button>
        {/if}
      </div>

      <div class="card bg-base-200 divide-y divide-base-300 overflow-hidden">
        {#each teams as team}
          {@const expanded = expandedTeamId === team.id}
          {@const detail = teamDetails.get(team.id)}
          <div>
            <div class="flex items-center gap-2 px-4 py-3 hover:bg-base-300/50 transition-colors">
              <button type="button" class="flex-1 flex items-center gap-3 text-left min-w-0" onclick={() => toggleTeam(team.id)}>
                <svg class="size-4 text-base-content/40 transition-transform duration-200 shrink-0 {expanded ? 'rotate-90' : ''}"
                  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02z" clip-rule="evenodd" />
                </svg>
                <div class="min-w-0">
                  <span class="font-semibold">{team.name}</span>
                  {#if team.description}
                    <span class="ml-2 text-sm text-base-content/50 truncate">{team.description}</span>
                  {/if}
                </div>
                <span class="badge badge-ghost text-xs ml-auto shrink-0">
                  {m.user_mgmt_members_count({ count: team.memberCount ?? 0 })}
                </span>
              </button>
              <div class="flex items-center gap-1 shrink-0">
                {#if data.canUpdateTeam}
                  <button type="button" class="btn btn-ghost btn-xs btn-square" aria-label="Edit {team.name}" onclick={() => openEditTeam(team)}>
                    <Pencil class="size-4" />
                  </button>
                {/if}
                {#if data.canDeleteTeam}
                  <button type="button" class="btn btn-ghost btn-xs btn-square text-error" aria-label="Delete {team.name}" onclick={() => { deleteTeamError = ''; deleteTeam = team; }}>
                    <Trash2 class="size-4" />
                  </button>
                {/if}
              </div>
            </div>

            {#if expanded}
              <div class="px-4 py-4 border-t border-base-300 bg-base-200/30 space-y-3">
                {#if detailLoading && !detail}
                  <p class="text-sm text-base-content/50">Loading…</p>
                {:else if detail}
                  {#if detail.members.length > 0}
                    <ul class="space-y-2">
                      {#each detail.members as member}
                        <li class="flex items-center gap-3">
                          <Avatar user={member} size="sm" />
                          <div class="flex-1 min-w-0">
                            <div class="text-sm font-medium truncate">
                              {[member.firstName, member.lastName].filter(Boolean).join(' ') || member.username}
                            </div>
                            <div class="text-xs text-base-content/50">{member.username}</div>
                          </div>
                          {#if data.canUpdateTeam}
                            <button type="button" class="btn btn-ghost btn-xs btn-square text-error shrink-0"
                              aria-label="Remove {member.username}" onclick={() => removeMember(team.id, member.id)}>
                              <X class="size-4" />
                            </button>
                          {/if}
                        </li>
                      {/each}
                    </ul>
                  {:else}
                    <p class="text-sm text-base-content/50">{m.user_mgmt_no_members()}</p>
                  {/if}

                  {#if data.canUpdateTeam}
                    {#if addMemberTeamId === team.id}
                      <div class="space-y-2 pt-1">
                        <div class="flex items-center gap-2">
                          <div class="flex-1">
                            <UserSelect
                              users={pickerUsers.filter(u => !detail.members.some(mem => mem.id === u.id))}
                              bind:value={selectedUserId}
                              placeholder={m.user_mgmt_select_user()}
                              clearable
                            />
                          </div>
                          <button type="button" class="btn btn-primary btn-sm shrink-0"
                            disabled={!selectedUserId || addingMember}
                            onclick={() => addMember(team.id, selectedUserId)}>
                            {addingMember ? m.common_adding() : m.common_add()}
                          </button>
                          <button type="button" class="btn btn-ghost btn-sm shrink-0"
                            onclick={() => { addMemberTeamId = null; selectedUserId = ''; addMemberError = ''; }}>
                            {m.common_cancel()}
                          </button>
                        </div>
                        {#if addMemberError}<p class="text-xs text-error">{addMemberError}</p>{/if}
                      </div>
                    {:else}
                      <button type="button" class="btn btn-ghost btn-sm"
                        onclick={() => { addMemberTeamId = team.id; selectedUserId = ''; addMemberError = ''; loadPickerUsers(); }}>
                        <UserPlus class="size-4" /> {m.user_mgmt_add_member()}
                      </button>
                    {/if}
                  {/if}
                {/if}
              </div>
            {/if}
          </div>
        {:else}
          <div class="px-4 py-8 text-center text-base-content/50 text-sm">{m.user_mgmt_no_teams()}</div>
        {/each}
      </div>

      <Pagination total={teamsTotal} pageSize={PAGE_SIZE} currentPage={teamsPage} onPage={gotoTeamsPage} />
    </div>
  {/if}

  </div><!-- end pt-6 wrapper -->
</div>

<!-- Invite User modal -->
{#if newUserOpen}
  <Modal size="md" label="Invite user">
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
        <h2 class="text-lg font-semibold">{m.user_mgmt_modal_invite()}</h2>
        <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (newUserOpen = false)} aria-label="Close"><X class="size-5" /></button>
      </header>
      <div class="p-6 space-y-4 overflow-y-auto flex-1">
        {#if newError}<aside class="alert alert-error p-3 rounded text-sm">{newError}</aside>{/if}
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="inv-first">First Name</label>
            <input id="inv-first" type="text" class="input w-full" bind:value={newForm.firstName} maxlength="50" placeholder="Jane" />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="inv-last">Last Name</label>
            <input id="inv-last" type="text" class="input w-full" bind:value={newForm.lastName} maxlength="50" placeholder="Doe" />
          </div>
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="inv-email">Email *</label>
          <input id="inv-email" type="email" class="input w-full" bind:value={newForm.email} placeholder="you@example.com" autocomplete="off" />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="inv-role">Role *</label>
          <select id="inv-role" class="select w-full" bind:value={newForm.role}>
            {#each data.roles as role}
              <option value={role.name}>{role.label}</option>
            {/each}
          </select>
        </div>
        <p class="text-sm text-base-content/50">{m.user_mgmt_invitation_notice()}</p>
      </div>
      <footer class="flex justify-end gap-3 px-6 pb-5 border-t border-base-300 pt-3 shrink-0">
        <button type="button" class="btn btn-ghost" onclick={() => (newUserOpen = false)}>{m.common_cancel()}</button>
        <button type="button" class="btn btn-primary" disabled={creating} onclick={submitInvite}>
          {creating ? m.common_sending() : m.user_mgmt_send_invitation()}
        </button>
      </footer>
  </Modal>
{/if}

<!-- Edit User modal -->
{#if editTarget}
  <Modal size="md" label="Edit user">
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
        <h2 class="text-lg font-semibold">{m.user_mgmt_modal_edit_user()}</h2>
        <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (editTarget = null)} aria-label="Close"><X class="size-5" /></button>
      </header>
      <div class="p-6 space-y-4 overflow-y-auto flex-1">
        {#if editError}<aside class="alert alert-error p-3 rounded text-sm">{editError}</aside>{/if}
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="edit-first">First Name</label>
            <input id="edit-first" type="text" class="input w-full" bind:value={editForm.firstName} maxlength="50" />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="edit-last">Last Name</label>
            <input id="edit-last" type="text" class="input w-full" bind:value={editForm.lastName} maxlength="50" />
          </div>
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="edit-username">Username</label>
          <input id="edit-username" type="text" class="input w-full" bind:value={editForm.username} minlength="2" maxlength="50" required />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="edit-email">Email</label>
          <input id="edit-email" type="email" class="input w-full" bind:value={editForm.email} required />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="edit-phone">Phone</label>
          <input id="edit-phone" type="tel" class="input w-full" bind:value={editForm.phone} maxlength="30" placeholder="+1 555 000 0000" />
        </div>
      </div>
      <footer class="flex justify-end gap-3 px-6 pb-5 border-t border-base-300 pt-3 shrink-0">
        <button type="button" class="btn btn-ghost" onclick={() => (editTarget = null)}>{m.common_cancel()}</button>
        <button type="button" class="btn btn-primary" disabled={saving} onclick={submitEdit}>
          {saving ? m.common_saving() : m.common_save_changes()}
        </button>
      </footer>
  </Modal>
{/if}

<!-- Delete User modal -->
{#if deleteTarget}
  <Modal size="sm" label="Delete user">
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
        <h2 class="text-lg font-semibold">{m.user_mgmt_modal_delete_user()}</h2>
        <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (deleteTarget = null)} aria-label="Close"><X class="size-5" /></button>
      </header>
      <div class="p-6 space-y-3 overflow-y-auto flex-1">
        {#if deleteError}<aside class="alert alert-error p-3 rounded text-sm">{deleteError}</aside>{/if}
        <p class="text-sm">{m.user_mgmt_delete_user_confirm({ username: deleteTarget.username })}</p>
      </div>
      <footer class="flex justify-end gap-3 px-6 pb-5 border-t border-base-300 pt-3 shrink-0">
        <button type="button" class="btn btn-ghost" onclick={() => (deleteTarget = null)}>{m.common_cancel()}</button>
        <button type="button" class="btn btn-error" disabled={deleting} onclick={confirmDelete}>
          {deleting ? m.common_deleting() : m.common_delete()}
        </button>
      </footer>
  </Modal>
{/if}

<!-- New Team modal -->
{#if newTeamOpen}
  <Modal size="md" label="New team">
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
        <h2 class="text-lg font-semibold">{m.user_mgmt_modal_new_team()}</h2>
        <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (newTeamOpen = false)} aria-label="Close"><X class="size-5" /></button>
      </header>
      <div class="p-6 space-y-4 overflow-y-auto flex-1">
        {#if newTeamError}<aside class="alert alert-error p-3 rounded text-sm">{newTeamError}</aside>{/if}
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="team-name">Name *</label>
          <input id="team-name" type="text" class="input w-full" bind:value={newTeamForm.name} maxlength="100" placeholder="Engineering" />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="team-desc">Description</label>
          <textarea id="team-desc" class="textarea w-full" bind:value={newTeamForm.description} maxlength="500" rows="2" placeholder="Optional description"></textarea>
        </div>
      </div>
      <footer class="flex justify-end gap-3 px-6 pb-5 border-t border-base-300 pt-3 shrink-0">
        <button type="button" class="btn btn-ghost" onclick={() => (newTeamOpen = false)}>{m.common_cancel()}</button>
        <button type="button" class="btn btn-primary" disabled={creatingTeam} onclick={submitNewTeam}>
          {creatingTeam ? m.common_creating() : m.user_mgmt_create_team()}
        </button>
      </footer>
  </Modal>
{/if}

<!-- Edit Team modal -->
{#if editTeam}
  <Modal size="md" label="Edit team">
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
        <h2 class="text-lg font-semibold">{m.user_mgmt_modal_edit_team()}</h2>
        <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (editTeam = null)} aria-label="Close"><X class="size-5" /></button>
      </header>
      <div class="p-6 space-y-4 overflow-y-auto flex-1">
        {#if editTeamError}<aside class="alert alert-error p-3 rounded text-sm">{editTeamError}</aside>{/if}
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="editteam-name">Name *</label>
          <input id="editteam-name" type="text" class="input w-full" bind:value={editTeamForm.name} maxlength="100" />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="editteam-desc">Description</label>
          <textarea id="editteam-desc" class="textarea w-full" bind:value={editTeamForm.description} maxlength="500" rows="2"></textarea>
        </div>
      </div>
      <footer class="flex justify-end gap-3 px-6 pb-5 border-t border-base-300 pt-3 shrink-0">
        <button type="button" class="btn btn-ghost" onclick={() => (editTeam = null)}>{m.common_cancel()}</button>
        <button type="button" class="btn btn-primary" disabled={savingTeam} onclick={submitEditTeam}>
          {savingTeam ? m.common_saving() : m.common_save_changes()}
        </button>
      </footer>
  </Modal>
{/if}

<!-- Delete Team modal -->
{#if deleteTeam}
  <Modal size="sm" label="Delete team">
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-300 shrink-0">
        <h2 class="text-lg font-semibold">{m.user_mgmt_modal_delete_team()}</h2>
        <button type="button" class="btn btn-ghost btn-sm btn-square" onclick={() => (deleteTeam = null)} aria-label="Close"><X class="size-5" /></button>
      </header>
      <div class="p-6 space-y-3 overflow-y-auto flex-1">
        {#if deleteTeamError}<aside class="alert alert-error p-3 rounded text-sm">{deleteTeamError}</aside>{/if}
        <p class="text-sm">{m.user_mgmt_delete_team_confirm({ teamName: deleteTeam.name })}</p>
      </div>
      <footer class="flex justify-end gap-3 px-6 pb-5 border-t border-base-300 pt-3 shrink-0">
        <button type="button" class="btn btn-ghost" onclick={() => (deleteTeam = null)}>{m.common_cancel()}</button>
        <button type="button" class="btn btn-error" disabled={deletingTeam} onclick={confirmDeleteTeam}>
          {deletingTeam ? m.common_deleting() : m.common_delete()}
        </button>
      </footer>
  </Modal>
{/if}
