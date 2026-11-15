#!/usr/bin/env bash
# Serve the production build and capture the screen tour.
set -e
cd "$(dirname "$0")/../.."
rm -rf docs/screenshots/tour
npx vite preview --port 4173 --strictPort > /dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER' EXIT
sleep 2
NODE_PATH="${NODE_PATH:-$(npm root -g)}" node tests/tour/tour.cjs "$@"
