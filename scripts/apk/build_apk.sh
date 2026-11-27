#!/usr/bin/env bash
# ==============================================================================
# Hey FRIDAY Android APK Build Automation (<75 lines)
# Uses Android SDK Build-Tools (aapt2, javac, d8, zipalign, apksigner)
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ANDROID_DIR="${ROOT_DIR}/android"
DIST_DIR="${ROOT_DIR}/desktop-ui/public/downloads"

export PATH="/opt/android-sdk/build-tools/34.0.0:${PATH}"
ANDROID_JAR="/opt/android-sdk/platforms/android-34/android.jar"

echo "📱 [APK BUILD] Starting Hey FRIDAY Android APK build..."
mkdir -p "${ANDROID_DIR}/build/gen" "${ANDROID_DIR}/build/obj" "${DIST_DIR}"

# 1. Package resources with aapt2
aapt2 link -I "${ANDROID_JAR}" \
  --manifest "${ANDROID_DIR}/AndroidManifest.xml" \
  --java "${ANDROID_DIR}/build/gen" \
  -o "${ANDROID_DIR}/build/unaligned.apk"

# 2. Compile Java sources with Java 8 bytecode compatibility
javac -source 8 -target 8 -d "${ANDROID_DIR}/build/obj" -cp "${ANDROID_JAR}" \
  "${ANDROID_DIR}/build/gen/com/heyfriday/app/"*.java \
  "${ANDROID_DIR}/src/com/heyfriday/app/"*.java 2>/dev/null || true

# 3. Dex classes to classes.dex
d8 --output "${ANDROID_DIR}/build" $(find "${ANDROID_DIR}/build/obj" -name "*.class")

# 4. Add classes.dex into unaligned apk
cd "${ANDROID_DIR}/build"
zip -u unaligned.apk classes.dex

# 5. Zipalign to 4-byte boundaries
rm -f hey-friday-release.apk
zipalign -v -p 4 unaligned.apk hey-friday-release.apk >/dev/null

# 6. Generate release keystore if needed & sign APK
if [ ! -f "${ANDROID_DIR}/release.keystore" ]; then
  keytool -genkeypair -validity 10000 -dname "CN=dr-week,O=HeyFRIDAY" \
    -keystore "${ANDROID_DIR}/release.keystore" -storepass heyfriday123 -keypass heyfriday123 \
    -alias heyfriday -keyalg RSA -keysize 2048 2>/dev/null
fi

apksigner sign --ks "${ANDROID_DIR}/release.keystore" \
  --ks-pass pass:heyfriday123 --key-pass pass:heyfriday123 hey-friday-release.apk

apksigner verify hey-friday-release.apk
cp -f hey-friday-release.apk "${DIST_DIR}/hey-friday-latest.apk"
echo "✅ [APK BUILD] Verified & published to: ${DIST_DIR}/hey-friday-latest.apk"
ls -lh "${DIST_DIR}/hey-friday-latest.apk"
