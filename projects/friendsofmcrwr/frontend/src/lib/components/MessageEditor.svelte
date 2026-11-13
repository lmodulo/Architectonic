<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import Underline from '@tiptap/extension-underline';
  import Placeholder from '@tiptap/extension-placeholder';
  import {
    Bold, Italic, UnderlineIcon, List, ListOrdered,
    TextQuote, Undo, Redo
  } from 'lucide-svelte';
  import { m } from '$lib/paraglide/messages.js';

  let { html = $bindable(''), placeholder = 'Write your message…' }: {
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

<div class="flex flex-col border border-base-300 rounded-lg overflow-hidden">
  <!-- Toolbar -->
  <div class="flex items-center gap-0.5 px-2 py-1.5 border-b border-base-200 bg-base-200/50 flex-wrap">
    <button type="button"
      class="btn btn-ghost btn-square btn-xs {active('bold') ? 'btn-primary' : ''}"
      onmousedown={cmd(() => editor?.chain().toggleBold().run())}
      aria-label={m.editor_bold()} title={m.editor_bold()}
    ><Bold class="size-3.5" /></button>

    <button type="button"
      class="btn btn-ghost btn-square btn-xs {active('italic') ? 'btn-primary' : ''}"
      onmousedown={cmd(() => editor?.chain().toggleItalic().run())}
      aria-label={m.editor_italic()} title={m.editor_italic()}
    ><Italic class="size-3.5" /></button>

    <button type="button"
      class="btn btn-ghost btn-square btn-xs {active('underline') ? 'btn-primary' : ''}"
      onmousedown={cmd(() => editor?.chain().toggleUnderline().run())}
      aria-label={m.editor_underline()} title={m.editor_underline()}
    ><UnderlineIcon class="size-3.5" /></button>

    <span class="w-px h-4 bg-base-content/20 mx-1"></span>

    <button type="button"
      class="btn btn-ghost btn-square btn-xs {active('bulletList') ? 'btn-primary' : ''}"
      onmousedown={cmd(() => editor?.chain().toggleBulletList().run())}
      aria-label={m.editor_bullet_list()} title={m.editor_bullet_list()}
    ><List class="size-3.5" /></button>

    <button type="button"
      class="btn btn-ghost btn-square btn-xs {active('orderedList') ? 'btn-primary' : ''}"
      onmousedown={cmd(() => editor?.chain().toggleOrderedList().run())}
      aria-label={m.editor_ordered_list()} title={m.editor_ordered_list()}
    ><ListOrdered class="size-3.5" /></button>

    <span class="w-px h-4 bg-base-content/20 mx-1"></span>

    <button type="button"
      class="btn btn-ghost btn-square btn-xs {active('blockquote') ? 'btn-primary' : ''}"
      onmousedown={cmd(() => editor?.chain().toggleBlockquote().run())}
      aria-label={m.editor_blockquote()} title={m.editor_blockquote()}
    ><TextQuote class="size-3.5" /></button>

    <span class="w-px h-4 bg-base-content/20 mx-1"></span>

    <button type="button"
      class="btn btn-ghost btn-square btn-xs"
      onmousedown={cmd(() => editor?.chain().undo().run())}
      aria-label={m.editor_undo()} title={m.editor_undo()}
    ><Undo class="size-3.5" /></button>

    <button type="button"
      class="btn btn-ghost btn-square btn-xs"
      onmousedown={cmd(() => editor?.chain().redo().run())}
      aria-label={m.editor_redo()} title={m.editor_redo()}
    ><Redo class="size-3.5" /></button>
  </div>

  <div
    bind:this={element}
    class="min-h-[8rem] max-h-[24rem] overflow-y-auto p-3 text-sm prose prose-sm dark:prose-invert max-w-none focus-within:outline-none"
  ></div>
</div>

<style>
  :global(.tiptap p.is-editor-empty:first-child::before) {
    content: attr(data-placeholder);
    float: left;
    color: var(--color-surface-400);
    pointer-events: none;
    height: 0;
  }
  :global(.tiptap:focus) { outline: none; }
  :global(.tiptap ul)  { list-style: disc;    padding-left: 1.5rem; }
  :global(.tiptap ol)  { list-style: decimal; padding-left: 1.5rem; }
  :global(.tiptap blockquote) {
    border-left: 3px solid var(--color-primary-500);
    padding-left: 0.75rem;
    opacity: 0.8;
  }
</style>
