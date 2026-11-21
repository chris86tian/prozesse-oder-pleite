#!/bin/bash
# Rendert Banner und Icon aus tools/icons/*.html mit Chrome headless in die Android-Ressourcen.
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
RES=android/res
TMP=$(mktemp -d)

shot() { # html breite höhe ziel [transparent]
    local bg=()
    [ "${5:-}" = "transparent" ] && bg=(--default-background-color=00000000)
    "$CHROME" --headless=new --disable-gpu --hide-scrollbars --no-first-run --no-default-browser-check \
        --user-data-dir="$TMP/profile" --virtual-time-budget=3000 --force-device-scale-factor=1 \
        --window-size="$2,$3" ${bg[@]+"${bg[@]}"} --screenshot="$4" "file://$PWD/tools/icons/$1" >/dev/null 2>&1
}

mkdir -p "$RES/drawable" "$RES/drawable-xhdpi" "$RES/drawable-xxxhdpi"
# Chrome rendert erst ab ca. 500 px Fensterbreite korrekt -> groß rendern, dann mit sips verkleinern
shot banner.html 1280 720 "tools/icons/banner-1280.png"
shot icon.html 512 512 "tools/icons/icon-512.png" transparent
# Banner: 320x180 dp -> xhdpi (Fire TV) = 640x360 px
sips -z 360 640 "tools/icons/banner-1280.png" --out "$RES/drawable-xhdpi/banner.png" >/dev/null
sips -z 180 320 "tools/icons/banner-1280.png" --out "$RES/drawable/banner.png" >/dev/null
# Icon: 48 dp -> xhdpi 96 px, xxxhdpi 192 px
sips -z 192 192 "tools/icons/icon-512.png" --out "$RES/drawable-xxxhdpi/icon.png" >/dev/null
sips -z 96 96 "tools/icons/icon-512.png" --out "$RES/drawable-xhdpi/icon.png" >/dev/null
sips -z 48 48 "tools/icons/icon-512.png" --out "$RES/drawable/icon.png" >/dev/null
rm -rf "$TMP"
file "$RES"/drawable*/*.png tools/icons/*.png
