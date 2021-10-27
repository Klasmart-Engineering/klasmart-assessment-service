# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.1.0](https://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.0.0...v1.1.0) (2021-10-27)


### Features

* add newrelic entrypoint + newrelic apollo plugin ([516d701](https://bitbucket.org/calmisland/kidsloop-assessment-service/commit/516d7017d850ffab1f17470ebd1438b271f4ab73))
* add parent_id field to Content entity ([070d945](https://bitbucket.org/calmisland/kidsloop-assessment-service/commit/070d9453e47efcbbf88c2b2d3108b07288834a38))


### Bug Fixes

* add useUnknownInCatchVariables: false to tsconfig to prevent build failures due to bumped TS version ([66ea74f](https://bitbucket.org/calmisland/kidsloop-assessment-service/commit/66ea74f5779ecd36c7d69b5b9b91acc8c937dffc))
* bump typescript version to 4.4.4 ([4d400db](https://bitbucket.org/calmisland/kidsloop-assessment-service/commit/4d400db3827f60822c8eccf13a4d9a5010bc7034))
* fix build issue caused by new version of @types/jsonwebtoken ([f885e91](https://bitbucket.org/calmisland/kidsloop-assessment-service/commit/f885e91cbee5b45230dda724e7a4f4efc33f28bc))
* update package-lock to fix npm ci ERR in docker build ([41cd5dd](https://bitbucket.org/calmisland/kidsloop-assessment-service/commit/41cd5dd0af30e67e904a7a9721813112bca64941))

### [0.1.1](https://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v0.1.0...v0.1.1) (2021-07-12)

## [1.0.0](https://calmisland///compare/v0.1.0...v1.0.0) (2021-10-18)


### Features

* add newrelic entrypoint + newrelic apollo plugin ([d9b0710](https://calmisland///commit/d9b07109efe04d359a755ad7af11bb7c7b420c65))
* add parent_id field to Content entity ([80a7c8a](https://calmisland///commit/80a7c8afd57dbdead0ceea414f70c408cb206062))
* **xapi:** implement sql repo for querying xapi as alternative to dynamodb ([00cb0eb](https://calmisland///commit/00cb0eb641a5187e62cd2f2700022c7d1788944e))


### Bug Fixes

* "request entity too large" error ([0e5b3b0](https://calmisland///commit/0e5b3b0473efdc0dd83c2a6548496aff959fe797))
* error when postgres implementation isn't used ([5da0268](https://calmisland///commit/5da02684700b70abdef23e0f9be8a8f98c74d5c2))
* error when running the docker build ([2ba1b8f](https://calmisland///commit/2ba1b8fc0b67b4a0c3b5c86f1d1bbf482f553424))
* non-null constraint error ([0c0d7d4](https://calmisland///commit/0c0d7d41e889332eb53c19bea432efa961be74d5))
* xAPI runtime error when using Postgres implementation ([4579d73](https://calmisland///commit/4579d733d75ee56b3e85e0d41c7e0ad7f03a5b47))
