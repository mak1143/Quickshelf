#!/usr/bin/env bash
set -euo pipefail

APPIMAGE="${1:-}"

if [[ -z "$APPIMAGE" || ! -f "$APPIMAGE" ]]; then
  printf 'Usage: %s /path/to/Quickshelf-*.AppImage\n' "$(basename "$0")" >&2
  exit 1
fi

BIN_DIR="${XDG_BIN_HOME:-$HOME/.local/bin}"
DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}"
APP_DIR="$DATA_DIR/applications"
ICON_DIR="$DATA_DIR/icons/hicolor/512x512/apps"
ICON_SOURCE="$(cd "$(dirname "$0")/.." && pwd)/build/icon.png"

mkdir -p "$BIN_DIR" "$APP_DIR" "$ICON_DIR"
install -m 0755 "$APPIMAGE" "$BIN_DIR/quickshelf"

if [[ -f "$ICON_SOURCE" ]]; then
  install -m 0644 "$ICON_SOURCE" "$ICON_DIR/quickshelf.png"
fi

cat > "$APP_DIR/quickshelf.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Quickshelf
Comment=Shelf, clipboard history and todo list
Exec=$BIN_DIR/quickshelf
TryExec=$BIN_DIR/quickshelf
Icon=quickshelf
Terminal=false
Categories=Utility;
StartupWMClass=quickshelf
EOF

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$APP_DIR" >/dev/null 2>&1 || true
fi

printf 'Installed Quickshelf to %s\n' "$BIN_DIR/quickshelf"
printf 'Desktop entry: %s\n' "$APP_DIR/quickshelf.desktop"
printf '\nAdd these lines to ~/.config/hypr/hyprland.lua:\n'
printf 'hl.bind("SUPER + A", hl.dsp.exec_cmd("quickshelf --toggle"))\n'
printf 'hl.window_rule({\n'
printf '  match = { class = "quickshelf" },\n'
printf '  float = true,\n'
printf '  pin = true,\n'
printf '  center = true,\n'
printf '})\n'
