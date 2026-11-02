# Quickshelf — Plan

A small, cross-platform desktop "shelf + clipboard + todo" utility built with Electron, HTML, Tailwind, and Basecoat UI. It lives as a floating window that stays on top of your workspace and is summoned with a keybinding (Hyprland on Linux; global shortcut on Windows/macOS).

## 1. Reference: what PerchShelf does

Source: https://perchshelf.hayasaka.app/ (Windows 10/11 app, reference only — we are building our own).

Core behaviour to mirror:

- A shelf opens while you drag a file; you drop files on it and drag them out later.
- The shelf stores **links** to files, not copies, so drops are instant.
- Multiple shelves/tabs, a "All" row, and right-click actions (open, show in folder, copy path).
- Summon/hide with a keyboard shortcut (`Ctrl+Shift+F` in the reference).
- Lives in the tray, hides itself when empty, persists across restarts.
- Does not open over fullscreen apps; stays local with no account or analytics.

What we will **not** copy: the branding, copy text, the Store-only distribution, and the "shake the mouse" trigger (see risks).

## 2. Product scope (MVP)

### 2.1 Shelf (drag-and-drop staging)

- Drop files/folders onto the window → stored as path references in a local JSON store.
- Drag items out of the window (Electron `webContents.startDrag`) to other apps.
- Remove, rename label, open, show in folder, copy path.
- Multiple tabs (named shelves), drop on `+` to create one.
- Persist across restarts; clear-all action.

### 2.2 Clipboard history

- Records text and images copied system-wide.
- Polls Electron's `clipboard` module (~500 ms) and dedupes consecutive identical entries.
- List view with search; click to copy back; pin favourite entries; cap history (default 200).
- Optional ignore list for password managers (by app name where the OS exposes it).

### 2.3 Todo

- Add, check off, edit, delete tasks; drag to reorder.
- Simple optional due date and "today" filter.
- Stored locally in the same data folder as the shelf.

### 2.4 Window behaviour ("sticky")

- Frameless, always-on-top, skip-taskbar, hidden by default.
- Toggled by a keybinding, not by global hooks alone (Wayland blocks most global hooks).
- Position remembered per monitor; can be docked to a screen edge.

## 3. Tech stack

| Layer         | Choice                                  | Notes                                                                                                                                    |
| ------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Shell         | Electron (latest stable)                | Cross-platform: Linux, Windows, macOS                                                                                                    |
| UI            | Plain HTML + JS (ES modules)            | No framework; keep it small                                                                                                              |
| Styling       | Tailwind CSS v4                         | Utility classes for layout                                                                                                               |
| Components    | Basecoat UI (`basecoat-css`)            | Verify package name/version before install                                                                                               |
| Design tokens | `token.css`                             | Single source of CSS custom properties: colours, radii, spacing, type, shadows; light + dark via `prefers-color-scheme` and `data-theme` |
| Storage       | JSON files in `app.getPath('userData')` | Via a tiny store module; move to SQLite only if needed                                                                                   |
| Packaging     | electron-builder                        | AppImage + deb (Linux), NSIS (Windows), dmg (macOS)                                                                                      |

### Project layout (proposed)

```
quickshelf/
├─ plan.md
├─ package.json
├─ electron-builder.yml
├─ src/
│  ├─ main/
│  │  ├─ main.js            # window, tray, single-instance, IPC
│  │  ├─ window.js          # frameless, always-on-top, toggle, position memory
│  │  ├─ clipboard-watch.js # clipboard polling + history
│  │  ├─ store.js           # JSON persistence (shelf, todo, clipboard)
│  │  └─ cli.js             # handles `quickshelf --toggle` / `quickshelf --show` / `quickshelf --hide`
│  ├─ preload/
│  │  └─ preload.js         # contextBridge API (no nodeIntegration)
│  └─ renderer/
│     ├─ index.html
│     ├─ styles/
│     │  ├─ token.css       # design tokens (source of truth)
│     │  └─ app.css         # Tailwind entry + Basecoat import
│     ├─ js/
│     │  ├─ shelf.js
│     │  ├─ clipboard.js
│     │  ├─ todo.js
│     │  └─ tabs.js
│     └─ components/        # Basecoat markup snippets if reused
└─ build/                   # icons
```

