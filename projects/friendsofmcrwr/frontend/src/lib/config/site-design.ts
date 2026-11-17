// Lets a project give the public website its own design without editing cms files. Ship
//
//   src/lib/config/site-design/<name>.ts   default-exporting a SiteDesign
//
// The first file by name wins. Anything it leaves out keeps the cms default. This file is in the client
// bundle, so a design may not import server-only code.
import type { Component, Snippet } from 'svelte';
import type { PageView, SiteMenu } from '$lib/cms/types';

export interface SiteShellProps {
  menu: SiteMenu;
  breadcrumbs?: PageView['breadcrumbs'];
  children: Snippet;
}

export interface PageTitleProps {
  view: PageView;
  /** The page opens with a hero block, which carries the h1; render breadcrumbs or nothing then. */
  heroFirst: boolean;
}

export interface SiteDesign {
  /** Replaces SiteShell (header, menus, footer) on every public page: CMS pages, the CMS home page, 404s, previews. */
  Shell?: Component<SiteShellProps>;
  /**
   * Replaces the title block CmsPage renders above a page's blocks. It is rendered for every page, also when
   * the page opens with a hero (`heroFirst`). When set, the default shell leaves breadcrumbs to it.
   */
  PageTitle?: Component<PageTitleProps>;
}

const files = import.meta.glob<{ default: SiteDesign }>('./site-design/*.ts', { eager: true });

export const SITE_DESIGN: SiteDesign =
  Object.entries(files).sort(([a], [b]) => a.localeCompare(b))[0]?.[1].default ?? {};
