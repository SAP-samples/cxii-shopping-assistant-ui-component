# [SAP CX Assistant Chat UI Component]
Spartacus library to use CXII Assistant API.
<!--- Register repository https://api.reuse.software/register, then add REUSE badge:
[![REUSE status](https://api.reuse.software/badge/github.com/SAP-samples/REPO-NAME)](https://api.reuse.software/info/github.com/SAP-samples/REPO-NAME)
-->

## Description
CXAI Assistant library for use with CXAI assistant API

## Requirements
1. Node version specified in `cxai-assistant-angular-lib/.npmrc`
2. Library depends on backend which allows access to part of API without authorization. Library assumes API is served via OCC, you need to modify code (`buildUrl` method) to allow arbitrary URL.
3. valid `configurationId` created by Assistant API. You can pass it via `provideConfig`, or expose backend endpoint that returns it.
See [README](cxai-assistant-angular-lib/README.md) for details.

## Download and Installation
### Build library
1. cd into workspace `cxai-assistant-angular-lib`
3. `nvm use` or use node version specified in `.nvmrc`
4. `npm i`
5. `npm run build` to build the library. Look into `build.sh` to build and publish to your npm repository
    > You must define environment variables with your npm repository credentials - see `.npmrc` file to see which variables are required
6. To connect the library with your application add it to `package.json` and follow [README](cxai-assistant-angular-lib/README.md)

### Run in development mode
1. Run `npm link` in dist folder
2. `npm link @cx-spartacus/cxai-assistant` in your application
    > You need to have `"preserveSymlinks": true,` in app's `angular.json` projects/<project_name>/architect/build
3. Run the library using `npm run watch`
4. Run your app `ng s`

## Known Issues
This implementation opens chat session as soon as chat window is opened. It can be changed to open session only after user sends first message.

## How to obtain support
[Create an issue](https://github.com/SAP-samples/<repository-name>/issues) in this repository if you find a bug or have questions about the content.
 
For additional support, [ask a question in SAP Community](https://answers.sap.com/questions/ask.html).

## Contributing
If you wish to contribute code, offer fixes or improvements, please send a pull request. Due to legal reasons, contributors will be asked to accept a DCO when they create the first pull request to this project. This happens in an automated fashion during the submission process. SAP uses [the standard DCO text of the Linux Foundation](https://developercertificate.org/).

## License
Copyright (c) 2024 SAP SE or an SAP affiliate company. All rights reserved. This project is licensed under the Apache Software License, version 2.0 except as noted otherwise in the [LICENSE](LICENSE) file.
