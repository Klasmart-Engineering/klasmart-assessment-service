# Assessment Service

[![codecov](https://codecov.io/bb/calmisland/kidsloop-assessment-service/branch/master/graph/badge.svg?token=HMADF4LC8H)](https://codecov.io/bb/calmisland/kidsloop-assessment-service)

[TOC]

---

## Remarks

Consumed by the [cms-backend-service](https://bitbucket.org/calmisland/cms-backend-service/src/ee26db558f8d624d045262d4b28f2daee2ce1591/external/h5p_room_score.go?at=dev%2Fglobal%2Falpha#lines-139), which is then consumed by the cms frontend (link needed).

Branching model: `feature/fix/etc` -> `master` -> `alpha` -> `production`

Contributing: Follow the specification covered in [CONTRIBUTING.md](contributing)

### External KidsLoop dependencies

- [User Service](https://bitbucket.org/calmisland/kidsloop-user-service) GraphQL API for permission checks
- User database for access to data such as class attendance, user info, and organization memberships
- CMS Database for access to data such as the content library and class schedules
- DynamoDB XAPI table ([H5P library](https://bitbucket.org/calmisland/kidsloop-h5p-library/src/3d34fbc7f25c13b4b42f40bc3fb7c6726019aee1/src/xapi-uploader.ts?at=feature%2Fdocker-token) sends XAPI events, via the [uploader](https://bitbucket.org/calmisland/h5p-xapi-uploader), to the [XAPI server](https://bitbucket.org/calmisland/h5p-xapi-server), which in turn sends them to DynamoDB for us to be able to query here)

---

## Local development

### Prerequisites

#### Installation

- Node v14.x.x
- Npm v6.x.x
- Docker (for Postgres and MySQL)

#### Configuration

Copy/paste `.env.example` in the root directory, rename it to `.env`, and modify as necessary.

Create Postgres container

```
docker run -d --name=assessments-postgres -p 5442:5432 -e POSTGRES_PASSWORD=assessments -e POSTGRES_DB=test_user_db postgres
```

Create MySQL container

```
docker run -d --name=assessments-mysql -p 3316:3306 -e MYSQL_ROOT_PASSWORD=assessments -e MYSQL_DATABASE=test_cms_db mysql
```

Create assessment database

```
docker container exec -it assessments-postgres psql -U postgres -c "create database assessment_db;"
```

### Running

Ensure [AWS credentials are configured](https://aws.amazon.com/blogs/security/aws-single-sign-on-now-enables-command-line-interface-access-for-aws-accounts-using-corporate-credentials/) (for access to DynamoDB)

Ensure all dependencies are installed

```
npm install
```

Ensure Postgres and MySQL are running

```
docker start assessments-postgres assessments-mysql
```

Run

```
npm start
```

Run with nodemon

```
npm run dev
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

The Bitbucket pipeline builds and pushes a new docker image to the _Kidsloop Infra_ account every time code is merged into the `alpha` or `production` branch. Making the actual deployment requires another step, which differs between alpha and production.

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
