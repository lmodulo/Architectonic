#!/bin/bash
# Session 3 public-site sweep (throwaway project only). Usage: s3-site.sh [base-url]
# Needs the cms demo seed and two extra users, s3viewer@example.com / s3customer@example.com,
# whose password hash is copied from admin@example.com.
BASE=${1:-http://localhost:3002}
SP=${TMPDIR:-/tmp}/cms-s3-site; mkdir -p $SP
J=$SP/jars; mkdir -p $J
pass=0; fail=0

login() { rm -f $J/$2.txt; curl -s -o /dev/null -c $J/$2.txt -X POST "$BASE/login" -H "Origin: $BASE" -H 'accept: text/html' \
  -H 'content-type: application/x-www-form-urlencoded' --data-urlencode "email=$1" --data-urlencode "password=$3" -w "login $2 -> %{http_code} %{redirect_url}\n" | sed "s#$BASE##g"; }

# check <role> <path> <expected status> <expected location or -> <must-contain or -> <must-not-contain or ->
check() {
  local jar=$J/$1.txt; [ "$1" = anon ] && jar=/dev/null
  local out=$SP/body.html res status loc ok=1 why=""
  res=$(curl -s -o $out -b $jar -w "%{http_code} %{redirect_url}" "$BASE$2"); status=${res%% *}; loc=${res#* }; loc=${loc#$BASE}
  [ "$status" = "$3" ] || { ok=0; why="status $status"; }
  [ "$4" = "-" ] || [ "$loc" = "$4" ] || { ok=0; why="$why location '$loc'"; }
  [ "$5" = "-" ] || grep -q -- "$5" $out || { ok=0; why="$why missing '$5'"; }
  [ "$6" = "-" ] || ! grep -q -- "$6" $out || { ok=0; why="$why has '$6'"; }
  if [ $ok = 1 ]; then pass=$((pass+1)); echo "PASS  $1 $2 -> $status $loc"; else fail=$((fail+1)); echo "FAIL  $1 $2 ->$why"; fi
}

SHELL_MARK='h-screen flex overflow-hidden'   # the app shell
SITE_MARK='id="cms-main"'                    # the site shell

for who in anon customer viewer admin; do
  case $who in
    customer) login s3customer@example.com customer admin-password ;;
    viewer)   login s3viewer@example.com viewer admin-password ;;
    admin)    login admin@example.com admin admin-password ;;
  esac
  check $who /                   200 -                   "$SITE_MARK" "$SHELL_MARK"
  check $who /                   200 -                   'Neighbours helping neighbours' 'class="hero-brand'
  check $who /about              200 -                   '<h1' "$SHELL_MARK"
  check $who /about/team         200 -                   'aria-label="Breadcrumb"' "$SHELL_MARK"
  check $who /resources          307 /resources/sitemap  - -
  check $who /resources/sitemap  200 -                   'href="/about/team"' "$SHELL_MARK"
  check $who /home               307 /                   - -
  check $who /nope               404 -                   'Page not found' "$SHELL_MARK"
  check $who /nope               404 -                   "$SITE_MARK" -
  check $who /about/nope         404 -                   "$SITE_MARK" -
  check $who /events/summer-fair 404 -                   "$SITE_MARK" -
  check $who /privacy            200 -                   "$SITE_MARK" -
  check $who /api/nope           404 -                   - "$SITE_MARK"
  sleep 65   # a signed-in page costs ~9 API calls; stay under the dev API's 200/min
done
check anon /dashboard 303 /login - -
check anon /cms       303 /login - -
check admin /dashboard 200 - "$SHELL_MARK" -
check admin /about/team/__data.json 200 - '"type":"data"' -
echo; echo "$pass passed, $fail failed"
