<script lang="ts">
  // The text block editor: plain Tiptap 3, configured to produce only what the API's sanitizer keeps
  // (no code, headings 2–4, safe link URLs), so nothing is silently dropped on save. Content is
  // stored as Tiptap JSON (getJSON), never HTML. The toolbar shows while the block is selected.
  // Vault images (cmsImage) float left or right with the text wrapping round them; a second toolbar
  // row edits the selected image. Pasted or dropped image files upload to Vault's Website Media.
  import { onMount, onDestroy } from 'svelte';
  import { slide, fade } from 'svelte/transition';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import Placeholder from '@tiptap/extension-placeholder';
  import {
    Bold, Italic, Underline, Strikethrough, List, ListOrdered, TextQuote, Minus, Undo2, Redo2,
    Link2, Link2Off, Pilcrow, Heading2, Heading3, Heading4, ImagePlus,
  } from 'lucide-svelte';
  import '$lib/components/cms/cms-prose.css';
  import { safeHref } from '$lib/cms/links';
  import { ms } from '$lib/cms/motion';
  import { getMediaContext } from '$lib/cms/media.svelte';
  import { CmsImage } from '$lib/cms/tiptap/CmsImage';
  import { LinkNode } from '$lib/cms/tiptap/LinkNode';
  import { pageForHref, type PageLink } from '$lib/cms/admin';
  import type { CmsImageAttrs, ImageRef, TiptapNode } from '$lib/cms/types';

  let { doc, onchange, active = false, readonly = false, pagePaths = [], toolbarTop = '0px' }: {
    doc: TiptapNode;
    onchange: (doc: TiptapNode) => void;
    /** the block is selected: show the toolbar */
    active?: boolean;
    readonly?: boolean;
    /** site pages offered in the link field; a link to one stores its nodeId and follows it when it moves */
    pagePaths?: PageLink[];
    /** sticky offset for the toolbar (below the builder's own sticky bar) */
    toolbarTop?: string;
  } = $props();

  const uid = $props.id();
  const media = getMediaContext();
  let element: HTMLDivElement | undefined = $state();
  let editor: Editor | null = null;
  // Bumped on every transaction so the toolbar's active states re-render (the editor isn't reactive)
  let version = $state(0);
  let notice = $state('');
  let noticeTimer: ReturnType<typeof setTimeout> | undefined;

  let linkOpen = $state(false);
  let linkUrl = $state('');
  let linkNewTab = $state(false);
  let linkError = $state('');
  let linkInput: HTMLInputElement | undefined = $state();
  /** the page an existing link pointed at when the form opened, and the URL shown for it */
  let linkWas = $state<{ nodeId: string; shown: string } | null>(null);
  // The page the typed URL means, if any (the link then stores its nodeId)
  const linkPage = $derived(linkOpen ? (linkWas && linkUrl.trim() === linkWas.shown ? pagePaths.find(p => p.id === linkWas!.nodeId) : pageForHref(linkUrl.trim(), pagePaths)) : undefined);

  function say(message: string) {
    notice = message;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => (notice = ''), 5000);
  }

  /** Pasted or dropped files: images upload to Vault and land at `pos`; anything else is refused. */
  function takeFiles(dt: DataTransfer | null | undefined, pos: number | null): boolean {
    const files = [...(dt?.files ?? [])];
    if (!files.length) return false;
    if (readonly) return true;
    if (!media?.access.canUpload) {
      say(media?.access.canPick ? 'You can\'t upload to Vault. Use the image button to choose an existing image.' : 'Files can\'t be pasted or dropped into text.');
      return true;
    }
    insertUploads(files, pos);
    return true;
  }

  async function insertUploads(files: File[], pos: number | null) {
    if (!media) return;
    const { images, errors } = await media.uploadFiles(files);
    if (!editor) return;
    if (images.length) {
      const nodes = images.map(r => ({ type: 'cmsImage', attrs: { ...r, caption: null, align: 'center', width: 50 } }));
      const at = pos ?? editor.state.selection.from;
      if (pos !== null) editor.chain().insertContentAt(pos, nodes).run();
      else editor.chain().insertContent(nodes).run();
      roomAfterImage();
      selectImage(images[0].vaultId, at);
    }
    say([
      images.length ? `Added ${images.length} image${images.length === 1 ? '' : 's'}. Select ${images.length === 1 ? 'it' : 'each one'} to add alt text.` : '',
      ...errors,
    ].filter(Boolean).join(' '));
  }

  onMount(() => {
    editor = new Editor({
      element,
      editable: !readonly,
      extensions: [
        StarterKit.configure({
          codeBlock: false,
          code: false,
          heading: { levels: [2, 3, 4] },
          // It would append an empty paragraph after a closing list or heading, which changes the
          // document the moment it opens and makes every page look edited
          trailingNode: false,
          link: {
            openOnClick: false,
            autolink: true,
            defaultProtocol: 'https',
            isAllowedUri: (url, ctx) => ctx.defaultValidate(url) && !!safeHref(url),
            // Store only href and target; new links open in the same tab unless asked
            HTMLAttributes: { target: null, rel: null, class: null },
          },
        }),
        Placeholder.configure({ placeholder: 'Write something…' }),
        LinkNode,
        CmsImage.configure({ isMissing: id => media?.isMissing(id) ?? false }),
      ],
      content: doc,
      editorProps: {
        attributes: { class: 'cms-prose cms-editor outline-none', 'aria-label': 'Text', 'aria-multiline': 'true', role: 'textbox' },
        handlePaste: (_view, event) => takeFiles(event.clipboardData, null),
        // Links in the text are for editing, not following: SvelteKit's router handles any click on
        // an <a> (contenteditable or not) unless the click was cancelled, and would leave the builder
        handleDOMEvents: {
          click: (_view, event) => {
            if ((event.target as Element | null)?.closest?.('a[href]')) event.preventDefault();
            return false;
          },
        },
        // `moved`: an image dragged within the text, which ProseMirror handles itself
        handleDrop: (view, event, _slice, moved) => {
          if (moved) return false;
          const e = event as DragEvent;
          return takeFiles(e.dataTransfer, view.posAtCoords({ left: e.clientX, top: e.clientY })?.pos ?? null);
        },
      },
      onTransaction: () => { version++; },
      onUpdate: ({ editor: e }) => onchange(e.getJSON() as TiptapNode),
    });
    version++;
  });

  onDestroy(() => {
    clearTimeout(noticeTimer);
    editor?.destroy();
  });

  // Reading `version` makes the toolbar re-check after each transaction
  const is = (name: string, attrs?: Record<string, unknown>) => { void version; return editor?.isActive(name, attrs) ?? false; };
  const can = (fn: (e: Editor) => boolean) => { void version; return editor ? fn(editor) : false; };
  // mousedown is cancelled so the editor keeps its selection; click runs the command (keyboard too)
  const run = (fn: (e: Editor) => void) => () => { if (editor) fn(editor); };

  function openLink() {
    if (!editor) return;
    const attrs = editor.getAttributes('link');
    // A link to a site page shows the page's current path
    const current = typeof attrs.nodeId === 'string' ? pagePaths.find(p => p.id === attrs.nodeId) : undefined;
    linkUrl = current?.path ?? (typeof attrs.href === 'string' ? attrs.href : '');
    linkWas = typeof attrs.nodeId === 'string' ? { nodeId: attrs.nodeId, shown: linkUrl } : null;
    linkNewTab = attrs.target === '_blank';
    linkError = '';
    linkOpen = true;
    queueMicrotask(() => linkInput?.focus());
  }

  function applyLink(e?: Event) {
    e?.preventDefault();
    // A second Enter while the form slides away must not apply it again
    if (!editor || !linkOpen) return;
    const href = safeHref(linkUrl);
    if (!href) { linkError = 'Enter a URL starting with https://, http://, mailto:, tel:, / or #.'; return; }
    const target = linkNewTab ? '_blank' : null;
    // An unchanged link keeps its page even if that page has since been deleted (the block warns)
    const nodeId = linkPage?.id ?? (linkWas && href === linkWas.shown ? linkWas.nodeId : null);
    const attrs = { href, target, nodeId };
    if (editor.state.selection.empty && !editor.isActive('link')) {
      editor.chain().insertContent({ type: 'text', text: linkPage?.title ?? href, marks: [{ type: 'link', attrs }] }).run();
    } else {
      // Then put the caret after the link: left selected, the next keystroke would replace it
      // (setLink's type only lists href, target, rel and class; nodeId is added by LinkNode)
      editor.chain().extendMarkRange('link').setLink(attrs as { href: string }).run();
      editor.commands.setTextSelection(editor.state.selection.to);
    }
    // The link mark is inclusive (autolink needs that), so without this the next words typed would
    // join the link. With an empty selection unsetMark only drops it from the marks being typed.
    editor.commands.unsetMark('link');
    linkOpen = false;
    // Synchronously: Tiptap's focus() waits a frame, and keys typed meanwhile would land in the closing form
    editor.view.focus();
  }

  function removeLink() {
    if (!editor) return;
    editor.chain().extendMarkRange('link').unsetLink().run();
    editor.commands.setTextSelection(editor.state.selection.to);
    linkOpen = false;
    editor.view.focus();
  }

  // ── Images ──────────────────────────────────────────────────────────────────────────────
  const imageAttrs = (): CmsImageAttrs => { void version; return (editor?.getAttributes('cmsImage') ?? {}) as CmsImageAttrs; };
  const setImage = (attrs: Partial<CmsImageAttrs>) => editor?.chain().updateAttributes('cmsImage', attrs).run();

  async function insertImage() {
    const picked = await media?.pick({ withAlt: true, title: 'Insert an image' });
    const r: ImageRef | undefined = picked?.[0];
    if (r && editor) {
      const at = editor.state.selection.from;
      editor.chain().focus().insertCmsImage({ ...r, w: r.w ?? null, h: r.h ?? null }).run();
      roomAfterImage();
      selectImage(r.vaultId, at);
    }
  }

  /**
   * An image that ends the text leaves nowhere to type after it (trailingNode is off), so add an
   * empty paragraph after it.
   */
  function roomAfterImage() {
    if (!editor || editor.state.doc.lastChild?.type.name !== 'cmsImage') return;
    editor.chain().insertContentAt(editor.state.doc.content.size, { type: 'paragraph' }).run();
  }

  /** Selects the image with this id nearest `near`, so its toolbar opens for alt text and position. */
  function selectImage(vaultId: string, near: number) {
    if (!editor) return;
    let best = -1;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'cmsImage' && node.attrs.vaultId === vaultId && (best < 0 || Math.abs(pos - near) < Math.abs(best - near))) best = pos;
    });
    if (best >= 0) editor.commands.setNodeSelection(best);
  }

  async function replaceImage() {
    const current = imageAttrs();
    const picked = await media?.pick({ withAlt: true, title: 'Replace the image' });
    const r = picked?.[0];
    if (r) setImage({ vaultId: r.vaultId, src: r.src, w: r.w ?? null, h: r.h ?? null, alt: r.alt || current.alt });
  }

  function removeImage() {
    editor?.chain().focus().deleteSelection().run();
  }

  const ALIGNS: { v: CmsImageAttrs['align']; l: string }[] = [
    { v: 'left', l: 'Left' }, { v: 'right', l: 'Right' }, { v: 'center', l: 'Centre' }, { v: 'full', l: 'Full width' },
  ];
  const WIDTHS: CmsImageAttrs['width'][] = [25, 33, 50, 100];

  function onKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && !readonly) {
      e.preventDefault();
      openLink();
    }
  }

  function onLinkKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      linkOpen = false;
      editor?.view.focus();
    }
  }

  $effect(() => {
    if (!active) linkOpen = false;
  });
