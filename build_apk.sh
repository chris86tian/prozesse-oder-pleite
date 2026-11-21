#!/bin/bash
# Baut die APKs ohne Gradle (aapt2 + javac + d8 + apksigner):
#   ProzesseOderPleite-FireTV.apk  – Fire TV / Android TV (Fernbedienung)
#   ProzesseOderPleite-Mobile.apk  – Android-Smartphone (Touch, Querformat)
# Aufruf: ./build_apk.sh [--install]   (--install spielt die Fire-TV-Version auf)
set -euo pipefail
cd "$(dirname "$0")"

export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export PATH="$JAVA_HOME/bin:$PATH"
SDK=${ANDROID_SDK:-/opt/homebrew/share/android-commandlinetools}
BT=$SDK/build-tools/34.0.0
JAR=$SDK/platforms/android-34/android.jar
FIRETV=${FIRETV:-}   # z. B. FIRETV=192.168.1.50:5555, leer = einziges per adb verbundenes Gerät
OUT=build
KS=$OUT/release.keystore

mkdir -p "$OUT"
# Signatur-Schlüssel (lokal, nicht im Repo) – wird beim ersten Lauf erzeugt
if [ ! -f "$KS" ]; then
    keytool -genkeypair -keystore "$KS" -storepass android -keypass android -alias agency \
        -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Prozesse oder Pleite" >/dev/null
fi

# Gemeinsame Teile: Ressourcen + Java-Code
rm -rf "$OUT/common" && mkdir -p "$OUT/common/classes" "$OUT/common/dex" "$OUT/common/assets/web"
cp -R game/. "$OUT/common/assets/web/"
"$BT/aapt2" compile --dir android/res -o "$OUT/common/res.zip"
javac -source 8 -target 8 -bootclasspath "$JAR" -Xlint:-options \
    -d "$OUT/common/classes" $(find android/src -name '*.java')
"$BT/d8" --release --min-api 22 --lib "$JAR" --output "$OUT/common/dex" $(find "$OUT/common/classes" -name '*.class')

build_variant() { # manifest apk
    local dir="$OUT/$2"
    rm -rf "$dir" && mkdir -p "$dir"
    "$BT/aapt2" link -I "$JAR" --manifest "$1" -A "$OUT/common/assets" -o "$dir/unsigned.apk" "$OUT/common/res.zip"
    (cd "$OUT/common/dex" && zip -q -j "../../$2/unsigned.apk" classes.dex)
    "$BT/zipalign" -f -p 4 "$dir/unsigned.apk" "$dir/aligned.apk"
    "$BT/apksigner" sign --ks "$KS" --ks-pass pass:android --key-pass pass:android --out "$2" "$dir/aligned.apk"
    "$BT/apksigner" verify "$2"
    ls -la "$2"
}
build_variant android/AndroidManifest.xml ProzesseOderPleite-FireTV.apk
build_variant android/AndroidManifest.mobile.xml ProzesseOderPleite-Mobile.apk

if [ "${1:-}" = "--install" ]; then
    DEV=()
    if [ -n "$FIRETV" ]; then adb connect "$FIRETV" >/dev/null || true; DEV=(-s "$FIRETV"); fi
    adb ${DEV[@]+"${DEV[@]}"} install -r ProzesseOderPleite-FireTV.apk
    adb ${DEV[@]+"${DEV[@]}"} shell am start -n de.prozesseoderpleite.tv/.MainActivity
fi
