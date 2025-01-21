#!/bin/sh

OUT=${1:-"environment.remote.json"}

ENV_VARS=( "INSPECT_SERVER_URL:host"
        # var.
        )

ENTRIES=""
for ENTRY in "${ENV_VARS[@]}"; do
  KEY=${ENTRY%:*}
  VALUE=$(printenv "$KEY")
  if [ -n "$VALUE" ]; then
    ENTRIES="$ENTRIES\"$KEY\":\"${VALUE#*:}\","
    echo "'$KEY'=$VALUE"
  else
    echo "'$KEY' env. variable not defined"
  fi
done

if [ -n "$ENTRIES" ]; then
  ENTRIES=${ENTRIES%,}
fi

JSON="{$ENTRIES}"

echo "$JSON" > "$OUT"