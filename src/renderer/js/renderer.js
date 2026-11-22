import { initShelf } from './shelf.js';
import { initTooltips } from './tooltip.js';

const quitButton = document.getElementById('quit');

if (quitButton) {
  quitButton.addEventListener('click', () => {
    window.quickshelf?.quit();
  });
}

initShelf();
initTooltips();
