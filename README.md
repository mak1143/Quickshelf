## Quickshelf

A small, cross-platform desktop utility that combines a drag-and-drop shelf, a clipboard history, and a todo list in one floating window. Linux (Hyprland) first; Windows and macOS later.

> Status: early development. The shelf (drops, tabs, persistence) is implemented; clipboard history and todo are still planned. See [plan.md](plan.md) for scope, architecture, build phases, and decisions.

## Features (planned)

- **Shelf:** drop files and folders onto the window, drag them out later. Stores links to the originals, so drops are instant and nothing is copied.
- **Clipboard history:** text and images, searchable, with pinning. Default cap: 200 entries.
- **Todo:** tasks with due dates, priorities (None, Low, Medium, High), and a "Today" filter.
- **Window:** resizable. Free-floating by default, with an option to dock to a screen edge. Frameless; pinned across workspaces on Hyprland (no true always-on-top on Wayland).

## Stack

- Electron
- HTML and JavaScript
- Tailwind CSS
- Basecoat UI (`basecoat-css`)
- `token.css` for design tokens (colours now; spacing, type, and radii added in phase 1)

## Usage

Toggle the window with the keybinding:

- `SUPER+A` on Hyprland, which runs `quickshelf --toggle`

Running `quickshelf` while it is already open shows the window instead of starting a second copy.

## Hyprland setup

Hyprland 0.57 reads `~/.config/hypr/hyprland.lua`, which uses Lua. The older `hyprland.conf` / `windowrule` syntax is not used. Add two things to that file:

- a `hl.bind` for `SUPER + A` that runs `quickshelf --toggle`
- a `hl.window_rule` that floats and pins the window (the app sets its own size)

See [plan.md](plan.md) section 4 for the exact snippet. Note that Wayland does not support true always-on-top for ordinary windows: `pin` keeps Quickshelf on every workspace, but other windows can still cover it.

## Installation

- **AppImage (Linux x64):** download `Quickshelf-0.1.0-x86_64.AppImage` from the [releases page](https://github.com/mak1143/Quickshelf/releases), make it executable, and run it.
- To install it so `quickshelf` is on `PATH` for the keybinding, run the installer from a checkout of this repository:

  ```bash
  chmod +x Quickshelf-0.1.0-x86_64.AppImage
  ./scripts/install-appimage.sh ./Quickshelf-0.1.0-x86_64.AppImage
  ```

  It copies the AppImage to `~/.local/bin/quickshelf`, adds a desktop entry and icon under `~/.local/share`, and prints the Hyprland snippets below.
- Nothing runs at login. Quickshelf starts only when you open it.

## Updates

- **v1:** download the new AppImage manually.
- **Later:** automatic updates with `electron-updater`.
- **Later:** an AUR package, updated with `yay -Syu` or `paru -Syu`.

## Platforms

| Platform                  | Status | Package                                              |
| ------------------------- | ------ | ---------------------------------------------------- |
| Linux (Hyprland / Garuda) | First  | AppImage                                             |
| Windows                   | Later  | NSIS `.exe` (SmartScreen warning unless code-signed) |
| macOS                     | Later  | `.dmg` (needs signing and notarization)              |

## Licence

MIT. See the [LICENSE](LICENSE) file.
