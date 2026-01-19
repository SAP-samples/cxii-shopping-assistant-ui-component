set -e
npm run lint

echo "### Building web-component ###"
npm run build:web-component

addon_dir=..
target_dir=$addon_dir/cxaiaskproductaddon/acceleratoraddon/web/webroot/_ui/responsive/common/js
cp -r dist/web-component/browser/polyfills.js $target_dir/angular-polyfills.js
cp -r dist/web-component/browser/main.js $target_dir/cxai-components.js
