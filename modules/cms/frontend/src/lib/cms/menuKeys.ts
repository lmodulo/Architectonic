// Keyboard support for the desktop site menu's dropdowns and flyouts (disclosure pattern).
// Each open submenu is a <ul>; each of its <li> rows has one primary focusable marked
// [data-menu-row] (a link, or a label's toggle) and, when it has children, a [data-menu-toggle].
import { tick } from 'svelte';

function rowsOf(ul: HTMLElement): HTMLElement[] {
  return [...ul.children].flatMap(li => {
    const el = li.querySelector<HTMLElement>('[data-menu-row]');
    return el && el.closest('ul') === ul ? [el] : [];
  });
}

/** Focuses the first row of a submenu once it has rendered. */
export async function focusFirstRow(container: HTMLElement | null | undefined): Promise<void> {
  await tick();
  const ul = container?.querySelector<HTMLElement>('ul');
  if (ul) rowsOf(ul)[0]?.focus();
}

/**
 * Arrow keys inside one open submenu: Up/Down/Home/End move between rows, Right opens a row's
 * flyout and focuses its first item, Left and Escape call `close` (which closes this submenu and
 * refocuses its toggle). Keys from a nested submenu are left to that submenu's own handler.
 */
export function submenuKeydown(e: KeyboardEvent, ul: HTMLElement, close: () => void): void {
  const target = e.target as HTMLElement;
  if (target.closest('ul') !== ul) return;
  const rows = rowsOf(ul);
  const li = target.closest('li');
  const index = rows.findIndex(r => r.closest('li') === li);

  const move = (i: number) => { e.preventDefault(); rows[(i + rows.length) % rows.length]?.focus(); };
  switch (e.key) {
    case 'ArrowDown': return move(index + 1);
    case 'ArrowUp':   return move(index - 1);
    case 'Home':      return move(0);
    case 'End':       return move(rows.length - 1);
    case 'ArrowRight': {
      const toggle = li?.querySelector<HTMLButtonElement>('[data-menu-toggle]');
      if (toggle && toggle.closest('ul') === ul) {
        e.preventDefault();
        e.stopPropagation();
        if (toggle.getAttribute('aria-expanded') !== 'true') toggle.click();
        void focusFirstRow(li);
      }
      return;
    }
    case 'ArrowLeft':
    case 'Escape':
      e.preventDefault();
      e.stopPropagation();
      close();
  }
}
