set -e
npm run lint
npm run test:assistant -- --watch=false --no-progress
npm run build:assistant
lib_name=cxai-assistant
current_version=$(node -p "require('./projects/$lib_name/package.json').version")
cp README.md "dist/$lib_name/"
pushd "dist/$lib_name"
npm pack

#if version_to_unpublish is not empty, then unpublish
if [ "$1" == "--republish" ]; then
  #confirm action
  read -p "UNPUBLISH version $current_version before republish? Press enter to continue"

  npm unpublish @cx-spartacus/$lib_name@$current_version --force
fi

npm publish
popd