</script>

{#snippet tool(label: string, Icon: typeof Bold, on: boolean, action: (e: Editor) => void, enabled = true)}
  <button
    type="button"
    class="btn btn-ghost btn-square btn-xs {on ? 'btn-active' : ''}"
    aria-label={label}
    aria-pressed={on}
    title={label}
    disabled={!enabled}
    onmousedown={e => e.preventDefault()}
    onclick={run(action)}
  ><Icon class="size-3.5" /></button>
{/snippet}

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="flex flex-col" onkeydown={onKeydown}>
  {#if active && !readonly}
    <div
      class="sticky z-10 -mx-1 mb-2 flex flex-col rounded-field border border-base-300 bg-base-100 shadow-sm"
      style="top: {toolbarTop}"
      transition:slide={{ duration: ms(200) }}
    >
      <div class="flex flex-wrap items-center gap-0.5 px-1.5 py-1" role="toolbar" aria-label="Text formatting">
        {@render tool('Paragraph', Pilcrow, is('paragraph'), e => e.chain().focus().setParagraph().run())}
        {@render tool('Heading 2', Heading2, is('heading', { level: 2 }), e => e.chain().focus().toggleHeading({ level: 2 }).run())}
        {@render tool('Heading 3', Heading3, is('heading', { level: 3 }), e => e.chain().focus().toggleHeading({ level: 3 }).run())}
        {@render tool('Heading 4', Heading4, is('heading', { level: 4 }), e => e.chain().focus().toggleHeading({ level: 4 }).run())}
        <span class="w-px h-4 bg-base-content/20 mx-1" aria-hidden="true"></span>
        {@render tool('Bold', Bold, is('bold'), e => e.chain().focus().toggleBold().run())}
        {@render tool('Italic', Italic, is('italic'), e => e.chain().focus().toggleItalic().run())}
        {@render tool('Underline', Underline, is('underline'), e => e.chain().focus().toggleUnderline().run())}
        {@render tool('Strikethrough', Strikethrough, is('strike'), e => e.chain().focus().toggleStrike().run())}
        {@render tool('Link (Ctrl+K)', Link2, is('link') || linkOpen, () => (linkOpen ? (linkOpen = false) : openLink()))}
        <span class="w-px h-4 bg-base-content/20 mx-1" aria-hidden="true"></span>
        {@render tool('Bulleted list', List, is('bulletList'), e => e.chain().focus().toggleBulletList().run())}
        {@render tool('Numbered list', ListOrdered, is('orderedList'), e => e.chain().focus().toggleOrderedList().run())}
        {@render tool('Quote', TextQuote, is('blockquote'), e => e.chain().focus().toggleBlockquote().run())}
        {@render tool('Horizontal line', Minus, false, e => e.chain().focus().setHorizontalRule().run())}
        {#if media?.access.canPick}
          {@render tool('Image', ImagePlus, false, () => insertImage())}
        {/if}
        <span class="w-px h-4 bg-base-content/20 mx-1" aria-hidden="true"></span>
        {@render tool('Undo', Undo2, false, e => e.chain().focus().undo().run(), can(e => e.can().undo()))}
        {@render tool('Redo', Redo2, false, e => e.chain().focus().redo().run(), can(e => e.can().redo()))}
      </div>

      {#if is('cmsImage')}
        {@const a = imageAttrs()}
        <div class="flex flex-wrap items-center gap-2 px-2 py-2 border-t border-base-300" role="group" aria-label="Image settings" transition:slide={{ duration: ms(200) }}>
          <div class="join" role="group" aria-label="Image position">
            {#each ALIGNS as al (al.v)}
              <button type="button" class="btn btn-xs join-item {a.align === al.v ? 'btn-neutral' : ''}" aria-pressed={a.align === al.v} onmousedown={e => e.preventDefault()} onclick={() => setImage({ align: al.v, ...(al.v === 'full' ? { width: 100 } : a.width === 100 && al.v !== 'center' ? { width: 50 } : {}) })}>{al.l}</button>
            {/each}
          </div>
          <div class="join" role="group" aria-label="Image width">
            {#each WIDTHS as w (w)}
              <button type="button" class="btn btn-xs join-item {a.width === w && a.align !== 'full' ? 'btn-neutral' : ''}" aria-pressed={a.width === w && a.align !== 'full'} disabled={a.align === 'full'} onmousedown={e => e.preventDefault()} onclick={() => setImage({ width: w })}>{w}%</button>
            {/each}
          </div>
          <input class="input input-xs flex-1 min-w-36" aria-label="Alt text" placeholder="Alt text (describe the image)" maxlength="500" value={a.alt ?? ''} oninput={e => setImage({ alt: e.currentTarget.value })} />
          <input class="input input-xs flex-1 min-w-36" aria-label="Caption" placeholder="Caption (optional)" maxlength="500" value={a.caption ?? ''} oninput={e => setImage({ caption: e.currentTarget.value || null })} />
          {#if media?.access.canPick}
            <button type="button" class="btn btn-ghost btn-xs" onclick={replaceImage}>Replace</button>
          {/if}
          <button type="button" class="btn btn-ghost btn-xs text-error" onclick={removeImage}>Remove</button>
          {#if a.vaultId && media?.isMissing(a.vaultId)}
            <p class="basis-full text-xs text-warning">This image is no longer available in Vault, so it doesn't show on the site. Replace or remove it.</p>
          {/if}
        </div>
      {/if}

      {#if linkOpen}
        <!-- Escape anywhere in the link form closes it and returns to the text -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <form
          class="flex flex-wrap items-center gap-2 px-2 py-2 border-t border-base-300"
          onsubmit={applyLink}
          onkeydown={onLinkKeydown}
          transition:slide={{ duration: ms(200) }}
        >
          <label class="sr-only" for="{uid}-href">Link URL</label>
          <input
            id="{uid}-href"
            bind:this={linkInput}
            bind:value={linkUrl}
            list="{uid}-paths"
            class="input input-xs flex-1 min-w-48 font-mono"
            placeholder="https://example.org or /about"
            maxlength="2048"
            aria-invalid={!!linkError}
          />
          <datalist id="{uid}-paths">
            {#each pagePaths as p (p.id)}<option value={p.path}>{p.title}</option>{/each}
          </datalist>
          <label class="flex items-center gap-1.5 text-xs cursor-pointer">
            <input type="checkbox" class="checkbox checkbox-xs" bind:checked={linkNewTab} /> New tab
          </label>
          <button type="submit" class="btn btn-primary btn-xs">Apply</button>
          {#if is('link')}
            <button type="button" class="btn btn-ghost btn-xs" onclick={removeLink}><Link2Off class="size-3.5" />Remove</button>
          {/if}
          {#if linkError}<p class="basis-full text-xs text-error" transition:slide={{ duration: ms(200) }}>{linkError}</p>{/if}
          {#if linkPage}
            <p class="basis-full text-xs opacity-70" transition:slide={{ duration: ms(200) }}>Links to the page “{linkPage.title}”. The link follows it if the page moves.</p>
          {/if}
        </form>
      {/if}
    </div>
  {/if}

  <div bind:this={element}></div>

  {#if media?.uploading}
    <p class="mt-2 text-xs opacity-70 inline-flex items-center gap-2" role="status" transition:fade={{ duration: ms(150) }}>
      <span class="loading loading-spinner loading-xs"></span>Uploading {media.uploading} image{media.uploading === 1 ? '' : 's'} to Vault…
    </p>
  {/if}
  {#if notice}
    <p class="mt-2 text-xs text-warning" role="status" transition:fade={{ duration: ms(150) }}>{notice}</p>
  {/if}
</div>

<style>
  :global(.cms-editor) { min-height: 2.5rem; }
  :global(.cms-editor p.is-editor-empty:first-child::before) {
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
    color: color-mix(in oklab, var(--color-base-content) 40%, transparent);
  }
  :global(.cms-editor .ProseMirror-selectednode) { outline: 2px solid var(--color-primary); outline-offset: 2px; }
  :global(.cms-editor figure[data-cms-image]) { cursor: pointer; }
  :global(.cms-editor figure[data-missing]) { outline: 2px dashed var(--color-warning); outline-offset: 2px; }
  :global(.cms-editor figure[data-missing] img) { opacity: 0.35; }
</style>
