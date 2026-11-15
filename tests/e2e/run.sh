#!/usr/bin/env bash
# Serve the production build and run each walkthrough test against it.
set -e
cd "$(dirname "$0")/../.."
npx vite preview --port 4173 --strictPort > /dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER' EXIT
sleep 2
export NODE_PATH="${NODE_PATH:-$(npm root -g)}"
for t in tests/e2e/*.cjs; do
  echo "== $t"
  node "$t"
done
