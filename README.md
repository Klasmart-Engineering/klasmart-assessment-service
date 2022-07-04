# Assessment Service

[![codecov](https://codecov.io/bb/calmisland/kidsloop-assessment-service/branch/master/graph/badge.svg?token=HMADF4LC8H)](https://codecov.io/bb/calmisland/kidsloop-assessment-service) [![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org) [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

## Remarks

Consumed by the [cms-backend-service](https://bitbucket.org/calmisland/cms-backend-service/src/ee26db558f8d624d045262d4b28f2daee2ce1591/external/h5p_room_score.go?at=dev%2Fglobal%2Falpha#lines-139), which is then consumed by the cms frontend (link needed).

**Branching model**

- `feature/fix/etc` -> squash or rebase into `main`
- The main branch pipeline has a manual _release_ workflow.
- That workflow will build the docker image, push it to ECR, deploy to alpha, and create a GitHub release.
- GitHub prereleases are *upserted* in order to reduce changelog duplication.
- Slack notifications will be sent for non-prereleases.

📢 Follow the specification covered in [CONTRIBUTING.md](CONTRIBUTING.md) 📢

### External KidsLoop dependencies

- [CMS Service](https://bitbucket.org/calmisland/cms-backend-service/) API to query data such as the content library and class schedules
- [H5P Service](https://github.com/KL-Engineering/kidsloop-h5p-library) API to get a list of H5P content information, including sub-contents

---

## Local development

### Prerequisites

#### Installation

- Node v16.x.x
- Npm v6.x.x or higher
- Docker (for Postgres and Redis)

Install the packages and husky git hooks:

```
npm install
```

#### Configuration

Copy/paste `.env.example` in the root directory, rename it to `.env`, and modify as necessary.

Necessary evironment variables:
- `ROUTE_PREFIX`
- `DOMAIN`
- `ASSESSMENT_DATABASE_URL`
- `CMS_API_URL`
- `H5P_API_URL`

Some environment variables must be specified depending on how the service is configured.

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

Create a Redis cluster:

```sh
docker run -it -d \
  --name redis_cluster \
  -e "IP=0.0.0.0" \
  -e "MASTERS=3" \
  -e "SLAVES_PER_MASTER=1" \
  -e "INITIAL_PORT=7000" \
  -p 7000-7005:7000-7005 \
  grokzen/redis-cluster:latest
```

### Running

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

API:

```sh
docker run --rm -it \
  --name kl_assessment_api \
  --net kidsloop \
  --env-file .env \
  --env PORT=8080 \
  --env ASSESSMENT_DATABASE_URL=postgres://postgres:assessments@kl_postgres:5432/assessment_db \
  --env REDIS_URL=redis://kl_redis:6379 \
  --env REDIS_HOST=host.docker.internal \
  --env REDIS_CONSUMER_GROUP=evgeny-local \
  -p 8081:8080 \
  kl-assessment
```

Worker:

```sh
docker run --rm -it \
  --name kl_assessment_worker \
  --net kidsloop \
  --env-file .env \
  --env NODE_ENV=development \
  --env ASSESSMENT_DATABASE_URL=postgres://postgres:assessments@kl_postgres:5432/assessment_db \
  --env ASSESSMENT_DATABASE_LOGGING=false \
  --env REDIS_HOST=host.docker.internal \
  --env REDIS_PORT=7000 \
  --env REDIS_MODE=cluster \
  --env REDIS_STREAM=xapi-demo:events \
  --env REDIS_ERROR_STREAM=xapi:events:error \
  --env REDIS_CONSUMER_GROUP=evgeny-local \
  --env REDIS_CONSUMER=worker-0 \
  kl-assessment \
  node src/worker.js
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

### Alpha info

- Account name: kl-alpha-dev
- Cluster: kidsloop-alpha
- Service: kidsloop-alpha-xapi
- Region: ap-northeast-2

_Where can I find the environment variable values for the alpha environment?_

Once you're granted access to the above account, head to the [service task list](https://ap-northeast-2.console.aws.amazon.com/ecs/home?region=ap-northeast-2#/clusters/kidsloop-alpha/services/assessment-many-cardinal/tasks), and you'll find the values specified in the latest task definition.

---

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
