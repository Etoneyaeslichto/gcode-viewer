#!/bin/sh
# Build the GitHub Pages site: G-code app at the root, "Наряды" at /naryady/.
# Usage: sh ios/pages.sh <gcode-version>
set -e
python3 ios/make_site.py app/src/main/assets/index.html site "$1"
python3 naryady/web/build.py >/dev/null
mkdir -p site/naryady
cp naryady/src/main/assets/index.html naryady/pwa/* site/naryady/
sed -i "s/'nar-BUILD'/'nar-$(echo "$GITHUB_SHA" | cut -c1-8)'/" site/naryady/sw.js
echo "site ok"
