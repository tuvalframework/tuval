echo "Starting"
npm run buildnode


cp package.json dist
cd dist

rm index.js.map
echo "Patching"
npm version patch -m "Upgrade to new version" || { echo "Version update failed"; exit 1; }
npm publish --access public