# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.6.3](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.6.3..v1.6.2) (2021-11-29)


### Bug Fixes

* **KLA-252:** content.parent_id not assigned in specific case ([5301501](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/5301501be940f852ba24a7a102c63ce26da68ccc))

### [1.6.2](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.6.2..v1.6.1) (2021-11-26)


### Refactor

* restructure apis in src/web ([a88299b](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/a88299bf1d4363b0385d840d740bbda02f907f3c))
* restructure providers ([216b1b2](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/216b1b23f9fd274e7ab89a7d783650cc70c66749))

### [1.6.1](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.6.1..v1.6.0) (2021-11-26)


### Refactor

* **DAS-190:** replace internal logger usage with logger from kidsloop-nodejs-logger ([b7e65eb](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/b7e65eb1e7d41c092487c3ea65fa46d7ef6d334b))

## [1.6.0](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.6.0..v1.5.2) (2021-11-26)


### Features

* **DAS-213:** add support to switch between attendance API and attendance DB with a boolean env var ([5b60e29](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/5b60e29a5bab62e3fab9725ca4ed86010a0ddaf7))


### Refactor

* **DAS-161:** use attendance service API instead of querying DB ([cf8284d](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/cf8284de7968fd903e0d50b81b024ffffde59a8d))
* rename userDb to attendanceDb + cleanup ([5dff2fc](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/5dff2fc292134166106134161393dd243cd4be5a))

### [1.5.2](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.5.2..v1.5.1) (2021-11-24)

### [1.5.1](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.5.1..v1.5.0) (2021-11-24)


### Refactor

* **DAS-131:** replace cms db access with web api ([a1ac6fa](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/a1ac6fafbfacf859f24b36bb975f38c182b18412))

## [1.5.0](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.5.0..v1.4.0) (2021-11-23)


### Refactor

