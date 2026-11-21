#!/bin/bash
# Baut die Fire-TV-APK ohne Gradle (aapt2 + javac + d8 + apksigner).
# Aufruf: ./build_apk.sh [--install]
set -euo pipefail
cd "$(dirname "$0")"

export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export PATH="$JAVA_HOME/bin:/opt/homebrew/opt/node@22/bin:$PATH"
SDK=/opt/homebrew/share/android-commandlinetools
BT=$SDK/build-tools/34.0.0
JAR=$SDK/platforms/android-34/android.jar
FIRETV=${FIRETV:-192.168.30.171:5555}
OUT=build
APK=ProzesseOderPleite-FireTV.apk

# Spiel (Version 2, für den TV gebaut) liegt in game/
rm -rf "$OUT/apk" && mkdir -p "$OUT/apk/classes" "$OUT/apk/dex" "$OUT/apk/assets/web"
cp -R game/. "$OUT/apk/assets/web/"

# Banner + Icon liegen fertig in android/res (neu erzeugen: tools/render_icons.sh)

# Ressourcen + Manifest
"$BT/aapt2" compile --dir android/res -o "$OUT/apk/res.zip"
"$BT/aapt2" link -I "$JAR" --manifest android/AndroidManifest.xml \
    -A "$OUT/apk/assets" -o "$OUT/apk/unsigned.apk" "$OUT/apk/res.zip"

# Java -> dex
javac -source 8 -target 8 -bootclasspath "$JAR" -Xlint:-options \
    -d "$OUT/apk/classes" $(find android/src -name '*.java')
"$BT/d8" --release --min-api 22 --lib "$JAR" --output "$OUT/apk/dex" $(find "$OUT/apk/classes" -name '*.class')
(cd "$OUT/apk/dex" && zip -q -j ../unsigned.apk classes.dex)

# Ausrichten + signieren (lokaler Schluessel, wird beim ersten Lauf erzeugt)
KS=$OUT/release.keystore
if [ ! -f "$KS" ]; then
    keytool -genkeypair -keystore "$KS" -storepass android -keypass android -alias agency \
        -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Prozesse oder Pleite" >/dev/null
fi
"$BT/zipalign" -f -p 4 "$OUT/apk/unsigned.apk" "$OUT/apk/aligned.apk"
"$BT/apksigner" sign --ks "$KS" --ks-pass pass:android --key-pass pass:android \
    --out "$APK" "$OUT/apk/aligned.apk"
"$BT/apksigner" verify "$APK"
ls -la "$APK"

if [ "${1:-}" = "--install" ]; then
    adb connect "$FIRETV" >/dev/null || true
    adb -s "$FIRETV" install -r "$APK"
    adb -s "$FIRETV" shell am start -n de.prozesseoderpleite.tv/.MainActivity
fi
