# Pull Request

## 📝 Description

<!-- What changed and why. Reference the relevant section of the local `plan.md` (that file is not committed). -->

## 🔀 Type of Change

- [ ] Scaffold (Electron, Tailwind, Basecoat, `token.css`, frameless window, toggle, Hyprland rule)
- [ ] Shelf (drop, list, drag out, tabs, persistence)
- [ ] Clipboard (watcher, history, search, pin, copy back)
- [ ] Todo (CRUD, reorder, due dates, priorities, "Today" filter)
- [ ] Polish (themes, keyboard navigation, empty states, settings)
- [ ] Packaging / Hyprland (AppImage, `PKGBUILD`, `windowrule`)
- [ ] Documentation only (`README.md`, `AGENTS.md`)

## 🧪 How to Test

<!-- Only commands that actually exist in this repo. For docs-only changes, write "docs-only, no testing needed". -->

1.
2. Under Garuda / Hyprland: `SUPER+A` shows and hides the window.
3. Running `quickshelf` twice does not open two windows.

## ✅ Pre-Merge Checklist

- [ ] Change matches the local `plan.md`; no features outside the MVP (section 2) were added without approval.
- [ ] Colours come from `token.css` (HSL tokens) — no hard-coded colours in components.
- [ ] No accounts, analytics, telemetry, or network calls were added. Quickshelf stays local.
- [ ] Clipboard privacy intact: ignore list, pause toggle, history expiry respected; no clipboard contents logged.
- [ ] Security settings untouched: `contextIsolation: true`, `nodeIntegration: false`.
- [ ] Dependency versions pinned in `package.json`; package names and Hyprland syntax verified against current docs.
- [ ] Clean-room rule held (local `plan.md` §8a): no code, assets, icons, or text from PerchShelf or other shelf apps.
- [ ] No secrets, `.env` files, or temp files committed; `node_modules/` and `dist/` are ignored.
- [ ] Decisions recorded in the local `plan.md` §8 and `AGENTS.md` §4.
