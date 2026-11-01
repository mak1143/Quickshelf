# Strictly Read This files

This file tells any AI coding agent how to work in this project. Read it before you change anything.

## 1. Project in one paragraph

Quickshelf is a small, cross-platform desktop utility with three parts in one floating window: a drag-and-drop shelf (stores links to files), a clipboard history, and a todo list with due dates and priorities. It is built with Electron, plain HTML and JavaScript, Tailwind CSS, Basecoat UI (`basecoat-css`), and a `token.css` design-token file. Linux (Hyprland) is the first target. Windows and macOS come later.

## 1a. Clean-room rules

- Build Quickshelf from `plan.md` and public documentation only.
- Do not copy code, assets, icons, or text from PerchShelf or any other shelf app.
- `morluto/rea` (MIT) is a reverse-engineering tool. It is not a dependency and not a feature source. Do not use it to analyse PerchShelf or other proprietary apps without the user's explicit confirmation of ownership or authorisation.

## 2. Source of truth

- `plan.md` is the full specification: scope, architecture, build phases, decisions, risks, and packaging.
- `README.md` is the public-facing summary.
- If this file and `plan.md` disagree, `plan.md` wins. Tell the user about the conflict instead of guessing.

## 3. Current status

**Planning phase. No application code exists yet.**

- Do not create source code, `package.json`, build config, or scaffolding until the user explicitly says to start phase 1.
- Documentation changes (`plan.md`, `README.md`, `agent.md`) are allowed when the user asks for them.
- Config snippets in docs (Hyprland `bind` and `windowrule`) are examples, not files to create.

## 4. Confirmed decisions (do not change without asking)

| Topic             | Decision                                                                                                       |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| Name              | Quickshelf                                                                                                     |
| Command           | `quickshelf`                                                                                                   |
| First platform    | Linux, Hyprland / Garuda Linux                                                                                 |
| Shelf items       | Store links (path references) only. Never copy files unless the user explicitly chooses "copy into Quickshelf" |
| Clipboard         | Text and images. History cap 200 (configurable)                                                                |
| Todo              | Due dates, priorities (None / Low / Medium / High), "Today" filter                                             |
| Window            | Resizable. Free-floating by default, with an option to dock to a screen edge                                   |
| Shortcut          | `SUPER+A` runs `quickshelf --toggle`                                                                           |
| Component library | `basecoat-css`. Verify package name and version before installing                                              |
| Auto-start        | None. Nothing registers to start at login                                                                      |
| Packaging (first) | AppImage. Later: Arch/Garuda `PKGBUILD`, then `.deb`, Windows `.exe`, macOS `.dmg`                             |
| Updates (v1)      | Manual download of the AppImage                                                                                |
| Licence           | MIT for Quickshelf's own code. Third-party dependencies keep their own licences                                |

## 5. Stack rules

- **Electron:** latest stable. Use the main process for OS work and window control.
- **Security:** `contextIsolation: true`, `nodeIntegration: false`. Expose only a small API through `contextBridge` in the preload script.
- **UI:** plain HTML and ES modules. No frontend framework unless the user asks.
- **Styling:** Tailwind CSS v4 for layout. Colours, radii, spacing, and type live in `token.css` as CSS custom properties. Do not hard-code colours in components.
- **Themes:** light and dark, via `prefers-color-scheme` and a `data-theme` attribute.
- **Storage:** JSON files in `app.getPath('userData')`. Do not add a database unless the plan is changed.
- **Packaging:** electron-builder for AppImage. Pin dependency versions in `package.json`.

## 6. Linux and Hyprland rules

- Launch with Wayland flags: `--ozone-platform=wayland` and the Wayland window-decorations feature flag.
- Keep the app single-instance (`app.requestSingleInstanceLock()`). Running `quickshelf --toggle` when the app is already open must show or hide the window, never start a second copy.
- Do not rely on global keyboard hooks or mouse hooks. Wayland blocks most of them. The keybinding comes from Hyprland.
- Do not implement "shake to open". It was dropped because it is not reliable on Wayland.
- Window behaviour needs floating, pinning across workspaces, and a default size. These come from Hyprland `windowrule` lines, which must be checked against the Hyprland 0.57 wiki before being written down.

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

## 8. Open items (to confirm with the user)

- Shortcut: `SUPER+A` is confirmed, but it is a placeholder until the user tests it.
- Packaging for the AUR package: optional, decide later.

## 9. Phase order

1. Scaffold: Electron, Tailwind, Basecoat, `token.css`, frameless window, single-instance toggle, Hyprland rule.
2. Shelf: drop, list, drag out, tabs, persistence.
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
- The app starts without any login-time setup.
- Light and dark themes both render correctly from `token.css`.
