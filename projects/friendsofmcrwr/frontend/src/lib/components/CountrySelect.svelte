<script lang="ts">
  import Select from 'svelte-select';
  import { getCountries, getCountryCallingCode, type CountryCode } from 'libphonenumber-js/min';
  import { getLocale } from '$lib/paraglide/runtime.js';

  type Item = { value: CountryCode; label: string };

  let {
    value = $bindable<CountryCode | ''>(''),
    clearable = false,
  }: {
    value?: CountryCode | '';
    clearable?: boolean;
  } = $props();

  const regionNames = $derived(new Intl.DisplayNames([getLocale()], { type: 'region' }));

  function countryName(code: CountryCode) {
    try {
      return regionNames.of(code) ?? code;
    } catch {
      return code;
    }
  }

  const items = $derived(
    getCountries()
      .map((code): Item => ({ value: code, label: `${countryName(code)} (+${getCountryCallingCode(code)})` }))
      .sort((a, b) => a.label.localeCompare(b.label))
  );

  const selectValue = $derived(value ? (items.find(i => i.value === value) ?? null) : null);
</script>

<Select
  {items}
  value={selectValue}
  {clearable}
  floatingConfig={{ strategy: 'fixed' }}
  on:change={(e) => { value = (e.detail as Item)?.value ?? ''; }}
  on:clear={() => { value = ''; }}
/>
