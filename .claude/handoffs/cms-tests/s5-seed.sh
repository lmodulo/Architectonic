#!/bin/bash
# Session 5: put test images into Vault through Vault's own API (throwaway project only).
# Usage: bash s5-seed.sh [api] [image-dir]
# The image dir needs river/garden/market/school/park/bridge/portrait/secret.png, wide-hero.jpg and
# logo.svg (see the Session 5 handoff for the Pillow snippet that makes them).
API=${1:-http://localhost:4002}
IMG=${2:-.}
J=$(mktemp)
curl -s -c $J -o /dev/null -H 'content-type: application/json' -d '{"email":"admin@example.com","password":"admin-password"}' $API/auth/login
FOLDER=$(curl -s -b $J -H 'content-type: application/json' -d '{"name":"Photos","visibility":"staff"}' $API/vault/folders | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Photos folder: $FOLDER"
up() { # file name visibility folder [type]
  local type=${5:+;type=$5}
  curl -s -b $J -F "name=$2" -F "visibility=$3" -F "folderId=$4" -F "tags=test" -F "file=@$IMG/$1$type" $API/vault/documents | python3 -c "import sys,json; print('$2', json.load(sys.stdin).get('id'))"
}
for n in River Garden Market School Park Bridge Portrait; do up "$(echo $n | tr A-Z a-z).png" "$n" staff $FOLDER; done
up wide-hero.jpg "Wide hero" customer $FOLDER
up logo.svg "Logo SVG" staff '' image/svg+xml
up secret.png "Secret" admin_only $FOLDER
rm -f $J
