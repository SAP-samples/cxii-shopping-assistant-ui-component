# SAP CX Assistant Chat and Ask Product UI Component
Spartacus library to use CXII Assistant and Ask Product API.
[![REUSE status](https://api.reuse.software/badge/github.com/SAP-samples/cxii-shopping-assistant-ui-component)](https://api.reuse.software/info/github.com/SAP-samples/cxii-shopping-assistant-ui-component)

## Description
CXAI Assistant library for use with CXAI assistant API
CXAI Ask Product library for use with CXAI Ask Product API

## Accelerator (JSP) version
This instruction is for Composable Storefront library. If you use Accelerator see [Accelerator Addon](#cxaiaskproductaddon/README.md)
Currently only Ask Product component is provided in Accelerator addon.

## Requirements
1. Node version specified in `.nvmrc` files
2. Valid `configurationId` created by Assistant API. You can pass it via `provideConfig`, or expose backend endpoint that returns it, or use provided sample backend extensions. See section in [Backend README](cxaiaskproductocc/README.md#sample-assistant-config-json).
3. Library depends on backend which allows access to part of API without authorization. Library assumes API is served via OCC, you need to modify code (`buildUrl` method) to allow arbitrary URL. Sample backend extension is provided: [Backend README](cxaiaskproductocc/README.md)

## Download and Installation
The following instructions are for assistant library. For ask-product you can follow exactly the same steps, just change `assistant` to `ask-product`. You can either use prebuilt release or build the library manually.

### Using Prebuilt Release
1. Open latest [release](https://github.com/SAP-samples/cxii-shopping-assistant-ui-component/releases) 
2. Modify your application's `package.json` by adding entries specified on release page
    > Optionally you can `npm publish` the tgzs to your private npm registry and use version syntax instead of URLs
3. Run `npm i`
4. Skip to [Importing Assistant Library Module](#importing-assistant-library-module)

### Building the Library
Development guide for building and debugging the library.
#### Running the Build
1. cd into **workspace** `cxai-assistant-angular-lib`
2. `nvm use` or use node version specified in `.nvmrc`
3. Verify and adjust `.npmrc` file
    - if you use private npm registry (e.g. Verdaccio, GitHub Packages etc.) as a proxy for `@spartacus` and to host your own packages then just set environment variables to your proxy URL and auth token
    - otherwise replace `@spartacus:registry` with URL and credentials that you use in your spartacus app (e.g. RBSC) and optionally add `@cx-spartacus:registry` to be able to `npm publish`
4. `npm i`
    - never run `npm install` inside `projects/*`, only in workspace root
5. `npm run build:assistant`

#### Publishing to Your Private npm Repository
If you own a private npm repository:
1. Update `@cx-spartacus:registry` in `.npmrc` to point to your private repository
2. Run `build.sh` script
3. Add library to your application's `package.json`, e.g.
    - `"@cx-spartacus/cxai-assistant": "~2211.43.0"`

#### Creating .tgz File (If You Don't Have npm Repository)
If you don't own a private npm repository:
1. `cd` into `dist/cxai-assistant` after `npm run build`
2. Run `npm pack` - this will produce a `.tgz` file
3. Copy the `.tgz` into your application's codebase, e.g. into `lib/cx-spartacus-cxai-assistant-<version>.tgz`
4. Add library to your application's `package.json`, e.g.
    - `"@cx-spartacus/cxai-assistant": "file:lib/cx-spartacus-cxai-assistant-<version>.tgz"`

#### Run in Development Mode
If you want to run the library in watch mode:
1. Run `npm link` in `dist/cxai-assistant` folder (after `npm run build`)
2. Run `npm link @cx-spartacus/cxai-assistant` in your application
    > You need to have `"preserveSymlinks": true,` in app's `angular.json` projects/<project_name>/architect/build/options
3. Run the library using `npm run watch:assistant`
4. Run your app `ng s`
5. When you modify library code, the application will reload automatically
6. `npm link` is temporary and will be removed after each `npm install` in your application

### Importing Assistant Library Module
After you've successfully added library as a dependency in your application's `package.json`, and either run `npm install` or `npm link` you can now use it.
1. Add import `CxaiAssistantFeatureModule` from `@cx-spartacus/cxai-assistant/feature` into `app.module`
2. Build your application - it must build without errors.

Next follow [Assistant README](cxai-assistant-angular-lib/README.md) for instructions about backend, configuration options and how to add the cms component.

### Ask Product Library
For ask product library, do the same steps but use `:ask-product` for npm commands. Follow [Ask Product README](cxai-assistant-angular-lib/projects/cxai-ask-product/README.md)

## Known Issues (Assistant)
This implementation assumes one chat config per site. Currently backend configs do not take into account language parameter, also language is not passed when opening a new session. To support welcome message in different languages it is required to use translations - see `lib.i18n.ts` for translation keys.

## How to Obtain Support
[Create an issue](https://github.com/SAP-samples/<repository-name>/issues) in this repository if you find a bug or have questions about the content.
 
For additional support, [ask a question in SAP Community](https://answers.sap.com/questions/ask.html).

## Contributing
If you wish to contribute code, offer fixes or improvements, please send a pull request. Due to legal reasons, contributors will be asked to accept a DCO when they create the first pull request to this project. This happens in an automated fashion during the submission process. SAP uses [the standard DCO text of the Linux Foundation](https://developercertificate.org/).

## License
Copyright (c) 2025 SAP SE or an SAP affiliate company. All rights reserved. This project is licensed under the Apache Software License, version 2.0 except as noted otherwise in the [LICENSE](LICENSE) file.
