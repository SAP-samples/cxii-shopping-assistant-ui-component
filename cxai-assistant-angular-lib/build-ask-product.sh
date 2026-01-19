set -e

echo "### Building spartacus library ###"
npm run build:ask-product

# go to dist/cxai-ask-product-angular-lib and publish

current_version=$(node -p "require('./projects/cxai-ask-product/package.json').version")
pushd dist/cxai-ask-product
npm pack

#if version_to_unpublish is not empty, then unpublish
if [ "$1" == "--republish" ]; then
  #read  current version from projects/cxai-ask-product/package.json

  #confirm action
  read -p "UNPUBLISH version $current_version before republish? Press enter to continue"

  npm unpublish @cx-spartacus/cxai-ask-product@$current_version
fi

npm publish
popd
