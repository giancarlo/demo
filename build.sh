set -e

tsc -b tsconfig.json

cp clock/*.html dist/clock
