# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.2.0](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.1.0...v1.2.0) (2021-11-04)


### Features

* **assessment-db:** generate migration script to re-create Answer table with updated schema ([3509e2e](http://bitbucket.org/calmisland/kidsloop-assessment-service/commit/3509e2e945f9b50abf671183b84e0b3eedc9569a))
* **assessment-db:** set synchronize to false, set migrationsRun to true ([378508a](http://bitbucket.org/calmisland/kidsloop-assessment-service/commit/378508a183c2990b587e49abc4cab0292752b97f))
* **migrations:** add locking mechanism as first migration script ([6bcced8](http://bitbucket.org/calmisland/kidsloop-assessment-service/commit/6bcced8dac716a40fcb6b243c1ac28feb2d18891))


### Bug Fixes

* add compiled dist/migrations/*.js to typeorm migration config to run migrations in docker ([01c0b5f](http://bitbucket.org/calmisland/kidsloop-assessment-service/commit/01c0b5f041c88eb5afd627226c51093c7114fa7c))
* fix MigrationLock script migration table name ([828d455](http://bitbucket.org/calmisland/kidsloop-assessment-service/commit/828d455a75970654c251c06ee6104f625d315154))
* fix test Migration script import ([6f82fb1](http://bitbucket.org/calmisland/kidsloop-assessment-service/commit/6f82fb141e2688ec9c7b49c7f11863b9af70c987))


* add migration info + misc to README ([42873bc](http://bitbucket.org/calmisland/kidsloop-assessment-service/commit/42873bc147261aa053c90b90bb8b6740aeb86dc9))
* add script to generate ormConfig.json file for manually running migrations with typeorm ([0ca861d](http://bitbucket.org/calmisland/kidsloop-assessment-service/commit/0ca861d7b46ff2dba8c5009279df945b4b2c54a2))
* add typeorm cli to npm scripts ([b31d1c0](http://bitbucket.org/calmisland/kidsloop-assessment-service/commit/b31d1c0a5c6197ffabd48c3b491c18d63f361d64))
* cleanup ([849b7fb](http://bitbucket.org/calmisland/kidsloop-assessment-service/commit/849b7fbae4387171f651d08518f67c25a4f9800f))
* expect assessment-db>config>synchronize to be false ([1ba79f8](http://bitbucket.org/calmisland/kidsloop-assessment-service/commit/1ba79f890d3c8a809c291429053b91df55de0ec6))
* fix ([09895d0](http://bitbucket.org/calmisland/kidsloop-assessment-service/commit/09895d01573ada6f1480b7052bb98a9d8ce8173a))
* fix ([f267359](http://bitbucket.org/calmisland/kidsloop-assessment-service/commit/f26735929126044608243c8bf25d63cb1f3d7796))
* rename migration file to timestamp-name convention ([4fc6eca](http://bitbucket.org/calmisland/kidsloop-assessment-service/commit/4fc6ecaa152323e19b78ecab65d3662f328513dd))

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
