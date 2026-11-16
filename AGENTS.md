# AGENTS.md — Quickshelf agent instructions

Read this file before you change anything. If it disagrees with `plan.md`, `plan.md` wins — tell the user about the conflict. `plan.md` is a local-only file: it is gitignored and never published.

## 1. Project in one paragraph

Quickshelf is a small, cross-platform desktop utility with three parts in one floating window: a drag-and-drop shelf (stores links to local files and saves browser drops as files), a clipboard history, and a todo list with due dates and priorities. It is built with Electron, plain HTML and JavaScript, Tailwind CSS, Basecoat UI (`basecoat-css`), and a `token.css` design-token file. Linux (Hyprland) is the first target. Windows and macOS come later.

## 1a. Clean-room rules

- Build Quickshelf from `plan.md` and public documentation only.
- Do not copy code, assets, icons, or text from PerchShelf or any other shelf app.
- `morluto/rea` (MIT) is a reverse-engineering tool. It is not a dependency and not a feature source. Do not use it to analyse PerchShelf or other proprietary apps without the user's explicit confirmation of ownership or authorisation.

## 2. Source of truth

- `plan.md` is the full specification: scope, architecture, build phases, decisions, risks, and packaging. It stays local: `.gitignore` excludes it, so it never appears in the repository or on GitHub.
- `README.md` is the public-facing summary.

## 3. Current status

**Phase 1 (scaffold) is complete on `feat/scaffold-impl`; PR #2 is open and mergeable.** The repo has the Electron main process, preload, renderer HTML/JS, esbuild + Tailwind build, single-instance toggle, frameless window, and the Hyprland rule. Phase 2 (shelf) starts on `feat/shelf` after PR #2 merges.

- Keep scaffolding on `feat/scaffold` and merge via PR. Do not start phase 2 until phase 1 is complete and merged.
- Documentation changes (`plan.md`, `README.md`, `AGENTS.md`) are allowed when the user asks for them. Only `README.md` and `AGENTS.md` are published.
- `.github/` (PR template, future CI) is tracked. `.gitignore` already ignores Node build output: `node_modules/`, `dist/`, `out/`, and `src/renderer/build/`.
- Config snippets in docs (Hyprland `hl.bind` and `hl.window_rule`) are examples, not files to create.

## 4. Confirmed decisions (do not change without asking)

