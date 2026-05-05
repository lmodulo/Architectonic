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

<div class="flex flex-col border border-surface-200-800 rounded-base overflow-hidden">
  <!-- Toolbar -->
  <div class="flex items-center gap-0.5 px-2 py-1.5 border-b border-surface-200-800 flex-wrap">
    <button type="button"
      class="btn-icon btn-sm {active('bold') ? 'preset-tonal-primary' : 'hover:preset-tonal'}"
      onmousedown={cmd(() => editor?.chain().toggleBold().run())}
      aria-label="Bold" title="Bold"
    ><Bold class="size-3.5" /></button>

    <button type="button"
      class="btn-icon btn-sm {active('italic') ? 'preset-tonal-primary' : 'hover:preset-tonal'}"
      onmousedown={cmd(() => editor?.chain().toggleItalic().run())}
      aria-label="Italic" title="Italic"
    ><Italic class="size-3.5" /></button>

    <button type="button"
      class="btn-icon btn-sm {active('underline') ? 'preset-tonal-primary' : 'hover:preset-tonal'}"
      onmousedown={cmd(() => editor?.chain().toggleUnderline().run())}
      aria-label="Underline" title="Underline"
    ><UnderlineIcon class="size-3.5" /></button>

    <span class="w-px h-4 bg-surface-300-700 mx-1 opacity-60"></span>

    <button type="button"
      class="btn-icon btn-sm {active('bulletList') ? 'preset-tonal-primary' : 'hover:preset-tonal'}"
      onmousedown={cmd(() => editor?.chain().toggleBulletList().run())}
      aria-label="Bullet list" title="Bullet list"
    ><List class="size-3.5" /></button>

    <button type="button"
      class="btn-icon btn-sm {active('orderedList') ? 'preset-tonal-primary' : 'hover:preset-tonal'}"
      onmousedown={cmd(() => editor?.chain().toggleOrderedList().run())}
      aria-label="Ordered list" title="Ordered list"
    ><ListOrdered class="size-3.5" /></button>

    <span class="w-px h-4 bg-surface-300-700 mx-1 opacity-60"></span>

    <button type="button"
      class="btn-icon btn-sm {active('blockquote') ? 'preset-tonal-primary' : 'hover:preset-tonal'}"
      onmousedown={cmd(() => editor?.chain().toggleBlockquote().run())}
      aria-label="Blockquote" title="Blockquote"
    ><TextQuote class="size-3.5" /></button>

    <span class="w-px h-4 bg-surface-300-700 mx-1 opacity-60"></span>

    <button type="button"
      class="btn-icon btn-sm hover:preset-tonal"
      onmousedown={cmd(() => editor?.chain().undo().run())}
      aria-label="Undo" title="Undo"
    ><Undo class="size-3.5" /></button>

    <button type="button"
      class="btn-icon btn-sm hover:preset-tonal"
      onmousedown={cmd(() => editor?.chain().redo().run())}
      aria-label="Redo" title="Redo"
    ><Redo class="size-3.5" /></button>
  </div>

  <!-- Editor area -->
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
