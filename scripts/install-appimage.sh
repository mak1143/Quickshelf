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
APPIMAGE_DIR="$DATA_DIR/quickshelf"
ICON_SOURCE="$(cd "$(dirname "$0")/.." && pwd)/build/icon.png"

# AppImages mount themselves through libfuse.so.2 (the fuse2 package).
# fuse3 does not provide it, so detect the library instead of assuming.
has_fuse2() {
  ldconfig -p 2>/dev/null | grep -q 'libfuse\.so\.2'
}

mkdir -p "$BIN_DIR" "$APP_DIR" "$ICON_DIR"

if has_fuse2; then
  install -m 0755 "$APPIMAGE" "$BIN_DIR/quickshelf"
  # Drop a previous self-extract install so we do not keep 120 MB around twice.
  rm -rf "$APPIMAGE_DIR"
  INSTALLED_TARGET="$BIN_DIR/quickshelf"
else
  mkdir -p "$APPIMAGE_DIR"
  install -m 0755 "$APPIMAGE" "$APPIMAGE_DIR/Quickshelf.AppImage"

  # The wrapper checks at run time, so installing fuse2 later is enough to
  # switch back to normal mounting without reinstalling.
  cat > "$BIN_DIR/quickshelf" <<WRAPPER
#!/usr/bin/env bash
# Quickshelf launcher.
# AppImages need libfuse.so.2. When it is missing, fall back to the AppImage
# runtime's self-extract mode so the app still starts. Install fuse2 to skip
# the per-launch extraction.
if ! ldconfig -p 2>/dev/null | grep -q 'libfuse\.so\.2'; then
  export APPIMAGE_EXTRACT_AND_RUN=1
fi

exec "\${QUICKSHELF_APPIMAGE:-$APPIMAGE_DIR/Quickshelf.AppImage}" "\$@"
WRAPPER
  chmod 0755 "$BIN_DIR/quickshelf"
  INSTALLED_TARGET="$APPIMAGE_DIR/Quickshelf.AppImage"
fi

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

if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  gtk-update-icon-cache -f -t "$DATA_DIR/icons/hicolor" >/dev/null 2>&1 || true
fi

printf 'Installed Quickshelf to %s\n' "$BIN_DIR/quickshelf"
printf 'AppImage: %s\n' "$INSTALLED_TARGET"
printf 'Desktop entry: %s\n' "$APP_DIR/quickshelf.desktop"

if ! has_fuse2; then
  printf '\nNote: libfuse.so.2 is missing, so the launcher self-extracts the AppImage on every start.\n'
  printf 'Install it for faster startup: sudo pacman -S fuse2 (Arch/Garuda), sudo apt install libfuse2 (Debian/Ubuntu).\n'
fi

printf '\nAdd these lines to ~/.config/hypr/hyprland.lua:\n'
printf 'hl.bind("SUPER + A", hl.dsp.exec_cmd("quickshelf --toggle"))\n'
printf 'hl.window_rule({\n'
printf '  match = { class = "quickshelf" },\n'
printf '  float = true,\n'
printf '  pin = true,\n'
printf '  center = true,\n'
printf '})\n'
