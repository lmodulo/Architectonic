#!/bin/bash
# Session 2 web-side checks: the /api/cms proxy and the placeholder /cms page.
BASE=http://localhost:3002
SP=${TMPDIR:-/tmp}/cms-s2-web; mkdir -p $SP
J=$SP/jars2; mkdir -p $J
login() { rm -f $J/$2.txt; curl -s -o /dev/null -c $J/$2.txt -X POST "$BASE/login" -H "Origin: $BASE" -H 'accept: text/html' \
  -H 'content-type: application/x-www-form-urlencoded' --data-urlencode "email=$1" --data-urlencode "password=$3" -w "login $2 -> %{http_code} %{redirect_url}\n"; }
req() { # role method path [json]
  local jar=$J/$1.txt; [ "$1" = anon ] && jar=/dev/null
  if [ -n "$4" ]; then curl -s -b $jar -X $2 -H 'content-type: application/json' -d "$4" -o $SP/w.out -w "%{http_code} %{redirect_url}" "$BASE$3";
  else curl -s -b $jar -X $2 -o $SP/w.out -w "%{http_code} %{redirect_url}" "$BASE$3"; fi
}
show() { printf '%-9s %-6s %-40s %s  %s\n' "$1" "$2" "$3" "$(req "$@")" "$(head -c 110 $SP/w.out | tr '\n' ' ')" | sed "s#$BASE##"; }

show anon GET /api/cms/site/menu
show anon GET '/api/cms/site/resolve?path=/about'
show anon GET /api/cms/nodes
show anon GET '/api/cms/..%2Fauth%2Fme'
show anon GET '/api/cms/%2E%2E/auth/me'
show anon GET /cms
login admin@example.com admin admin-password
login s2customer@example.com customer admin-password
login jordan@example.com contrib jordan-password
show admin GET /api/cms/nodes
show admin POST /api/cms/nodes '{"type":"page","title":"Proxy Test"}'
NEW=$(python3 -c "import json;print(json.load(open('$SP/w.out'))['id'])" 2>/dev/null)
show admin POST /api/cms/nodes '{"type":"page","title":"Proxy Test"}'
show admin PUT "/api/cms/pages/$NEW/draft" '{"blocks":[],"seo":{},"rev":5}'
show admin POST "/api/cms/pages/$NEW/publish"
show admin DELETE "/api/cms/nodes/$NEW"
show contrib POST "/api/cms/pages/$NEW/publish"
for who in admin contrib customer; do
  r=$(req $who GET /cms); printf '%-9s GET    /cms  %s  header=%s rows=%s\n' $who "$r" "$(grep -c 'Site · Settings' $SP/w.out)" "$(grep -o '<tr class' $SP/w.out | wc -l | tr -d ' ')" | sed "s#$BASE##"
done
