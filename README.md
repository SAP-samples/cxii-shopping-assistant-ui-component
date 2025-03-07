# SAP-samples/repository-template
This default template for SAP Samples repositories includes files for README, LICENSE, and .reuse/dep5. All repositories on github.com/SAP-samples will be created based on this template.

# Containing Files

1. The LICENSE file:
In most cases, the license for SAP sample projects is `Apache 2.0`.

2. The .reuse/dep5 file: 
The [Reuse Tool](https://reuse.software/) must be used for your samples project. You can find the .reuse/dep5 in the project initial. Please replace the parts inside the single angle quotation marks < > by the specific information for your repository.

3. The README.md file (this file):
Please edit this file as it is the primary description file for your project. You can find some placeholder titles for sections below.

# [Title]
<!-- Please include descriptive title -->

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
3. `nvm use` or use node version specified in `.npmrc`
4. `npm i`
5. `npm run build` to build the library. Look into `build.sh` to build and publish to your npm repository
    > You must define environment variables with your npm repository credentials - see `.npmrc` file to see which variables are required
6. To connect the library with your application add it to `package.json` and follow [README](cxai-assistant-angular-lib/README.md)

### Run in development mode
1. Run `npm link` in dist folder
2. `npm link @cx-spartacus/cxai-assistant` in your application
3. Run using `npm run watch`
4. You need to have `"preserveSymlinks": true,` in app's `angular.json` projects/<project_name>/architect/build

## Known Issues
<!-- You may simply state "No known issues. -->

## How to obtain support
[Create an issue](https://github.com/SAP-samples/<repository-name>/issues) in this repository if you find a bug or have questions about the content.
 
For additional support, [ask a question in SAP Community](https://answers.sap.com/questions/ask.html).

## Contributing
If you wish to contribute code, offer fixes or improvements, please send a pull request. Due to legal reasons, contributors will be asked to accept a DCO when they create the first pull request to this project. This happens in an automated fashion during the submission process. SAP uses [the standard DCO text of the Linux Foundation](https://developercertificate.org/).

## License
Copyright (c) 2024 SAP SE or an SAP affiliate company. All rights reserved. This project is licensed under the Apache Software License, version 2.0 except as noted otherwise in the [LICENSE](LICENSE) file.
