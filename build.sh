set -e

tsc -b tsconfig.json

echo '<script type="module" src="index.js"></script>' > dist/life/index.html

cp blocks/*.html dist/blocks
cp clock/*.html dist/clock
