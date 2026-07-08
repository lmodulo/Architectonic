<script lang="ts">
  import Select from 'svelte-select';

  type User = { id: string; username: string; firstName?: string; lastName?: string };
  type Item = { value: string; label: string };

  let {
    users,
    value = $bindable<string | string[] | null>(null),
    multiple = false,
    placeholder = 'Select…',
    excludeId = '',
    clearable = false,
  }: {
    users: User[];
    value?: string | string[] | null;
    multiple?: boolean;
    placeholder?: string;
    excludeId?: string;
    clearable?: boolean;
  } = $props();

  function displayName(u: User) {
    return u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.username;
  }

  const items = $derived(
    users.filter(u => u.id !== excludeId).map(u => ({ value: u.id, label: displayName(u) }))
  );

  // Convert string IDs → item objects for svelte-select display
  const selectValue = $derived(
    multiple
      ? (Array.isArray(value) && value.length > 0
          ? (value as string[]).map(id => items.find(i => i.value === id)).filter(Boolean) as Item[]
          : null)
      : (value ? (items.find(i => i.value === value) ?? null) : null)
  );
</script>

<!--
  value={selectValue} — one-way: parent controls display
  on:change — user added an item
  on:clear  — user removed an item (chip) or cleared the field
-->
<Select
  {items}
  value={selectValue}
  {multiple}
  {placeholder}
  {clearable}
  floatingConfig={{ strategy: 'fixed' }}
  on:change={(e) => {
    if (multiple) {
      value = Array.isArray(e.detail) ? (e.detail as Item[]).map(i => i.value) : [];
    } else {
      value = (e.detail as Item)?.value ?? null;
    }
  }}
  on:clear={(e) => {
    if (multiple) {
      const d = e.detail as Item | Item[];
      if (Array.isArray(d)) {
        value = [];
      } else {
        value = Array.isArray(value)
          ? (value as string[]).filter(id => id !== d.value)
          : [];
      }
    } else {
      value = null;
    }
  }}
/>
