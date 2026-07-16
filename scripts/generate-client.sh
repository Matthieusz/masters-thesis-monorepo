#! /usr/bin/env bash

set -e
set -x

cd apps/api
uv run python -c "import app.main; import json; print(json.dumps(app.main.app.openapi()))" > ../../openapi.json
cd ../..
mv openapi.json apps/web/
bun run --filter frontend generate-client
bun run lint
