#!/bin/bash
# Session 3 extras (throwaway project only): level-3 page + browser menu checks, the no-home
# marketing fallback, and the project-level reserved-slug check in the /api/cms proxy.
# Usage: s3-extra.sh [web-base] [api-base] [screenshot-dir]
# The reserved check expects a throwaway route at frontend/src/routes/s3probe/+page.svelte.
WEB=${1:-http://localhost:3002}; API=${2:-http://localhost:4002}; SHOTS=${3:-${TMPDIR:-/tmp}}
HERE=$(cd "$(dirname "$0")" && pwd)
SP=${TMPDIR:-/tmp}/cms-s3-extra; mkdir -p $SP
pass=0; fail=0
ok() { if [ "$2" = "$3" ]; then pass=$((pass+1)); echo "PASS  $1"; else fail=$((fail+1)); echo "FAIL  $1  -- got '$2', want '$3'"; fi; }
jget() { python3 -c "import json,sys; d=json.load(sys.stdin); print(eval(sys.argv[1]))" "$1"; }

# Direct API session (admin) and a web session (admin, through the proxy)
curl -s -c $SP/api.txt -o /dev/null -H 'content-type: application/json' -d '{"email":"admin@example.com","password":"admin-password"}' $API/auth/login
curl -s -c $SP/web.txt -o /dev/null -X POST "$WEB/login" -H "Origin: $WEB" -H 'accept: text/html' -H 'content-type: application/x-www-form-urlencoded' \
  --data-urlencode email=admin@example.com --data-urlencode password=admin-password
api() { curl -s -b $SP/api.txt -X $1 ${3:+-H 'content-type: application/json' -d "$3"} "$API$2"; }
web() { curl -s -b $SP/web.txt -o $SP/w.json -w "%{http_code}" -X $1 ${3:+-H 'content-type: application/json' -d "$3"} "$WEB$2"; }
node_id() { api GET /cms/nodes | jget "[n['id'] for n in d if n['title']=='$1'][0]"; }

# ── Level-3 page for the flyout and breadcrumb checks ───────────────────────────────────
TEAM=$(node_id Team)
BOARD=$(api POST /cms/nodes "{\"type\":\"page\",\"title\":\"Board\",\"parentId\":\"$TEAM\"}" | jget "d['id']")
api POST /cms/pages/$BOARD/publish > /dev/null
ok "level-3 page /about/team/board resolves" "$(curl -s -o /dev/null -w '%{http_code}' $WEB/about/team/board)" 200
node "$HERE/s3-menu.cjs" "$WEB" "$SHOTS"; [ $? = 0 ] && pass=$((pass+1)) || fail=$((fail+1))
sleep 65

# ── No published home → the scaffold marketing page ─────────────────────────────────────
HOME_ID=$(node_id Home)
api POST /cms/pages/$HOME_ID/unpublish > /dev/null
ok "no home published: / shows the marketing page" "$(curl -s $WEB/ | grep -c 'class="hero-brand')" 1
ok "no home published: no site shell on /" "$(curl -s $WEB/ | grep -c 'id="cms-main"')" 0
api POST /cms/pages/$HOME_ID/publish > /dev/null
ok "home republished: / is the CMS home again" "$(curl -s $WEB/ | grep -q 'id="cms-main"' && echo yes)" yes

# ── Project-level reserved slugs (s3probe is a route in this project, not in the API list) ─
ok "proxy: create root 's3probe' → 400" "$(web POST /api/cms/nodes '{"type":"page","title":"S3 Probe","slug":"s3probe"}')" 400
ok "proxy: create root from title 'S3probe' → 400" "$(web POST /api/cms/nodes '{"type":"label","title":"S3probe"}')" 400
DIRECT=$(api POST /cms/nodes '{"type":"page","title":"S3 Probe","slug":"s3probe"}' | jget "d.get('id','none')")
ok "API alone accepts it (the proxy is the second layer)" "$([ "$DIRECT" != none ] && echo yes)" yes
api DELETE /cms/nodes/$DIRECT > /dev/null
PRIVACY=$(node_id Privacy)
ok "proxy: rename a root slug to 's3probe' → 400" "$(web PATCH /api/cms/nodes/$PRIVACY '{"slug":"s3probe"}')" 400
ABOUT=$(node_id About)
# JSON bodies go in variables: inside "$(... "{...}")" bash would brace-expand them
BODY=$(printf '{"type":"page","title":"S3 Probe","slug":"s3probe","parentId":"%s"}' "$ABOUT")
ok "proxy: 's3probe' below the root is fine" "$(web POST /api/cms/nodes "$BODY")" 201
CHILD=$(jget "d['id']" < $SP/w.json)
ok "proxy: moving it to the root → 400" "$(web POST /api/cms/nodes/$CHILD/move '{"parentId":null,"index":0}')" 400
BODY=$(printf '{"parentId":"%s","index":0}' "$ABOUT")
ok "proxy: ordinary moves still pass" "$(web POST /api/cms/nodes/$CHILD/move "$BODY")" 200
ok "proxy: deleting passes through" "$(web DELETE /api/cms/nodes/$CHILD)" 200
api DELETE /cms/nodes/$BOARD > /dev/null

echo; echo "$pass passed, $fail failed"
