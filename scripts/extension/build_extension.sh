#!/usr/bin/env bash
# ==============================================================================
# Package Hey FRIDAY Browser Extension (<35 lines)
# Creates a clean distributable zip for Chrome, Edge, and Firefox Web Stores
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
EXT_DIR="${ROOT_DIR}/browser-extension"
DIST_DIR="${ROOT_DIR}/desktop-ui/public/downloads"

mkdir -p "${DIST_DIR}"
rm -f "${DIST_DIR}/hey-friday-extension.zip"

cd "${EXT_DIR}"
zip -r "${DIST_DIR}/hey-friday-extension.zip" manifest.json background content popup icons >/dev/null

echo "✅ [EXTENSION BUILD] Created: ${DIST_DIR}/hey-friday-extension.zip"
ls -lh "${DIST_DIR}/hey-friday-extension.zip"
