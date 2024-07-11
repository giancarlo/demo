set -e

tsc -b tsconfig.json

cp blocks/*.jpg blocks/*.html dist/blocks
cp clock/*.html dist/clock
