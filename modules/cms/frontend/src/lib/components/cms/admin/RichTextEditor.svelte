<script lang="ts">
  // The text block editor: plain Tiptap 3, configured to produce only what the API's sanitizer keeps
  // (no code, headings 2–4, safe link URLs), so nothing is silently dropped on save. Content is
  // stored as Tiptap JSON (getJSON), never HTML. The toolbar shows while the block is selected.
  import { onMount, onDestroy } from 'svelte';
  import { slide, fade } from 'svelte/transition';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import Placeholder from '@tiptap/extension-placeholder';
  import {
    Bold, Italic, Underline, Strikethrough, List, ListOrdered, TextQuote, Minus, Undo2, Redo2,
    Link2, Link2Off, Pilcrow, Heading2, Heading3, Heading4,
  } from 'lucide-svelte';
  import '$lib/components/cms/cms-prose.css';
  import { safeHref } from '$lib/cms/links';
  import { ms } from '$lib/cms/motion';
  import type { TiptapNode } from '$lib/cms/types';

  let { doc, onchange, active = false, readonly = false, pagePaths = [], toolbarTop = '0px' }: {
    doc: TiptapNode;
    onchange: (doc: TiptapNode) => void;
    /** the block is selected: show the toolbar */
    active?: boolean;
    readonly?: boolean;
    /** site paths offered in the link field */
    pagePaths?: { path: string; title: string }[];
    /** sticky offset for the toolbar (below the builder's own sticky bar) */
    toolbarTop?: string;
  } = $props();

  const uid = $props.id();
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

  function say(message: string) {
    notice = message;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => (notice = ''), 5000);
  }

  /** Pasted or dropped files are refused (images come from the media picker). */
  function refuseFiles(dt: DataTransfer | null | undefined): boolean {
    if (!dt?.files?.length) return false;
    say('Files can\'t be pasted or dropped into text.');
    return true;
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
      ],
      content: doc,
      editorProps: {
        attributes: { class: 'cms-prose cms-editor outline-none', 'aria-label': 'Text', 'aria-multiline': 'true', role: 'textbox' },
        handlePaste: (_view, event) => refuseFiles(event.clipboardData),
        handleDrop: (_view, event) => refuseFiles((event as DragEvent).dataTransfer),
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
    linkUrl = typeof attrs.href === 'string' ? attrs.href : '';
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
    if (editor.state.selection.empty && !editor.isActive('link')) {
      editor.chain().insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href, target } }] }).run();
    } else {
      // Then put the caret after the link: left selected, the next keystroke would replace it
      editor.chain().extendMarkRange('link').setLink({ href, target }).run();
      editor.commands.setTextSelection(editor.state.selection.to);
    }
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
        <span class="w-px h-4 bg-base-content/20 mx-1" aria-hidden="true"></span>
        {@render tool('Undo', Undo2, false, e => e.chain().focus().undo().run(), can(e => e.can().undo()))}
        {@render tool('Redo', Redo2, false, e => e.chain().focus().redo().run(), can(e => e.can().redo()))}
      </div>

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
            {#each pagePaths as p (p.path)}<option value={p.path}>{p.title}</option>{/each}
          </datalist>
          <label class="flex items-center gap-1.5 text-xs cursor-pointer">
            <input type="checkbox" class="checkbox checkbox-xs" bind:checked={linkNewTab} /> New tab
          </label>
          <button type="submit" class="btn btn-primary btn-xs">Apply</button>
          {#if is('link')}
            <button type="button" class="btn btn-ghost btn-xs" onclick={removeLink}><Link2Off class="size-3.5" />Remove</button>
          {/if}
          {#if linkError}<p class="basis-full text-xs text-error" transition:slide={{ duration: ms(200) }}>{linkError}</p>{/if}
        </form>
      {/if}
    </div>
  {/if}

  <div bind:this={element}></div>

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
</style>
