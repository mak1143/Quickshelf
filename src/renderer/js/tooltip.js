// In-window tooltips.
//
// Native `title` tooltips are drawn by the browser as a separate popup window,
// which on Wayland shows up outside Quickshelf's container. Instead, elements
// carry `data-tip="..."` and a single layer inside #shell renders the text,
// clamped to the shell's bounds.

const SHOW_DELAY_MS = 350;
const GAP = 4;
const EDGE_PADDING = 6;

const shell = document.getElementById('shell');
const layer = document.getElementById('tooltip');

let showTimer = null;
let activeAnchor = null;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function cancelTimer() {
  if (showTimer !== null) {
    clearTimeout(showTimer);
    showTimer = null;
  }
}

function place(anchor) {
  const bounds = shell.getBoundingClientRect();
  const rect = anchor.getBoundingClientRect();
  const tip = layer.getBoundingClientRect();

  const minX = bounds.left + EDGE_PADDING;
  const maxX = bounds.right - EDGE_PADDING - tip.width;
  const x = clamp(rect.left + rect.width / 2 - tip.width / 2, minX, maxX);

  let y = rect.bottom + GAP;
  if (y + tip.height > bounds.bottom - EDGE_PADDING) {
    y = rect.top - GAP - tip.height;
  }
  y = clamp(
    y,
    bounds.top + EDGE_PADDING,
    bounds.bottom - EDGE_PADDING - tip.height,
  );

  layer.style.left = `${Math.round(x)}px`;
  layer.style.top = `${Math.round(y)}px`;
}

function show(anchor) {
  const text = anchor?.dataset.tip;
  if (!text || !layer || !shell) return;

  layer.textContent = text;
  layer.dataset.visible = 'true';
  layer.setAttribute('aria-hidden', 'false');
  place(anchor);
}

function hide() {
  cancelTimer();
  activeAnchor = null;
  if (!layer) return;

  layer.dataset.visible = 'false';
  layer.setAttribute('aria-hidden', 'true');
}

function schedule(anchor) {
  cancelTimer();
  showTimer = setTimeout(() => {
    showTimer = null;
    show(anchor);
  }, SHOW_DELAY_MS);
}

export function initTooltips() {
  if (!layer || !shell) return;

  document.addEventListener('pointerover', (event) => {
    const anchor = event.target.closest?.('[data-tip]');
    if (!anchor || anchor === activeAnchor) return;

    activeAnchor = anchor;
    schedule(anchor);
  });

  document.addEventListener('pointerout', (event) => {
    if (!activeAnchor) return;
    // Moving between children of the same anchor is not leaving it.
    if (activeAnchor.contains(event.relatedTarget)) return;

    activeAnchor = null;
    hide();
  });

  // Keyboard users get the tooltip immediately, without the hover delay.
  document.addEventListener('focusin', (event) => {
    const anchor = event.target.closest?.('[data-tip]');
    if (!anchor) return;

    activeAnchor = anchor;
    cancelTimer();
    show(anchor);
  });

  document.addEventListener('focusout', (event) => {
    if (!activeAnchor) return;
    if (activeAnchor.contains(event.relatedTarget)) return;

    hide();
  });

  document.addEventListener('pointerdown', hide);
  window.addEventListener('resize', () => {
    if (activeAnchor) place(activeAnchor);
  });
}
