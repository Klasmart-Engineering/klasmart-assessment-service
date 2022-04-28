# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.0.0-alpha.3](https://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v2.0.0-alpha.3..v2.0.0-alpha.2) (2022-04-28)


### Features

* query CMS for materials to generate missing userContentScores that didn't generate events ([b269ac7](https://bitbucket.org/calmisland/kidsloop-assessment-service/commits/b269ac7701b195f65d1cb0af5d85f917530d03be))

## [2.0.0-alpha.2](https://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v2.0.0-alpha.2..v2.0.0-alpha.1) (2022-04-27)


### Bug Fixes

* function signature in test script ([3c6fa21](https://bitbucket.org/calmisland/kidsloop-assessment-service/commits/3c6fa2123abb7ae7f01f712ed5bbcd3aead06e57))

## [2.0.0-alpha.1](https://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v2.0.0-alpha.1..v2.0.0-alpha.0) (2022-04-27)


### Bug Fixes

* improve error handling during processing + fix readgroup block options command ([19d0038](https://bitbucket.org/calmisland/kidsloop-assessment-service/commits/19d00386d60dfdec7bd93156cc47233466104e9a))

## [2.0.0-alpha.0](https://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v2.0.0-alpha.0..v1.18.1) (2022-04-21)


### Features

* add optional retry upon error with delay mechanism ([1d0cc66](https://bitbucket.org/calmisland/kidsloop-assessment-service/commits/1d0cc667f1a08d6d0524cf2ef0b27810bee3a647))
* working version + fixed tests ([8af28f7](https://bitbucket.org/calmisland/kidsloop-assessment-service/commits/8af28f718233caf2a78ca37c1e06e95a436dd09f))

### Refactor

* improved logs ([70cd0cb](https://bitbucket.org/calmisland/kidsloop-assessment-service/commits/70cd0cbb25590a0499c0cf0dad80ad6ca28a3c3a))
* move worker to root + update env vars ([9a68ec2](https://bitbucket.org/calmisland/kidsloop-assessment-service/commits/9a68ec26af504cc1e440f02550ab330abdc2e5ee))
* switch from redis lib to ioredis for streaming + fix all tests ([ecb5814](https://bitbucket.org/calmisland/kidsloop-assessment-service/commits/ecb58144a91a215083bebc5248087eac48e7a0e1))

### [1.21.1](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.21.1..v1.21.0) (2022-04-26)


### Bug Fixes

* **DAS-340:** only return userId (don't fetch from user service) ([81cefda](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/81cefdaed0a4ba6b861bd6eaf96f9b2717fe7098))

## [1.21.0](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.21.0..v1.20.0) (2022-04-26)


### Features

* **DAS-353:** use parent h5pType if subcontent h5pType is undefined ([3cc5e42](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/3cc5e42dd5561c24c63f62b76dd7c7ade94ee296))

## [1.20.0](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.20.0..v1.19.0) (2022-04-25)


### Features

* include userId in response when user fetch fails ([06c0ff5](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/06c0ff53b79e287b7cb01a8c8fd8c0aa6cf683b1))

## [1.19.0](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.19.0..v1.18.1) (2022-03-29)


### Features

* support adaptive review ([dd0d1e3](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/dd0d1e3ea3829245f4baf86c7f47debf44d51adc))

### [1.18.1](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.18.1..v1.18.0) (2022-03-24)


### Bug Fixes

* check if attendance list is empty before continuing in room resolver ([2a02628](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/2a0262807dacfb102054dfb9b81d8c7eac6335be))

## [1.18.0](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.18.0..v1.17.0) (2022-03-18)


### Features

* **SMK-167:** Add a new deployment pipeline task to deploy to the landing zone [hub.landing-zone.kidsloop.live] ([36d996b](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/36d996b1e14e19b095c1aa42ff831930478e27ef))

## [1.17.0](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.17.0..v1.16.1) (2022-03-15)


### Features

* **DAS-278:** use userNode paginated API ([8bd68a7](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/8bd68a7b78a0d3192b2910f991d5116c6db5138c))

### [1.16.1](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.16.1..v1.16.0) (2022-03-04)

## [1.16.0](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.16.0..v1.15.0) (2022-02-24)


### Features

* **DAS-238:** add @TypeormLoader to UserContentScore entity's OneToMany relations ([ee7ed67](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/ee7ed67fb8a93e823060f4d04fb8a6c34bbfc133))

## [1.15.0](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.15.0..v1.14.0) (2022-02-24)


### Features

* add rommId to xapiEvent interface + skip events that do not belong to the requested room ([061ba65](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/061ba65330835570bc2ce3360ae155390d7d5502))
* **DAS-237:** query xapi events from sqlDb more efficiently + get dynamodb events simultaneously ([8ea8b06](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/8ea8b06d57673224c666ff2b88981b53a9aff78f))

## [1.14.0](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.14.0..v1.13.2) (2022-02-24)


### Features

* **DAS-236:** implement user dataloader batch-fetch, parsing, custom decorator, update fields+tests ([3c069bb](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/3c069bbc90a8e44131fd66254f4ba8f6a371bd86))

### [1.13.2](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.13.2..v1.13.1) (2022-02-23)


### Bug Fixes

* remove logs exposing db urls ([cff020e](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/cff020e5f4d99133dc612031f93de25f680059af))

### [1.13.1](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.13.1..v1.13.0) (2022-02-18)


### Bug Fixes

* add update statements to created_at, etc. migration ([7cc37c0](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/7cc37c07b4494f6389c0be880ff859569e9b58a2))

## [1.13.0](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.13.0..v1.12.0) (2022-02-15)


### Features

* **DAS-107:** add 'Room' query caching logic ([1c8b31c](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/1c8b31c3233a95bbaf828dce68d2bec1519fbdef))

## [1.12.0](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.12.0..v1.11.15) (2022-02-15)


### Features

* **DAS-222:** re-enable created-at-migration by setting flag to true ([31952d9](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/31952d97a49706cba87fc1b169292354d1a3b135))

### [1.11.15](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.11.15..v1.11.14) (2022-02-09)


### Bug Fixes

* don't pass credentials to dynamodb since they are picked up automatically by the aws sdk ([d1bb825](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/d1bb825ba8380c5a4ce97f4b36019cd90a7c1891))

### [1.11.14](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.11.14..v1.11.13) (2022-02-08)

### [1.11.13](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.11.13..v1.11.12) (2022-02-08)


### Bug Fixes

* dynamodb connection was missing the AWS_SESSION_TOKEN to connect to AWS ([7da60b4](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/7da60b408ce1bb8b747fc75344eaa743fa5c2494))

### [1.11.12](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.11.12..v1.11.11) (2022-02-08)


### Refactor

* **DAS-259:** add logger debug statements in resolvers, api methods and providers ([e31d409](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/e31d409fac0ff9fbf773506cde4e9757fe01165a))
* replace lazy static class loggers with regular top-of-the-file const loggers ([5da5591](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/5da55910b1308ca4d0c043e49ad08f10f98065a1))

### [1.11.11](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.11.11..v1.11.10) (2022-02-08)

### [1.11.10](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.11.10..v1.11.9) (2022-02-08)

### [1.11.9](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.11.9..v1.11.8) (2022-02-08)

### [1.11.8](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.11.8..v1.11.7) (2022-02-07)

### [1.11.7](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.11.7..v1.11.6) (2022-02-04)


### Bug Fixes

* **DAS-258:** redis MGET command doesn't accept empty arrays, check beforehand ([4f7113d](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/4f7113df4e7876e17aae9e9f80be28625455dd66))

### [1.11.6](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.11.6..v1.11.5) (2022-02-03)


### Bug Fixes

* **DAS-249:** remove GraphQL Playground and Explorer in production ([56b1bda](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/56b1bda4b3d072e29dc530442c7d9b5610c51cc3))

### [1.11.5](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.11.5..v1.11.4) (2022-01-27)


### Refactor

* **DAS-222:** apply created_at updated_at migration with feature flag ([616339b](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/616339b011a11cbb97150aa07e740b22e881110b))

### [1.11.4](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.11.4..v1.11.3) (2022-01-25)


### Bug Fixes

* add ./scripts to the container to run typeorm migrations CLI from the container ([699a2a7](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/699a2a755a76bdb252e652f153af7c45a7e70dfa))

### [1.11.3](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.11.3..v1.11.2) (2022-01-24)

### [1.11.2](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.11.2..v1.11.1) (2022-01-24)

### [1.11.1](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.11.1..v1.11.0) (2022-01-19)

## [1.11.0](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.11.0..v1.10.0) (2022-01-18)


### Features

* **DAS-219:** implement Redis caching + abstract into ICache with InMemory caching ([b7da0f5](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/b7da0f523fbd809ccc104e2121081622430426e1))


### Refactor

* **redis:** improve error logging ([f142b04](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/f142b0467b520f2356137220311bf8f908051770))

## [1.10.0](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.10.0..v1.9.8) (2022-01-18)


### Features

* **DAS-207:** replace User with the UserNode field from the user-service API ([e6b1278](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/e6b1278d465f5cbbd93eda23dae6990352d3bca0))

### [1.9.8](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.9.8..v1.9.7) (2022-01-18)

### [1.9.7](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.9.7..v1.9.6) (2022-01-17)

### [1.9.6](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.9.6..v1.9.5) (2022-01-12)


### Bug Fixes

* **db-assessments:** typeorm migration directory config for compiled js ([3f3ec83](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/3f3ec83e6a58b595b5b8c762f96f190c95f2f01a))

### [1.9.5](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.9.5..v1.9.4) (2022-01-11)


### Refactor

* remove "disconnected nodes fix" feature flag ([d99a05e](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/d99a05ea065e91637d32a05d60fc185481d5b8d8))

### [1.9.4](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.9.4..v1.9.3) (2022-01-11)

### [1.9.3](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.9.3..v1.9.2) (2022-01-11)


### Refactor

* fix variable naming ([a444ab6](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/a444ab6393202a7286c37b9caa72da68fdb623db))
* introduce string constants for dependency injection ([3b657c2](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/3b657c22a88c5370a3080f723808636b048a8c1b))
* modularize node-fetch logic into dedicated class ([d0df80b](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/d0df80b7c71e2fc194c9282c1bbd5c0adc2a290c))

### [1.9.2](http://bitbucket.org/calmisland/kidsloop-assessment-service/compare/v1.9.2..v1.9.1) (2022-01-11)


### Refactor

* **DAS-178:** implement Answer table timestamp BIGINT migration without table drop + rename ([0bcf6fa](http://bitbucket.org/calmisland/kidsloop-assessment-service/commits/0bcf6fa7da5d4e48cb0d31c4799eb4eb6b52cf05))

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
