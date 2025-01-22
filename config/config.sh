#!/bin/sh

OUT=${1:-"environment.remote.json"}

ENTRIES=""
MAP=$(< config-env.map)
for ENTRY in $MAP; do #separate var with space
  VALUE=$(printenv "${ENTRY#:*}")
  KEY=${ENTRY%*:}
  if [ -n "$VALUE" ]; then
    ENTRIES="$ENTRIES\"$KEY\":\"$VALUE\","
    echo "$KEY=$VALUE"
  else
    echo "'$KEY' env. variable not defined"
  fi
done

if [ -n "$ENTRIES" ]; then
  ENTRIES=${ENTRIES%,}
fi

JSON="{$ENTRIES}"

echo "$JSON" > "$OUT"