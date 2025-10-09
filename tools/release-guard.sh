#!/usr/bin/env bash
set -euo pipefail
# fail on forbidden transitional files
for p in backend-nest/src/signal/signal.api.module.ts; do [ -e "$p" ] && { echo FAIL:$p; exit 1; }; done
# also ban .theirs/.mine leftovers
if find . -type f \( -name '*.theirs' -o -name '*.mine' \) | grep .; then echo FAIL:theirs; exit 1; fi
echo OK
