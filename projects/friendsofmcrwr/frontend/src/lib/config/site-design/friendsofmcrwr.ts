// friendsofmcrwr's public website design (see $lib/config/site-design.ts): its own header, menu, footer and
// page title banner around the CMS content. The landing page at `/` is separate ($lib/config/module-home/).
import Shell from '$lib/components/mcrwr/Shell.svelte';
import PageTitle from '$lib/components/mcrwr/PageTitle.svelte';
import type { SiteDesign } from '$lib/config/site-design';

export default { Shell, PageTitle } satisfies SiteDesign;