## 4. Hyprland integration (Linux)

- Launch Electron with Wayland flags: `--ozone-platform=wayland --enable-features=WaylandWindowDecorations`.
- Single instance: `app.requestSingleInstanceLock()`. A second launch with `--toggle` sends a message to the running instance, which shows or hides the window. This is what the keybinding calls.
- Example keybinding (add to `hyprland.conf`):
  ```
  bind = SUPER, A, exec, quickshelf --toggle
  ```
- Example window rules so the window floats, stays on all workspaces, and stays on top. The Hyprland 0.57 windowrule syntax changed across versions, so check the wiki before applying:
  ```
  windowrule = float, class:^(quickshelf)$
  windowrule = pin, class:^(quickshelf)$
  windowrule = size 360 640, class:^(quickshelf)$
  ```
- `pin` keeps the window visible across workspaces, which gives the "sticky" behaviour.
- A `hyprctl` fallback can position the window if needed.

## 5. Cross-platform notes

- **Windows / macOS:** use `globalShortcut` for the toggle and `app.setLoginItemSettings` for auto-start. Tray icon on all platforms.
- **Linux:** the keybinding comes from Hyprland, not Electron. The tray may need `libappindicator` depending on the desktop.
- Keep all OS-specific code behind `process.platform` checks in the main process only.

## 6. Build phases

1. **Scaffold** — Electron + Vite (or plain esbuild), Tailwind, Basecoat, `token.css`, empty frameless window, single-instance toggle, Hyprland rule.
2. **Shelf** — drop in, list, drag out, tabs, persistence.
3. **Clipboard** — polling watcher, history list, search, pin, copy back.
4. **Todo** — CRUD, reorder, persistence.
5. **Polish** — tokens for light/dark, keyboard navigation, empty states, tray menu, settings (shortcut, history size).
6. **Package & test** — AppImage/deb on Garuda, plus Windows and macOS builds; test under Hyprland with the pinned window.

## 7. Risks and mitigations

| Risk                                        | Impact                                | Mitigation                                                        |
| ------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------- |
| Shake-to-open needs global mouse hooks      | Not reliable on Wayland               | Dropped; use keybinding and a drag-target edge strip instead      |
| Dragging files _out_ of Electron on Wayland | Known to be flaky in some compositors | Test early in phase 2; fall back to "copy path" or open-in-folder |
| Global shortcuts blocked on Wayland         | Keybinding must come from Hyprland    | Already the plan (single-instance `--toggle`)                     |
| Clipboard polling captures secrets          | Privacy                               | Ignore list, auto-expire, and a "pause history" toggle            |
| Basecoat/Tailwind version drift             | Broken styles                         | Pin versions in `package.json`                                    |

## 8. Decisions

