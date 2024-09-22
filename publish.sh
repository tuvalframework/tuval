echo "Starting"
npm run buildnode
npm version patch -m "Upgrade to new version"

cp package.json dist
cd dist

rm index.js.map
npm publish --access public