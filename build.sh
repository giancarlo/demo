set -e

tsc -b tsconfig.json

echo '<script type="module" src="index.js"></script>' > dist/life/index.html

cp clock/*.html dist/clock

mkdir -p dist/minesweeper dist/news
cp minesweeper/index.html dist/minesweeper
cp news/index.html dist/news

mkdir -p dist/blog
cp blog/* dist/blog