<script lang="ts">
  import { AsYouType, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/min';
  import { getLocale } from '$lib/paraglide/runtime.js';
  import { m } from '$lib/paraglide/messages.js';
  import CountrySelect from './CountrySelect.svelte';

  let {
    value = $bindable<string>(''),
    country = $bindable<CountryCode | ''>(''),
    valid = $bindable<boolean>(true),
    id = '',
    name = 'phone',
    required = false,
    disabled = false,
  }: {
    value?: string;
    country?: CountryCode | '';
    valid?: boolean;
    id?: string;
    name?: string;
    required?: boolean;
    disabled?: boolean;
  } = $props();

  const LOCALE_DEFAULT_COUNTRY: Record<string, CountryCode> = { en: 'US', es: 'ES' };

  function guessDefaultCountry(): CountryCode {
    if (typeof navigator !== 'undefined' && navigator.language) {
      try {
        const region = new Intl.Locale(navigator.language).maximize().region;
        if (region) return region as CountryCode;
      } catch {
        // Intl.Locale unsupported or unparsable — fall through to the locale map.
      }
    }
    return LOCALE_DEFAULT_COUNTRY[getLocale()] ?? 'US';
  }

  let raw = $state('');
  let seeded = false;

  // Seed the country + displayed text once, from the incoming E.164 value if present.
  $effect(() => {
    if (seeded) return;
    seeded = true;
    if (value) {
      const parsed = parsePhoneNumberFromString(value);
      if (parsed?.country) {
        country = parsed.country;
        raw = parsed.formatNational();
        return;
      }
    }
    if (!country) country = guessDefaultCountry();
  });

  // Reformat/revalidate whenever the typed text or the selected country changes.
  $effect(() => {
    if (!seeded) return;
    const cleaned = raw.replace(/[^\d+]/g, '');
    if (!cleaned) {
      value = '';
      valid = true;
      return;
    }
    const formatted = new AsYouType(country || undefined).input(cleaned);
    if (formatted !== raw) {
      raw = formatted;
      return; // this effect reruns immediately with the formatted text
    }
    const parsed = parsePhoneNumberFromString(formatted, (country || undefined) as CountryCode | undefined);
    valid = parsed?.isValid() ?? false;
    value = parsed ? parsed.number : value;
  });

  function onInput(e: Event) {
    raw = (e.target as HTMLInputElement).value;
  }
</script>

<div class="flex gap-2">
  <div class="w-44 shrink-0">
    <CountrySelect bind:value={country} />
  </div>
  <input
    type="tel"
    {id}
    {required}
    {disabled}
    class="input flex-1"
    class:input-error={!valid}
    value={raw}
    oninput={onInput}
    autocomplete="tel"
    aria-label={m.common_phone()}
  />
  <!-- Carries the canonical E.164 value for native <form method="POST"> submissions; the visible input above shows the national-format text instead. -->
  {#if name}
    <input type="hidden" {name} value={value} />
  {/if}
</div>
{#if !valid}
  <span class="text-error text-xs">{m.errors_phone_invalid()}</span>
{/if}
