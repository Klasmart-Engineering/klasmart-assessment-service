# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.9.1](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.9.1..v1.9.0) (2022-01-11)


### Bug Fixes

* revert created_at, updated_at changes + prepare for enabling migrations ([0a94ae6](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/0a94ae6a6aed67c27b7ab672a24cf7ece2f3b170))

## [1.9.0](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.9.0..v1.8.2) (2022-01-05)


### Features

* **DAS-222:** add or rename created_at, updated_at and version columns to all tables ([25b769a](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/25b769ad0f9e43166fb6357d134730364715cb31))


### Bug Fixes

* **tests:** add CreateDatabase Migration script for test database initialization ([01aa735](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/01aa735ddec282933cde88004d0d632cbc9cc7df))
* **tests:** fix and comment out DropAnswerTable migration test ([cee7e24](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/cee7e24c8a9b38f0048205af542d89bc0b834878))

### [1.8.2](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.8.2..v1.8.1) (2021-12-20)


### Bug Fixes

* remove trailing slash from ROUTE_PREFIX + add /home route ([7b43960](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/7b439602078b61c79769f15cfe64b3c479578900))


### Performance

* **Dockerfile:** copy ./node_modules before copying ./dist ([9cf0a93](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/9cf0a931d538108ac7d77ee193332347d0e37d10))

### [1.8.1](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.8.1..v1.8.0) (2021-12-17)


### Bug Fixes

* fix docker container command + restrict access to landing page with ENABLE_DOCS ([c1688e3](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/c1688e3324b51e78d5f0f3c138cdd7ff3e620405))

## [1.8.0](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.8.0..v1.7.6) (2021-12-17)


### Features

* **DAS-218:** create landing page with express and pug templates ([8bf6290](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/8bf6290b09a9262d86fc64af5b83bd86fac6f43e))

### [1.7.6](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.7.6..v1.7.5) (2021-12-14)


### Bug Fixes

* **KLA-326:** wrong lesson material version returned ([cad380d](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/cad380d4c0bac8b210ae43edd882565ab5f78c4f))

### [1.7.5](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.7.5..v1.7.4) (2021-12-08)

### [1.7.4](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.7.4..v1.7.3) (2021-12-07)


### Refactor

* check cms response status and log error if unsuccessful ([6445522](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/64455228e2d0ce4c7c644c00e0c813dc74823b5e))
* **DAS-151:** remove log that has been spamming the consoles ([9081933](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/9081933bfc4367fc8616af3e675d0f880a37dc59))

### [1.7.3](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.7.3..v1.7.2) (2021-12-06)


### Refactor

* **DAS-175:** update apollo server to v3 ([93168b1](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/93168b1e6aa4e06f636c00fa9349a3304d2dfb40))

### [1.7.2](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.7.2..v1.7.1) (2021-12-03)


### Refactor

* **DAS-193:** use read-only collections where applicable ([19fdeaa](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/19fdeaa88522bdff7c8c0c6a7b668893a9bfbd9a))

### [1.7.1](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.7.1..v1.7.0) (2021-12-03)


### Refactor

* organize initialization logic into new folder ([06a69f7](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/06a69f79a81be01f0ad8c68a3049d8628e1b00ae))

## [1.7.0](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.7.0..v1.6.6) (2021-12-03)


### Features

* **DAS-212:** check dynamodb table is active on startup ([5a30841](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/5a30841a9ac8dc1e395deb3e9c13cfae2864b792))


### Refactor

* use kidsloop-nodejs-logger in more files ([f99f89b](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/f99f89bb95531c557970d89181404dd345693302))


### Performance

* **DAS-217:** use aws-sdk dynamodb client v3 instead of v2 to improve xapi query performance ([db3bb7f](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/db3bb7fbe613bd65e34bc3d5fcfe324fc750abba))

### [1.6.6](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.6.6..v1.6.5) (2021-12-01)


### Refactor

* **DAS-215:** include authentication token in cms api requests ([a2c9718](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/a2c9718330fd69b47b0fbb923729ad3c490244ee))

### [1.6.5](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.6.5..v1.6.4) (2021-12-01)


### Performance

* **DAS-183:** cache cms content retrieval ([e650d44](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/e650d446db119758373459e44289e2d6c22bb629))


### Refactor

* lazily evaluate config object ([b7ca64c](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/b7ca64cffc9f01718de746a2471f529cf0ad7d34))

### [1.6.4](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.6.4..v1.6.3) (2021-11-30)

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
