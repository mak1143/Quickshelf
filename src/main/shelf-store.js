const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { isInsideDir } = require('./path-utils');

const STORE_VERSION = 1;

function createTab(name) {
  return { id: crypto.randomUUID(), name, items: [] };
}

function createLinkItem(filePath, isDirectory = false) {
  return {
    id: crypto.randomUUID(),
    kind: 'link',
    path: filePath,
    name: path.basename(filePath) || filePath,
    mime: null,
    preview: null,
    isDirectory,
    createdAt: Date.now(),
  };
}

function createOwnedItem({ filePath, name, mime, preview }) {
  return {
    id: crypto.randomUUID(),
    kind: 'owned',
    path: filePath,
    name: name || path.basename(filePath),
    mime: mime || null,
    preview: preview || null,
    createdAt: Date.now(),
  };
}

function defaultState() {
  const tab = createTab('Shelf 1');
  return { version: STORE_VERSION, activeTabId: tab.id, tabs: [tab] };
}

function normalizeItem(raw, ownedDir) {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.path !== 'string' || !raw.path) return null;

  const kind = raw.kind === 'owned' ? 'owned' : 'link';
  if (kind === 'owned' && (!ownedDir || !isInsideDir(ownedDir, raw.path))) return null;

  return {
    id: typeof raw.id === 'string' ? raw.id : crypto.randomUUID(),
    kind,
    path: raw.path,
    name: typeof raw.name === 'string' && raw.name ? raw.name : path.basename(raw.path),
    mime: typeof raw.mime === 'string' ? raw.mime : null,
    preview: typeof raw.preview === 'string' ? raw.preview : null,
    isDirectory: Boolean(raw.isDirectory),
    createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now(),
  };
}

function normalizeState(raw, ownedDir) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.tabs)) return defaultState();
  const tabs = raw.tabs
    .filter((tab) => tab && typeof tab === 'object')
    .map((tab) => ({
      id: typeof tab.id === 'string' ? tab.id : crypto.randomUUID(),
      name: typeof tab.name === 'string' && tab.name ? tab.name : 'Shelf',
      items: Array.isArray(tab.items) ? tab.items.map((item) => normalizeItem(item, ownedDir)).filter(Boolean) : [],
    }));
  if (tabs.length === 0) return defaultState();
  const activeTabId = tabs.some((tab) => tab.id === raw.activeTabId) ? raw.activeTabId : tabs[0].id;
  return { version: STORE_VERSION, activeTabId, tabs };
}

class ShelfStore {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.storePath = path.join(baseDir, 'shelf.json');
    this.webDir = path.join(baseDir, 'web');
    this.state = defaultState();
  }

  load() {
    try {
      const raw = fs.readFileSync(this.storePath, 'utf8');
      this.state = normalizeState(JSON.parse(raw), this.webDir);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Could not read shelf store:', error.message);
      }
    }
    return this.state;
  }

  save() {
    fs.mkdirSync(this.baseDir, { recursive: true });
    const tmp = `${this.storePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.state, null, 2));
    fs.renameSync(tmp, this.storePath);
  }

  getState() {
    return this.state;
  }

  getTab(tabId) {
    return this.state.tabs.find((tab) => tab.id === tabId) || null;
  }

  getActiveTab() {
    return this.getTab(this.state.activeTabId) || this.state.tabs[0] || null;
  }

  addTab(name) {
    const label = typeof name === 'string' && name.trim() ? name.trim() : `Shelf ${this.state.tabs.length + 1}`;
    const tab = createTab(label.slice(0, 60));
    this.state.tabs.push(tab);
    this.state.activeTabId = tab.id;
    this.save();
    return this.state;
  }

  renameTab(tabId, name) {
    const tab = this.getTab(tabId);
    const next = typeof name === 'string' ? name.trim() : '';
    if (tab && next) {
      tab.name = next.slice(0, 60);
      this.save();
    }
    return this.state;
  }

  deleteTab(tabId) {
    if (this.state.tabs.length <= 1) return { state: this.state, removed: [] };
    const index = this.state.tabs.findIndex((tab) => tab.id === tabId);
    if (index === -1) return { state: this.state, removed: [] };
    const [tab] = this.state.tabs.splice(index, 1);
    if (this.state.activeTabId === tabId) {
      this.state.activeTabId = this.state.tabs[Math.min(index, this.state.tabs.length - 1)].id;
    }
    this.save();
    return { state: this.state, removed: tab.items };
  }

  setActiveTab(tabId) {
    if (this.getTab(tabId)) {
      this.state.activeTabId = tabId;
      this.save();
    }
    return this.state;
  }

  addItems(tabId, items) {
    const tab = this.getTab(tabId) || this.getActiveTab();
    if (!tab || items.length === 0) return this.state;
    tab.items.push(...items);
    this.save();
    return this.state;
  }

  removeItem(tabId, itemId) {
    const tab = this.getTab(tabId);
    if (!tab) return { state: this.state, removed: null };
    const index = tab.items.findIndex((item) => item.id === itemId);
    if (index === -1) return { state: this.state, removed: null };
    const [item] = tab.items.splice(index, 1);
    this.save();
    return { state: this.state, removed: item };
  }

  clearTab(tabId) {
    const tab = this.getTab(tabId);
    if (!tab) return { state: this.state, removed: [] };
    const removed = tab.items.splice(0);
    this.save();
    return { state: this.state, removed };
  }

  findItem(tabId, itemId) {
    const tab = this.getTab(tabId);
    if (!tab) return null;
    return tab.items.find((item) => item.id === itemId) || null;
  }
}

module.exports = { ShelfStore, createLinkItem, createOwnedItem };