1. **Name:** **Quickshelf**. Binary/command: `quickshelf`. Working folder name: `quickshelf/`.
2. **Platforms:** Linux (Hyprland) first. Windows and macOS come after the Linux build is stable.
3. **Shelf items:** store links (path references) only for MVP. Files are never copied unless the user explicitly chooses "copy into Quickshelf".
4. **Clipboard:** text and images. History cap 200 entries (configurable).
5. **Todo:** due dates and priorities (None / Low / Medium / High), plus a "Today" filter.
6. **Window:** resizable. Supports both **free-floating** (default) and **docked to a screen edge** (left/right/top/bottom, chosen in settings).
7. **Shortcut:** `SUPER+A` → `quickshelf --toggle`.
8. **Component library:** `basecoat-css`, to be verified at install time.
9. **Packaging:** see section 9.
10. **Auto-start:** **No.** Quickshelf must work right after install without any login-time setup.
11. **Clean-room approach:** see section 8a.
12. **Licence:** MIT. Applies to Quickshelf's own code. Any third-party dependency keeps its own licence.
13. **Colour palette:** derived from the Apple Podcasts web player (https://podcasts.apple.com/us/), colours only, extracted with Playwright into `src/renderer/styles/token.css` (HSL). No layout, copy, icons, or code from that site.

## 8a. Clean-room approach (proposed)

Goal: build Quickshelf from its own specification, without copying code from any existing product.

- **Spec source:** only public material: this plan, the public PerchShelf web page (marketing and feature descriptions), and official Electron, Hyprland, Tailwind and Basecoat documentation.
- **No copied code:** no code, assets, icons, text or branding from PerchShelf or any other shelf app.
- **Reference repo, `morluto/rea` (MIT):** REA is an MCP server and CLI for reverse engineering binaries and apps. It is not a shelf, clipboard or todo app, so it is not a source for Quickshelf's features. Its MIT licence allows reuse with attribution, but it is not in the plan as a dependency.
- **Open question:** using REA to analyse another app's binary (for example PerchShelf) to copy its behaviour is not part of this plan. PerchShelf is a paid, proprietary product, and reverse-engineering it to clone it is a legal risk. If the goal is to analyse a product you own or are authorised to examine, confirm that first.
- **Clean-room rule:** anyone writing Quickshelf code should not read PerchShelf's binaries or source. Behaviour comes from the spec only.

## 9. Packaging (explained)

Goal: a user installs once, runs `quickshelf` from the terminal, and the Hyprland keybinding works immediately.

### What gets built

| Target                | Tool                                   | Output                                  | Who it's for                                         |
| --------------------- | -------------------------------------- | --------------------------------------- | ---------------------------------------------------- |
| AppImage              | electron-builder                       | One portable `Quickshelf.AppImage` file | Any Linux distro, no install step                    |
| Arch / Garuda package | hand-written `PKGBUILD` (pacman / AUR) | `quickshelf-<ver>.pkg.tar.zst`          | Installs `/usr/bin/quickshelf` and an app menu entry |
| `.deb`                | electron-builder                       | `quickshelf_<ver>_amd64.deb`            | Debian / Ubuntu (later)                              |

Garuda is Arch-based and electron-builder does not output pacman packages, so the `PKGBUILD` is written by hand. It is the path that makes `quickshelf` land on `$PATH` automatically.

### The "just works" requirements

1. **`quickshelf` on `$PATH`.** The keybinding calls `quickshelf --toggle`. An AppImage sitting in `~/Downloads` is not on `$PATH`, so the AppImage flow needs a small install script that copies it to `~/.local/bin/quickshelf` and makes it executable. The pacman package does this via `/usr/bin`.
2. **Desktop entry.** A `.desktop` file so it appears in the app launcher, with the icon.
3. **Hyprland config.** Print the two lines to add (`bind` and `windowrule`), or have `quickshelf --setup-hyprland` append them to `~/.config/hypr/hyprland.conf` after asking. Prefer the printed lines in v1; the automatic version is a later option.
4. **No login item.** Nothing is registered to start at login.
5. **Single instance.** Running `quickshelf` while it is already open just shows the window instead of opening a second copy.
6. **Dependencies declared.** The `PKGBUILD` lists runtime libs (for example `libappindicator-gtk3` if the tray is used, plus `nss`, `libxss` and similar Electron deps) so nothing is missing on first run.

### Updates

- AppImage: no built-in updater in v1. Users download the new file.
- Pacman / AUR: `pacman -Syu` only updates packages from official repos. An AUR package needs an AUR helper (`yay -Syu` or `paru -Syu`). Deferred until the AUR package exists.
- Auto-update via `electron-updater` (AppImage supported on Linux, checks GitHub Releases) is deferred to a later phase.

### Windows and macOS (later)

- **Windows:** NSIS `.exe` installer. Unsigned builds trigger a SmartScreen warning. A code-signing certificate removes it but costs money.
- **macOS:** `.dmg`. Unsigned builds are blocked by Gatekeeper. Distribution outside the Mac App Store needs an Apple Developer account for signing and notarization.

### Build order

1. `npm run build` (bundles the renderer with Vite and Tailwind).
2. electron-builder produces the AppImage in `dist/`.
3. `PKGBUILD` packages the same app files for Garuda.
4. Test on Garuda: install the package, press `SUPER+A`, confirm the window floats, stays pinned, and resizes.
