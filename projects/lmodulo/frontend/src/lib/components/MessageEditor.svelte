<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { m } from '$lib/paraglide/messages.js';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import Underline from '@tiptap/extension-underline';
  import Placeholder from '@tiptap/extension-placeholder';
  import Link from '@tiptap/extension-link';
  import { UrlParserExtension } from '$lib/extensions/UrlParserExtension';
  import { defaultParsers } from '$lib/extensions/editorParsers';
  import {
    Bold, Italic, UnderlineIcon, List, ListOrdered,
    TextQuote, Undo, Redo
  } from 'lucide-svelte';

  let { html = $bindable(''), placeholder = m.editor_placeholder() }: {
    html: string;
    placeholder?: string;
  } = $props();

  let element: HTMLDivElement;
  let editor: Editor | null = null;

  onMount(() => {
    editor = new Editor({
      element,
      extensions: [
        StarterKit,
        Underline,
        Placeholder.configure({ placeholder }),
        Link.configure({ openOnClick: false }),
        UrlParserExtension.configure({ parsers: defaultParsers }),
      ],
      content: html,
      onUpdate: ({ editor: e }) => {
        html = e.getHTML();
      },
    });
  });

  onDestroy(() => {
    editor?.destroy();
  });

  function cmd(fn: () => void) {
    return (e: MouseEvent) => { e.preventDefault(); fn(); editor?.view.focus(); };
  }

  function active(name: string, attrs?: Record<string, unknown>) {
    return editor?.isActive(name, attrs) ?? false;
  }
</script>

<div class="flex flex-col border border-base-300 rounded overflow-hidden bg-base-100">
  <!-- Toolbar -->
  <div class="flex items-center gap-0.5 px-2 py-1.5 border-b border-base-300 flex-wrap">
    <button type="button"
      class="btn btn-ghost btn-sm btn-square {active('bold') ? 'bg-primary/15 text-primary' : ''}"
      onmousedown={cmd(() => editor?.chain().toggleBold().run())}
      aria-label={m.editor_bold()} title={m.editor_bold()}
    ><Bold class="size-3.5" /></button>

    <button type="button"
      class="btn btn-ghost btn-sm btn-square {active('italic') ? 'bg-primary/15 text-primary' : ''}"
      onmousedown={cmd(() => editor?.chain().toggleItalic().run())}
      aria-label={m.editor_italic()} title={m.editor_italic()}
    ><Italic class="size-3.5" /></button>

    <button type="button"
      class="btn btn-ghost btn-sm btn-square {active('underline') ? 'bg-primary/15 text-primary' : ''}"
      onmousedown={cmd(() => editor?.chain().toggleUnderline().run())}
      aria-label={m.editor_underline()} title={m.editor_underline()}
    ><UnderlineIcon class="size-3.5" /></button>

    <span class="w-px h-4 bg-base-300 mx-1 opacity-60"></span>

    <button type="button"
      class="btn btn-ghost btn-sm px-2 text-xs font-bold {active('heading', { level: 1 }) ? 'bg-primary/15 text-primary' : ''}"
      onmousedown={cmd(() => editor?.chain().toggleHeading({ level: 1 }).run())}
      aria-label={m.editor_h1()} title={m.editor_h1()}
    >H1</button>

    <button type="button"
      class="btn btn-ghost btn-sm px-2 text-xs font-bold {active('heading', { level: 2 }) ? 'bg-primary/15 text-primary' : ''}"
      onmousedown={cmd(() => editor?.chain().toggleHeading({ level: 2 }).run())}
      aria-label={m.editor_h2()} title={m.editor_h2()}
    >H2</button>

    <button type="button"
      class="btn btn-ghost btn-sm px-2 text-xs font-bold {active('heading', { level: 3 }) ? 'bg-primary/15 text-primary' : ''}"
      onmousedown={cmd(() => editor?.chain().toggleHeading({ level: 3 }).run())}
      aria-label={m.editor_h3()} title={m.editor_h3()}
    >H3</button>

    <span class="w-px h-4 bg-base-300 mx-1 opacity-60"></span>

    <button type="button"
      class="btn btn-ghost btn-sm btn-square {active('bulletList') ? 'bg-primary/15 text-primary' : ''}"
      onmousedown={cmd(() => editor?.chain().toggleBulletList().run())}
      aria-label={m.editor_bullet_list()} title={m.editor_bullet_list()}
    ><List class="size-3.5" /></button>

    <button type="button"
      class="btn btn-ghost btn-sm btn-square {active('orderedList') ? 'bg-primary/15 text-primary' : ''}"
      onmousedown={cmd(() => editor?.chain().toggleOrderedList().run())}
      aria-label={m.editor_ordered_list()} title={m.editor_ordered_list()}
    ><ListOrdered class="size-3.5" /></button>

    <span class="w-px h-4 bg-base-300 mx-1 opacity-60"></span>

    <button type="button"
      class="btn btn-ghost btn-sm btn-square {active('blockquote') ? 'bg-primary/15 text-primary' : ''}"
      onmousedown={cmd(() => editor?.chain().toggleBlockquote().run())}
      aria-label={m.editor_blockquote()} title={m.editor_blockquote()}
    ><TextQuote class="size-3.5" /></button>

    <span class="w-px h-4 bg-base-300 mx-1 opacity-60"></span>

    <button type="button"
      class="btn btn-ghost btn-sm btn-square"
      onmousedown={cmd(() => editor?.chain().undo().run())}
      aria-label={m.editor_undo()} title={m.editor_undo()}
    ><Undo class="size-3.5" /></button>

    <button type="button"
      class="btn btn-ghost btn-sm btn-square"
      onmousedown={cmd(() => editor?.chain().redo().run())}
      aria-label={m.editor_redo()} title={m.editor_redo()}
    ><Redo class="size-3.5" /></button>
  </div>

  <!-- Editor area -->
  <div
    bind:this={element}
    class="min-h-[8rem] max-h-[24rem] overflow-y-auto p-3 text-sm prose prose-sm dark:prose-invert max-w-none focus-within:outline-none"
    onclick={() => editor?.view.focus()}
  ></div>
</div>

<style>
  :global(.tiptap p.is-editor-empty:first-child::before) {
    content: attr(data-placeholder);
    float: left;
    color: var(--color-base-content);
    opacity: 0.4;
    pointer-events: none;
    height: 0;
  }
  :global(.tiptap:focus) { outline: none; }
  :global(.tiptap a) { color: var(--color-primary); text-decoration: underline; cursor: pointer; }
  :global(.tiptap ul)  { list-style: disc;    padding-left: 1.5rem; }
  :global(.tiptap ol)  { list-style: decimal; padding-left: 1.5rem; }
  :global(.tiptap blockquote) {
    border-left: 3px solid var(--color-primary);
    padding-left: 0.75rem;
    opacity: 0.8;
  }
  :global(.tiptap h1) { font-size: 1.75em; font-weight: 700; line-height: 1.3; margin-top: 1em;    margin-bottom: 0.25em; }
  :global(.tiptap h2) { font-size: 1.4em;  font-weight: 700; line-height: 1.3; margin-top: 0.75em; margin-bottom: 0.25em; }
  :global(.tiptap h3) { font-size: 1.15em; font-weight: 600; line-height: 1.3; margin-top: 0.5em;  margin-bottom: 0.25em; }
</style>
