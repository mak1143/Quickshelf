import { initShelf } from './shelf.js';

const quitButton = document.getElementById('quit');

if (quitButton) {
  quitButton.addEventListener('click', () => {
    window.quickshelf?.quit();
  });
}

initShelf();
