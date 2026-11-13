export function dragScroll(node: HTMLElement) {
  let startX = 0;
  let scrollLeft = 0;
  let dragging = false;
  let moved = false;

  function onMouseDown(e: MouseEvent) {
    dragging = true;
    moved = false;
    startX = e.pageX - node.offsetLeft;
    scrollLeft = node.scrollLeft;
  }

  function onMouseMove(e: MouseEvent) {
    if (!dragging) return;
    const walk = (e.pageX - node.offsetLeft) - startX;
    if (Math.abs(walk) > 4) {
      moved = true;
      node.scrollLeft = scrollLeft - walk;
    }
  }

  function onMouseUp() { dragging = false; }
  function onMouseLeave() { dragging = false; }

  // Suppress the click that follows a drag so tab links don't navigate
  function onClick(e: MouseEvent) {
    if (moved) { e.preventDefault(); moved = false; }
  }

  node.addEventListener('mousedown', onMouseDown);
  node.addEventListener('mousemove', onMouseMove);
  node.addEventListener('mouseup', onMouseUp);
  node.addEventListener('mouseleave', onMouseLeave);
  node.addEventListener('click', onClick, true);

  return {
    destroy() {
      node.removeEventListener('mousedown', onMouseDown);
      node.removeEventListener('mousemove', onMouseMove);
      node.removeEventListener('mouseup', onMouseUp);
      node.removeEventListener('mouseleave', onMouseLeave);
      node.removeEventListener('click', onClick, true);
    },
  };
}
