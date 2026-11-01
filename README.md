## Quickshelf

A small, cross-platform desktop utility that combines a drag-and-drop shelf, a clipboard history, and a todo list in one floating window. Linux (Hyprland) first; Windows and macOS later.

> Status: planning. See [plan.md](plan.md) for scope, architecture, build phases, and decisions.

## Features (planned)

- **Shelf:** drop files and folders onto the window, drag them out later. Stores links to the originals, so drops are instant and nothing is copied.
- **Clipboard history:** text and images, searchable, with pinning. Default cap: 200 entries.
- **Todo:** tasks with due dates, priorities (None, Low, Medium, High), and a "Today" filter.
- **Window:** resizable. Free-floating by default, with an option to dock to a screen edge. Frameless and always on top.

## Stack

- Electron
- HTML and JavaScript
- Tailwind CSS
- Basecoat UI (`basecoat-css`)
- `token.css` for design tokens (colours, spacing, type, radii)

## Usage (planned)

Toggle the window with the keybinding:

- `SUPER+A` on Hyprland, which runs `quickshelf --toggle`

Running `quickshelf` while it is already open shows the window instead of starting a second copy.

## Hyprland setup (planned)

Add these lines to `~/.config/hypr/hyprland.conf`. Check the Hyprland 0.57 wiki for the exact `windowrule` syntax before applying.

- A `bind` for `SUPER+A` that runs `quickshelf --toggle`
- Window rules that float the window, pin it across workspaces, and set its default size

## Installation (planned)

- **AppImage:** download `Quickshelf.AppImage`, make it executable, and run it. An install step will copy it to `~/.local/bin/quickshelf` so the keybinding can find it.
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

MIT. See the `LICENSE` file once the project is creates.
