#! /usr/bin/env bash
set -e
set -x

python src/app/tests_pre_start.py

bash scripts/test.sh "$@"
