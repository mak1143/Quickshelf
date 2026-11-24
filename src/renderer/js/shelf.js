const api = window.quickshelf?.shelf;

const tabsEl = document.getElementById('tabs');
const itemsEl = document.getElementById('items');
const emptyEl = document.getElementById('empty');
const dropzone = document.getElementById('dropzone');

let state = { tabs: [], activeTabId: null };

function activeTab() {
  return state.tabs.find((tab) => tab.id === state.activeTabId) || state.tabs[0] || null;
}

function setState(next) {
  if (next && Array.isArray(next.tabs)) {
    state = next;
    render();
  }
}

function render() {
  renderTabs();
  renderItems();
}

function renderTabs() {
  tabsEl.replaceChildren();

  for (const tab of state.tabs) {
    const tabEl = document.createElement('div');
    tabEl.className = [
      'group flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded px-2 text-[0.75rem]',
      'outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]',
      tab.id === state.activeTabId
        ? 'bg-[var(--color-fill-strong)] text-[var(--color-text)]'
        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-fill)]',
    ].join(' ');
    tabEl.dataset.tip = `${tab.items.length} item${tab.items.length === 1 ? '' : 's'} — double-click to rename, × or right-click to delete`;
    tabEl.setAttribute('role', 'tab');
    tabEl.setAttribute('aria-selected', String(tab.id === state.activeTabId));
    tabEl.tabIndex = 0;

    const nameEl = document.createElement('span');
    nameEl.className = 'max-w-[8rem] truncate';
    nameEl.textContent = tab.name;
    tabEl.append(nameEl);

    if (state.tabs.length > 1) {
      const removeTab = document.createElement('button');
      removeTab.type = 'button';
      removeTab.className = [
        'ml-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded text-[0.6875rem] leading-none',
        'text-[var(--color-text-tertiary)] hover:bg-[var(--color-fill-strong)] hover:text-[var(--color-text)]',
        tab.id === state.activeTabId
          ? 'opacity-100'
          : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100',
      ].join(' ');
      removeTab.textContent = '×';
      removeTab.dataset.tip = `Delete ${tab.name}`;
      removeTab.setAttribute('aria-label', `Delete ${tab.name}`);
      removeTab.addEventListener('click', (event) => {
        event.stopPropagation();
        void api.deleteTab(tab.id).then(setState);
      });
      tabEl.append(removeTab);
    }

    tabEl.addEventListener('click', () => {
      if (tab.id !== state.activeTabId) void api.setActiveTab(tab.id).then(setState);
    });
    tabEl.addEventListener('dblclick', () => beginRename(tab, tabEl));
    tabEl.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      void api.showTabMenu(tab.id);
    });
    tabEl.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (tab.id !== state.activeTabId) void api.setActiveTab(tab.id).then(setState);
      } else if (event.key === 'F2') {
        event.preventDefault();
        beginRename(tab, tabEl);
      } else if (event.key === 'Delete' && state.tabs.length > 1) {
        event.preventDefault();
        void api.deleteTab(tab.id).then(setState);
      }
    });

    tabsEl.append(tabEl);
  }

  const addButton = document.createElement('button');
  addButton.type = 'button';
  addButton.className =
    'ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded text-[0.875rem] text-[var(--color-text-secondary)] hover:bg-[var(--color-fill)] hover:text-[var(--color-text)]';
  addButton.textContent = '+';
  addButton.dataset.tip = 'New shelf — or drop items here';
  addButton.addEventListener('click', () => {
    void api.addTab().then(setState);
  });
  addButton.addEventListener('dragover', (event) => {
    event.preventDefault();
    addButton.classList.add('bg-[var(--color-fill-strong)]');
  });
  addButton.addEventListener('dragleave', () => {
    addButton.classList.remove('bg-[var(--color-fill-strong)]');
  });
  addButton.addEventListener('drop', (event) => {
    event.preventDefault();
    addButton.classList.remove('bg-[var(--color-fill-strong)]');
    void handleDrop(event, null, true);
  });
  tabsEl.append(addButton);
}

function beginRename(tab, tabEl) {
  const input = document.createElement('input');
  input.value = tab.name;
  input.className =
    'w-24 rounded bg-[var(--color-bg)] px-1 text-[0.75rem] text-[var(--color-text)] outline-none ring-1 ring-[var(--color-accent)]';
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      input.blur();
    } else if (event.key === 'Escape') {
      input.value = tab.name;
      input.blur();
    }
  });
  input.addEventListener('blur', () => {
    const name = input.value.trim();
    if (name && name !== tab.name) void api.renameTab({ tabId: tab.id, name }).then(setState);
    else render();
  });
  tabEl.replaceChildren(input);
  input.focus();
  input.select();
}

