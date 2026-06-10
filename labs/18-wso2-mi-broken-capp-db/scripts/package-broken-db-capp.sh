#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/../../.." && pwd)"
SOURCE="$REPO/labs/18-wso2-mi-broken-capp-db/source/broken-db-capp"
OUTPUT_DIR="$REPO/labs/18-wso2-mi-broken-capp-db/capps/generated"
OUTPUT="$OUTPUT_DIR/BrokenDbCompositeExporter_1.0.0.car"

echo "Packaging broken DB CApp source ..."
mkdir -p "$OUTPUT_DIR"

(
  cd "$SOURCE"
  zip -r "$OUTPUT" artifacts.xml BrokenDatabaseAPI_1.0.0
)

echo "Created $OUTPUT"