| Topic             | Decision                                                                                                       |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| Name              | Quickshelf                                                                                                     |
| Command           | `quickshelf`                                                                                                   |
| First platform    | Linux, Hyprland / Garuda Linux                                                                                 |
| Shelf items       | Local files/folders are links only. Web images/links/text dropped from a browser are saved as files in `userData/web/` (image, `.url`, `.txt`) and stored as links to those files. Never copy local files unless the user explicitly chooses "copy into Quickshelf". |
| Web content       | Browser drops: images as image files, links as `.url`, text as `.txt` in `userData/web/`. No network fetch; shelf "Open" uses `shell.openExternal`. Cap each item (for example 50 MB); removing an owned item deletes its file. |
| Clipboard         | Text and images. History cap 200 (configurable)                                                                |
| Todo              | Due dates, priorities (None / Low / Medium / High), "Today" filter                                             |
| Window            | Resizable. Free-floating by default, with an option to dock to a screen edge. No true always-on-top on Wayland; Hyprland `float` + `pin`. |
| Shortcut          | `SUPER+A` runs `quickshelf --toggle`                                                                           |
| Component library | `basecoat-css`. Verify package name and version before installing                                              |
| Auto-start        | None. Nothing registers to start at login                                                                      |
| Packaging (first) | AppImage. Later: Arch/Garuda `PKGBUILD`, then `.deb`, Windows `.exe`, macOS `.dmg`                             |
| Updates (v1)      | Manual download of the AppImage                                                                                |
| Licence           | MIT for Quickshelf's own code. Third-party dependencies keep their own licences                                |
| UI colour reference | Apple Podcasts web player (https://podcasts.apple.com/us/). Colours only, extracted with Playwright into `token.css`. No layout, copy, icons, or code from Apple. |
| Renderer build    | esbuild bundles the renderer JS to one IIFE. Tailwind CSS v4 CLI builds the stylesheet. No Vite.                |
| Quit              | `quickshelf --quit` and `Ctrl+Q`. Closing the window hides it.                                                 |
| Hyprland config   | Lua at `~/.config/hypr/hyprland.lua` (0.56.2 tested; 0.57 syntax compatible for these calls). Not `hyprland.conf`, not `windowrule = ...`. |
| Package manager   | npm. Exact dependency versions pinned in `package.json`.                                                       |

## 5. Stack rules

- **Electron:** latest stable. Use the main process for OS work and window control.
- **Security:** `contextIsolation: true`, `nodeIntegration: false`. Expose only a small API through `contextBridge` in the preload script.
- **UI:** plain HTML. Renderer JavaScript is written as ES modules and bundled by esbuild into one IIFE (Chromium blocks module scripts over `file://`). No frontend framework unless the user asks.
- **Styling:** Tailwind CSS v4 for layout. Design tokens live in `token.css` as CSS custom properties, written in HSL. Colours exist now; radii, spacing, type, and shadows are added during phase 1. Do not hard-code colours in components.
- **Palette:** derived from the Apple Podcasts web player (see §4). Do not invent hex/HSL values: extend `token.css`, or re-extract from the live site with Playwright (`browser_emulate_media` for light/dark, then read root custom properties such as `--pageBG`, `--systemPrimary`, `--systemSecondary`, `--labelDivider`, `--keyColor`, `--systemLink`, `--systemGray6`).
- **Themes:** light and dark, via `prefers-color-scheme` and a `data-theme` attribute.
- **Storage:** JSON files in `app.getPath('userData')`. Do not add a database unless the plan is changed.
- **Packaging:** electron-builder for AppImage. Pin dependency versions in `package.json`.

## 6. Linux and Hyprland rules

- Launch with Wayland flags: `--ozone-platform=wayland` and the Wayland window-decorations feature flag.
- Keep the app single-instance (`app.requestSingleInstanceLock()`). Running `quickshelf --toggle` when the app is already open must show or hide the window, never start a second copy.
- Do not rely on global keyboard hooks or mouse hooks. Wayland blocks most of them. The keybinding comes from Hyprland.
- Do not implement "shake to open". It was dropped because it is not reliable on Wayland.
- Window behaviour comes from Hyprland rules in `~/.config/hypr/hyprland.lua` (Lua, not `hyprland.conf`): `hl.window_rule({ ... })` with `float` and `pin`. Let the app set its own size; do not add `size` to the rule (it clipped the right edge on a display with `devicePixelRatio` 1.1875). Check the installed stubs/example before changing the calls.
- Wayland has no true always-on-top for ordinary toplevels. `pin` keeps the window on every workspace; it does not raise it above other windows. Do not promise always-on-top.

## 7. Working rules for agents

1. **Read `plan.md` first** in every session, then this file.
2. **Ask before deciding anything not in the plan.** Ask one question at a time when possible.
3. **Keep changes small and reversible.** Make one logical change per step and explain it.
4. **Verify facts that can change.** Package names, library versions, and Hyprland syntax must be checked against current documentation before use. Do not assume them from memory.
5. **Do not add features outside the MVP** in `plan.md` section 2 without the user's approval.
6. **Do not add accounts, analytics, telemetry, or network calls.** Quickshelf stays local.
7. **Protect privacy in the clipboard feature.** Respect the ignore list, the pause toggle, and history expiry. Never log clipboard contents.
8. **Do not commit or publish** anything unless the user asks.
9. **Do not disable security settings** (context isolation, sandboxing) to make something work. Find another approach and explain it.
10. **Record decisions.** If the user answers an open question, update `plan.md` section 8 and this file's table in section 4.
11. **Branch for features.** From now on, every new feature gets its own branch off `main` (e.g. `feat/shelf`, `feat/clipboard`, `fix/drag-out`). Do not build features directly on `main`; merge back via PR using the PR template.

## 8. Open items (to confirm with the user)

- Shortcut: `SUPER+A` is confirmed, but it is a placeholder until the user tests it.
- Web link format: `.url` for v1 (matches PerchShelf). Revisit `.desktop` on Linux if file managers do not open `.url` files.
- Packaging for the AUR package: optional, decide later.
- Always-on-top on Wayland: not achievable for ordinary toplevels. Current behaviour is `float` + `pin`. Decide in phase 1 testing whether `stay_focused` is worth the focus-stealing trade-off.

## 9. Phase order

1. Scaffold: Electron, esbuild, Tailwind CLI, Basecoat, `token.css` (palette already exists — extend it, do not recreate), frameless window, single-instance toggle, Hyprland rule.
2. Shelf: drop (local links; web images/links/text saved as files), list, drag out, tabs, persistence.
3. Clipboard: polling watcher, history, search, pin, copy back.
4. Todo: create, edit, delete, reorder, due dates, priorities, "Today" filter.
5. Polish: themes, keyboard navigation, empty states, settings.
6. Package and test: AppImage, then the Garuda `PKGBUILD`, tested under Hyprland.

Start with phase 1 only when the user confirms.

## 10. Test checklist (for Garuda / Hyprland)

- `SUPER+A` shows and hides the window.
- Running `quickshelf` twice does not open two windows.
- The window floats, stays on all workspaces, and can be resized.
- Dragging a file in adds a link to the shelf. Dragging it out works.
- Dropping an image, link, or text from a browser saves a file in `userData/web/` and adds a shelf item.
- The app starts without any login-time setup.
- Light and dark themes both render correctly from `token.css`.
