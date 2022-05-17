# Assessment Service

[![codecov](https://codecov.io/bb/calmisland/kidsloop-assessment-service/branch/master/graph/badge.svg?token=HMADF4LC8H)](https://codecov.io/bb/calmisland/kidsloop-assessment-service) [![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org) [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)


[TOC]

---

## Remarks

Consumed by the [cms-backend-service](https://bitbucket.org/calmisland/cms-backend-service/src/ee26db558f8d624d045262d4b28f2daee2ce1591/external/h5p_room_score.go?at=dev%2Fglobal%2Falpha#lines-139), which is then consumed by the cms frontend (link needed).

Branching model: merge into `master` and a new version gets automatically released, tagged with a version tag e.g. `1.5.2`.

📢 Follow the specification covered in [CONTRIBUTING.md](CONTRIBUTING.md) 📢

### External KidsLoop dependencies

- [User Service](https://bitbucket.org/calmisland/kidsloop-user-service) GraphQL API to get basic user information
- [CMS Service](https://bitbucket.org/calmisland/cms-backend-service/) API to query data such as the content library and class schedules
- [Attendance Service](https://bitbucket.org/calmisland/kidsloop-attendance-service) API to get the list of attendanees of a given room
- DynamoDB XAPI table ([H5P library](https://bitbucket.org/calmisland/kidsloop-h5p-library/src/3d34fbc7f25c13b4b42f40bc3fb7c6726019aee1/src/xapi-uploader.ts?at=feature%2Fdocker-token) sends XAPI events, via the [uploader](https://bitbucket.org/calmisland/h5p-xapi-uploader), to the [XAPI server](https://bitbucket.org/calmisland/h5p-xapi-server), which in turn sends them to DynamoDB for us to be able to query here)
- XAPI database deployed in Postgres in the case where the environment variable `USE_XAPI_SQL_DATABASE_FLAG` is set to `true` or `1`
- Redis Cache instance (optional)

---

## Local development

### Prerequisites

#### Installation

- Node v14.x.x or higher, Node v16.x.x is preferred
- Npm v6.x.x or higher
- Docker (for Postgres and MySQL)

Install the packages and husky git hooks:

```
npm install
npm run bootstrap
```

#### Configuration

Copy/paste `.env.example` in the root directory, rename it to `.env`, and modify as necessary.

Necessary evironment variables:
- `ROUTE_PREFIX`
- `DOMAIN`
- `ASSESSMENT_DATABASE_URL`
- `CMS_API_URL`
- `USER_SERVICE_ENDPOINT`

Some environment variables must be specified depending on how the service is configured.

If you want to use the Attendance API, make sure to set the following:
- `USE_ATTENDANCE_API = 1`
- `ATTENDANCE_SERVICE_ENDPOINT`

Alternatively, you can access the Attendance database directly and set:
- `USE_ATTENDANCE_API = 0` (optional)
- `ATTENDANCE_DATABASE_URL`

Similarly, if you want to set the service to read XApi data from a DynamoDB table, make sure to set the following:
- `USE_XAPI_SQL_DATABASE_FLAG = 0` (optional)
- `DYNAMODB_TABLE_NAME`
- `AWS_REGION` as well as the AWS credentials (Note: in an AWS environment, `AWS_REGION` and AWS credentials are set automatically, so there's no need to pass them manually)

Alternatively, if you opt for reading XApi data from a Postgres database, set it to:
- `USE_XAPI_SQL_DATABASE_FLAG = 1`
- `XAPI_DATABASE_URL`

The service will cache some of the results in either local Memory or Redis. To use Redis specify its url:
- `REDIS_URL`

Other optional environment variables include:
- `LOG_LEVEL`: default value is `info`, set it to `debug` if you wish to see more detailed logs
- `LOG_STYLE`: default value is `STRING_COLOR`
- `NODE_ENV`: the service assumes that we're running in production unless you set this to `development`. Make sure to set it to `development` to enable the GraphQL Playground
- `ENABLE_PAGE_DOCS`: default value is `false. Shows the API and service documentation page

#### Local database

Create Postgres container

```
docker run -d --name=assessments-postgres -p 5432:5432 -e POSTGRES_PASSWORD=assessments -e POSTGRES_DB=test_assessment_db postgres
```

Create assessment database

```
docker container exec -it assessments-postgres psql -U postgres -c "create database assessment_db; create database xapi_db;"
```

Create a Redis cache

```sh
docker run -it --name kl_redis -d redis:6-alpine
```

Ssh into the Redis instance and access the CLI:

```
# start shell inside the running container
docker exec -it kl_redis sh
# start redis-cli interactive mode
redis-cli
```

### Running

Ensure [AWS credentials are configured](https://aws.amazon.com/blogs/security/aws-single-sign-on-now-enables-command-line-interface-access-for-aws-accounts-using-corporate-credentials/) (for access to DynamoDB)

Ensure all dependencies are installed

```
npm install
```

Ensure Postgres is running

```
docker start assessments-postgres
```

Kickstart the server:

```
npm start
```

Or run it with nodemon to reload automatically when changes occur:

```
npm run dev
```

### Running in docker

Make sure to compile the Typescript into JS

```sh
npm run build
```

Next build the container

```sh
docker build -t kl-assessment .
```

Now run the container and make sure to pass it the right environment variables. For simplicity you can pass it your `.env` file that you use locally and then overwrite with `--env`

```sh
docker run --rm -it \
  --env-file .env \
  --env PORT=8080 \
  --env AWS_ACCESS_KEY_ID \
  --env AWS_SECRET_ACCESS_KEY \
  --env AWS_SESSION_TOKEN \
  --env ASSESSMENT_DATABASE_URL=postgres://postgres:assessments@kl_postgres:5432/assessment_db \
  --env REDIS_URL=redis://kl_redis:6379 \
  -p 8081:8080 \
  kl-assessment
```

### Debugging

1. Navigate to the VS Code sidebar debug panel
2. Select `index.ts` from the dropdown
3. Click the green arrow debug button

### Testing

Run unit tests

```
npm run test:unit
```

Run integration tests

```
npm run test:integration
```

Run both unit and integration tests

```
npm test
```

Run both unit and integration tests, and generate a local coverage report. Results can be viewed at `/test-results/coverage.lcov/lcov-report/index.html`. Useful for finding lines/branches that aren't covered.

```
npm run test:coverage
```

_Tip: when debugging or focusing on a particular test or group of tests, append `.only` to `describe`, `context`, or `it` to only execute that scope of tests. But of course, make sure to undo it before making a commit._

---

## Deployment

We use the [Bitbucket Deployments](https://bitbucket.org/blog/introducing-bitbucket-deployments) feature for a nice overview of deployment history. The quality of the Jira integration depends on ticket IDs being included in commit messages, so it's important to make an effort to do so.

- The [Bitbucket view](https://bitbucket.org/calmisland/kidsloop-assessment-service/addon/pipelines/deployments) can be accessed from the sidebar via the Deployments tab.
- The [Jira view](https://calmisland.atlassian.net/jira/software/c/projects/DAS/deployments?startDate=-3m&endDate=now) can be accessed from the sidebar of Jira via the Deployments tab.

Everytime a PR is merged into `master`, the Bitbucket pipeline runs the stadard-release process, which pushes a new commit to `master` and tags with the new version. This new commit triggers another pipeline that builds and pushes a new docker image to the _Kidsloop Infra_ account. Making the actual deployment requires another step, which differs between alpha and production.

### Alpha

1. Head over to the [ECS service](https://ap-northeast-2.console.aws.amazon.com/ecs/home?region=ap-northeast-2#/clusters/kidsloop-alpha/services/assessment-many-cardinal/details) in the _Kidsloop Dev_ account.
2. Click "Update" in the top right corner.
3. Check the "Force new deployment" checkbox.
4. Click "Skip to review"
5. Click "Update service.

### Production

Make a PR in the [kidsloop-infra](https://bitbucket.org/calmisland/kidsloop-infra/src/main/) repository, using [this merged PR](https://bitbucket.org/calmisland/kidsloop-infra/pull-requests/148) as a template.

### Alpha info

- Account name: Kidsloop Dev
- Cluster: kidsloop-alpha
- Service: kidsloop-alpha-xapi
- Region: ap-northeast-2
- DynamoDB table: kidsloop-alpha-xapi-ace-ray

_Where can I find the environment variable values for the alpha environment?_

Once you're granted access to the above account, head to the [service task list](https://ap-northeast-2.console.aws.amazon.com/ecs/home?region=ap-northeast-2#/clusters/kidsloop-alpha/services/assessment-many-cardinal/tasks), and you'll find the values specified in the latest task definition.

---

## Recommended VS Code extensions

- [Jira and Bitbucket](https://marketplace.visualstudio.com/items?itemName=Atlassian.atlascode)
- [Mocha Test Explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-mocha-test-adapter)


## Migrations

Use `typeorm` to generate and run migrations.

Docs:
- [typeorm - Migrations](https://github.com/typeorm/typeorm/blob/master/docs/migrations.md)
- [typeorm - Using CLI](https://github.com/typeorm/typeorm/blob/master/docs/using-cli.md)

To generate a migration, make sure there's an `ormConfig.json` file present. You can generate it with the `./scripts/generateOrmConfig.ts` script. Then run the following:

```sh
npm run typeorm migration:generate -- --config ormConfig.json -c assessments -n MigrationName
```

Manually run a migration:

```sh
npm run typeorm migration:run -- --config ormConfig.json -c assessments
```

Revert a migration:

```sh
npm run typeorm migration:revert -- --config ormConfig.json -c assessments
```

### Revert migrations with the docker container

Torevert a migration from the docker container, run the following command to generate the `ormConfig.json` and subsequently revert the migration using the typeorm cli:

```sh
docker run --rm -it \
  --env ASSESSMENT_DATABASE_URL=postgres://postgres:assessments@kl_postgres:5432/assessment_db \
  kl-assessment \
  /bin/sh -c "node scripts/generateOrmConfig.js && npx typeorm migration:revert --config ormConfig.json -c assessments"
```


## Miscellaneous

#### Scan entire dynamoDb table and count items

```sh
aws dynamodb scan --region ap-northeast-2 --table-name kidsloop-alpha-xapi-ace-ray --select "COUNT"
```

#### Generate ormConfig.json for manual migrations

```sh
./scripts/generateOrmConfig.ts
```

#### Generate JWT token with nearly-inifitine expiration date (debug tokens only)

```
./scripts/generateJwt.ts
```