function renderItems() {
  const tab = activeTab();
  itemsEl.replaceChildren();

  if (!tab || tab.items.length === 0) {
    emptyEl.classList.remove('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  for (const item of tab.items) itemsEl.append(createItemElement(tab, item));
}

function createItemElement(tab, item) {
  const li = document.createElement('li');
  li.className =
    'group flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 outline-none hover:bg-[var(--color-fill)] focus-visible:bg-[var(--color-fill)] focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]';
  li.draggable = true;
  li.tabIndex = 0;
  li.dataset.tip = item.path;

  li.addEventListener('dragstart', (event) => {
    event.preventDefault();
    api.dragOut({ tabId: tab.id, itemId: item.id });
  });
  li.addEventListener('click', () => {
    void api.openItem({ tabId: tab.id, itemId: item.id });
  });
  li.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void api.openItem({ tabId: tab.id, itemId: item.id });
    } else if (event.key === 'Delete') {
      event.preventDefault();
      void api.removeItem({ tabId: tab.id, itemId: item.id }).then(setState);
    }
  });
  li.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    void api.showMenu({ tabId: tab.id, itemId: item.id });
  });

  const badge = document.createElement('span');
  badge.className =
    'flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[var(--color-fill-strong)] text-[0.625rem] font-semibold uppercase text-[var(--color-text-secondary)]';
  badge.textContent = badgeLabel(item);

  const text = document.createElement('div');
  text.className = 'min-w-0 flex-1';

  const name = document.createElement('p');
  name.className = 'truncate text-[0.8125rem] text-[var(--color-text)]';
  name.textContent = item.name;

  const preview = document.createElement('p');
  preview.className = 'truncate text-[0.6875rem] text-[var(--color-text-tertiary)]';
  preview.textContent = item.preview || item.path;

  text.append(name, preview);

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className =
    'ml-1 hidden h-6 w-6 shrink-0 items-center justify-center rounded text-[var(--color-text-secondary)] hover:bg-[var(--color-fill-strong)] hover:text-[var(--color-text)] group-hover:flex group-focus-visible:flex';
  remove.textContent = '×';
  remove.dataset.tip = 'Remove from shelf';
  remove.setAttribute('aria-label', `Remove ${item.name} from shelf`);
  remove.addEventListener('click', (event) => {
    event.stopPropagation();
    void api.removeItem({ tabId: tab.id, itemId: item.id }).then(setState);
  });

  li.append(badge, text, remove);
  return li;
}

function badgeLabel(item) {
  if (item.isDirectory) return 'DIR';
  if (item.path.toLowerCase().endsWith('.url')) return 'URL';
  if (item.path.toLowerCase().endsWith('.txt')) return 'TXT';
  const extension = item.path.split('.').pop();
  if (extension && extension.length <= 4 && extension !== item.path) return extension;
  return item.kind === 'owned' ? 'WEB' : 'FILE';
}

function uriToPath(uri) {
  try {
    const url = new URL(uri);
    if (url.protocol !== 'file:') return null;
    let filePath = decodeURIComponent(url.pathname);
    if (/^\/[A-Za-z]:/.test(filePath)) filePath = filePath.slice(1);
    return filePath || null;
  } catch {
    return null;
  }
}

function pathForFile(file) {
  try {
    return window.quickshelf?.getPathForFile?.(file) || null;
  } catch {
    return null;
  }
}

async function handleDrop(event, tabId, createTab = false) {
  if (!api) return;
  const transfer = event.dataTransfer;
  if (!transfer) return;

  try {
    let nextState = state;
    let targetTabId = tabId;

    if (createTab) {
      nextState = await api.addTab();
      targetTabId = nextState.activeTabId;
    }

    const uris = transfer
      .getData('text/uri-list')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));

    const paths = new Set();
    for (const uri of uris) {
      const filePath = uriToPath(uri);
      if (filePath) paths.add(filePath);
    }
    for (const file of Array.from(transfer.files || [])) {
      const filePath = pathForFile(file);
      if (filePath) paths.add(filePath);
    }

    if (paths.size > 0) {
      nextState = await api.addPaths({ paths: Array.from(paths), tabId: targetTabId });
      setState(nextState);
      return;
    }

    const imageFiles = Array.from(transfer.files || []).filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      for (const file of imageFiles) {
        try {
          const data = new Uint8Array(await file.arrayBuffer());
          nextState = await api.addWeb({
            kind: 'image',
            name: file.name,
            mime: file.type,
            data,
            tabId: targetTabId,
          });
        } catch (error) {
          console.error('Could not add image:', error);
        }
      }
      setState(nextState);
      return;
    }

    const links = uris.filter((uri) => /^https?:\/\//i.test(uri));
    if (links.length > 0) {
      for (const url of links) {
        try {
          nextState = await api.addWeb({ kind: 'link', url, tabId: targetTabId });
        } catch (error) {
          console.error('Could not add link:', error);
        }
      }
      setState(nextState);
      return;
    }

    const text = transfer.getData('text/plain');
    if (text.trim()) {
      nextState = await api.addWeb({ kind: 'text', text, tabId: targetTabId });
      setState(nextState);
    }
  } catch (error) {
    console.error('Shelf drop failed:', error);
  }
}

export function initShelf() {
  if (!api) return;

  dropzone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropzone.classList.add('bg-[var(--color-fill)]');
  });
  dropzone.addEventListener('dragleave', (event) => {
    if (!dropzone.contains(event.relatedTarget)) dropzone.classList.remove('bg-[var(--color-fill)]');
  });
  dropzone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropzone.classList.remove('bg-[var(--color-fill)]');
    const tab = activeTab();
    void handleDrop(event, tab?.id || null);
  });

  api.onStateChanged(setState);
  void api.getState().then(setState);
}