* **DAS-189:** replace userDB with user-service API + update resolvers ([77120e7](https://bitbucket.org/calmisland/kidsloop-assessment-service/commits/77120e7e58e17208397d278009eb2f7559efb464))

## [1.4.0](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.4.0..v1.3.6) (2021-11-18)


### Features

* **DAS-194:** add FeatureFlags + update roomScoreTemplateProvider helper and test ([04e1dca](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/04e1dca63c705774b17c6c8363dfebcb68a171fc))

### [1.3.6](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.3.6..v1.3.5) (2021-11-16)


### Refactor

* **DAS-177:** modularize server creation and db connections ([b6749b2](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/b6749b20405fde4fa665800791fcec0fb9392a24))

### [1.3.5](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.3.5..v1.3.4) (2021-11-15)


### Refactor

* **DAS-173:** replace auth.ts with kidsloop-token-validation library ([5d9f94c](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/5d9f94ca62ead48de361c232e9e070c3832e75b6))


* stop prettier from complaining about line endings ([7264435](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/72644359cbb6f1ee0cc61bfa60e24f1d5b964be6))
* update CHANGELOG v1.3.4 release description ([260f87f](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/260f87f6b3197543c70d0ea283522a147df06082))

### [1.3.4](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.3.4..v1.3.3) (2021-11-15)

### Bug Fixes

* fix: revert Answer timestamp to Date + set synchronise=true, runMigrations=false ([6bcced8](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/a5db9bf975a75cefb56c4db9b093e6ef18fcc8f5))

### [1.3.3](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.3.3..v1.3.2) (2021-11-11)


### Bug Fixes

* disconnected UserContentScore nodes ([cc49d4e](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/cc49d4ed0ba7299a057033774e157e22dbe8d5e7))

### [1.3.2](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.3.2..v1.3.1) (2021-11-04)

### [1.3.1](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.3.1..v1.3.0) (2021-11-04)

## [1.3.0](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.3.0..v1.2.0) (2021-11-04)


### Features

* **assessment-db:** generate migration script to re-create Answer table with updated schema ([3509e2e](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/3509e2e945f9b50abf671183b84e0b3eedc9569a))
* **assessment-db:** set synchronize to false, set migrationsRun to true ([378508a](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/378508a183c2990b587e49abc4cab0292752b97f))
* **migrations:** add locking mechanism as first migration script ([6bcced8](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/6bcced8dac716a40fcb6b243c1ac28feb2d18891))


### Bug Fixes

* add compiled dist/migrations/*.js to typeorm migration config to run migrations in docker ([01c0b5f](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/01c0b5f041c88eb5afd627226c51093c7114fa7c))
* fix MigrationLock script migration table name ([828d455](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/828d455a75970654c251c06ee6104f625d315154))
* fix test Migration script import ([6f82fb1](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/6f82fb141e2688ec9c7b49c7f11863b9af70c987))


* add migration info + misc to README ([42873bc](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/42873bc147261aa053c90b90bb8b6740aeb86dc9))
* add script to generate ormConfig.json file for manually running migrations with typeorm ([0ca861d](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/0ca861d7b46ff2dba8c5009279df945b4b2c54a2))
* add typeorm cli to npm scripts ([b31d1c0](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/b31d1c0a5c6197ffabd48c3b491c18d63f361d64))
* cleanup ([849b7fb](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/849b7fbae4387171f651d08518f67c25a4f9800f))
* expect assessment-db>config>synchronize to be false ([1ba79f8](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/1ba79f890d3c8a809c291429053b91df55de0ec6))
* fix ([09895d0](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/09895d01573ada6f1480b7052bb98a9d8ce8173a))
* fix ([f267359](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/f26735929126044608243c8bf25d63cb1f3d7796))
* **release:** 1.2.0 ([e03639f](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/e03639f02c4cfcc474d803147d175e9187a6ea81))
* rename migration file to timestamp-name convention ([4fc6eca](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/4fc6ecaa152323e19b78ecab65d3662f328513dd))

## [1.2.0](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.2.0..v1.1.0) (2021-11-04)


### Features

* **assessment-db:** generate migration script to re-create Answer table with updated schema ([3509e2e](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/3509e2e945f9b50abf671183b84e0b3eedc9569a))
* **assessment-db:** set synchronize to false, set migrationsRun to true ([378508a](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/378508a183c2990b587e49abc4cab0292752b97f))
* **migrations:** add locking mechanism as first migration script ([6bcced8](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/6bcced8dac716a40fcb6b243c1ac28feb2d18891))


### Bug Fixes

* add compiled dist/migrations/*.js to typeorm migration config to run migrations in docker ([01c0b5f](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/01c0b5f041c88eb5afd627226c51093c7114fa7c))
* fix MigrationLock script migration table name ([828d455](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/828d455a75970654c251c06ee6104f625d315154))
* fix test Migration script import ([6f82fb1](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/6f82fb141e2688ec9c7b49c7f11863b9af70c987))


* add migration info + misc to README ([42873bc](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/42873bc147261aa053c90b90bb8b6740aeb86dc9))
* add script to generate ormConfig.json file for manually running migrations with typeorm ([0ca861d](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/0ca861d7b46ff2dba8c5009279df945b4b2c54a2))
* add typeorm cli to npm scripts ([b31d1c0](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/b31d1c0a5c6197ffabd48c3b491c18d63f361d64))
* cleanup ([849b7fb](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/849b7fbae4387171f651d08518f67c25a4f9800f))
* expect assessment-db>config>synchronize to be false ([1ba79f8](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/1ba79f890d3c8a809c291429053b91df55de0ec6))
* fix ([09895d0](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/09895d01573ada6f1480b7052bb98a9d8ce8173a))
* fix ([f267359](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/f26735929126044608243c8bf25d63cb1f3d7796))
* rename migration file to timestamp-name convention ([4fc6eca](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/4fc6ecaa152323e19b78ecab65d3662f328513dd))

## [1.1.0](https://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.1.0..v1.0.0) (2021-10-27)


### Features

* add newrelic entrypoint + newrelic apollo plugin ([516d701](https://bitbucket.org/calmisland/kidsloop-assessment-service/commits/516d7017d850ffab1f17470ebd1438b271f4ab73))
* add parent_id field to Content entity ([070d945](https://bitbucket.org/calmisland/kidsloop-assessment-service/commits/070d9453e47efcbbf88c2b2d3108b07288834a38))


### Bug Fixes

* add useUnknownInCatchVariables: false to tsconfig to prevent build failures due to bumped TS version ([66ea74f](https://bitbucket.org/calmisland/kidsloop-assessment-service/commits/66ea74f5779ecd36c7d69b5b9b91acc8c937dffc))
* bump typescript version to 4.4.4 ([4d400db](https://bitbucket.org/calmisland/kidsloop-assessment-service/commits/4d400db3827f60822c8eccf13a4d9a5010bc7034))
* fix build issue caused by new version of @types/jsonwebtoken ([f885e91](https://bitbucket.org/calmisland/kidsloop-assessment-service/commits/f885e91cbee5b45230dda724e7a4f4efc33f28bc))
* update package-lock to fix npm ci ERR in docker build ([41cd5dd](https://bitbucket.org/calmisland/kidsloop-assessment-service/commits/41cd5dd0af30e67e904a7a9721813112bca64941))

### [0.1.1](https://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v0.1.1...v0.1.0) (2021-07-12)

## [1.0.0](https://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v0.1.0...v1.0.0) (2021-10-18)


### Features

* add newrelic entrypoint + newrelic apollo plugin ([d9b0710](https://bitbucket.org/calmisland/kidsloop-assessment-service/commits/d9b07109efe04d359a755ad7af11bb7c7b420c65))
* add parent_id field to Content entity ([80a7c8a](https://bitbucket.org/calmisland/kidsloop-assessment-service/commits/80a7c8afd57dbdead0ceea414f70c408cb206062))
* **xapi:** implement sql repo for querying xapi as alternative to dynamodb ([00cb0eb](https://bitbucket.org/calmisland/kidsloop-assessment-service/commits/00cb0eb641a5187e62cd2f2700022c7d1788944e))


### Bug Fixes

* "request entity too large" error ([0e5b3b0](https://bitbucket.org/calmisland/kidsloop-assessment-service/commits/0e5b3b0473efdc0dd83c2a6548496aff959fe797))
* error when postgres implementation isn't used ([5da0268](https://bitbucket.org/calmisland/kidsloop-assessment-service/commits/5da02684700b70abdef23e0f9be8a8f98c74d5c2))
* error when running the docker build ([2ba1b8f](https://bitbucket.org/calmisland/kidsloop-assessment-service/commits/2ba1b8fc0b67b4a0c3b5c86f1d1bbf482f553424))
* non-null constraint error ([0c0d7d4](https://bitbucket.org/calmisland/kidsloop-assessment-service/commits/0c0d7d41e889332eb53c19bea432efa961be74d5))
* xAPI runtime error when using Postgres implementation ([4579d73](https://bitbucket.org/calmisland/kidsloop-assessment-service/commits/4579d733d75ee56b3e85e0d41c7e0ad7f03a5b47))
