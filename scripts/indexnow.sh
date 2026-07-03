#!/usr/bin/env bash
# Submit every URL in public/sitemap.xml to IndexNow.
# IndexNow notifies Bing, Yandex, Seznam, Naver and other partners to (re)crawl.
# Google does NOT use IndexNow — it recrawls via the sitemap submitted in Search Console.
#
# The key is NOT a secret: it is served publicly at https://www.saveboard.app/<key>.txt
# so search engines can verify ownership. Safe to keep in the repo.
#
# Usage: ./scripts/indexnow.sh
set -euo pipefail

HOST="www.saveboard.app"
KEY="2e2b845748b438d03d1c9482566c1758"
KEY_LOCATION="https://${HOST}/${KEY}.txt"
SITEMAP="$(dirname "$0")/../public/sitemap.xml"

# Extract <loc> URLs from the sitemap (portable — no mapfile, works on bash 3.2).
URLS=""
count=0
while IFS= read -r u; do
  [ -z "$u" ] && continue
  URLS="${URLS}${u}
"
  count=$((count + 1))
done <<EOF
$(grep -oE '<loc>[^<]+</loc>' "$SITEMAP" | sed -E 's#</?loc>##g')
EOF

if [ "$count" -eq 0 ]; then
  echo "No URLs found in $SITEMAP" >&2
  exit 1
fi

# Build the JSON body.
url_json=""
while IFS= read -r u; do
  [ -z "$u" ] && continue
  url_json="${url_json}\"${u}\","
done <<EOF
$URLS
EOF
url_json="[${url_json%,}]"
body=$(cat <<JSON
{"host":"${HOST}","key":"${KEY}","keyLocation":"${KEY_LOCATION}","urlList":${url_json}}
JSON
)

echo "Submitting ${count} URLs to IndexNow:"
printf '%s' "$URLS" | sed 's/^/  /'

status=$(curl -sS -o /tmp/indexnow-resp -w '%{http_code}' \
  -X POST "https://api.indexnow.org/IndexNow" \
  -H "Content-Type: application/json; charset=utf-8" \
  --data "$body")

echo "IndexNow HTTP $status"
cat /tmp/indexnow-resp 2>/dev/null || true
echo
case "$status" in
  200|202) echo "OK — submitted."; exit 0 ;;
  *) echo "IndexNow submission failed (HTTP $status)"; exit 1 ;;
esac
