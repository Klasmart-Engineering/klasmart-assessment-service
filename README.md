# Assessment Service

[![codecov](https://codecov.io/bb/calmisland/kidsloop-assessment-service/branch/master/graph/badge.svg?token=HMADF4LC8H)](https://codecov.io/bb/calmisland/kidsloop-assessment-service)

Consumed by the [cms-backend-service](https://bitbucket.org/calmisland/cms-backend-service/src/ee26db558f8d624d045262d4b28f2daee2ce1591/external/h5p_room_score.go?at=dev%2Fglobal%2Falpha#lines-139), which is then consumed by the cms frontend (link needed).

**External KidsLoop dependencies**

- [User Service](https://bitbucket.org/calmisland/kidsloop-user-service) GraphQL API for permission checks
- User database for access to data such as class attendance, user info, and organization memberships
- CMS Database for access to data such as the content library and class schedules
- DynamoDB XAPI table ([H5P library](https://bitbucket.org/calmisland/kidsloop-h5p-library/src/3d34fbc7f25c13b4b42f40bc3fb7c6726019aee1/src/xapi-uploader.ts?at=feature%2Fdocker-token) sends XAPI events, via the [uploader](https://bitbucket.org/calmisland/h5p-xapi-uploader), to the [XAPI server](https://bitbucket.org/calmisland/h5p-xapi-server), which in turn sends them to DynamoDB for us to be able to query here)

**Alpha Info**

- Account name: Kidsloop Dev
- Cluster: kidsloop-alpha
- Service: assessment-many-cardinal
- Region: ap-northeast-2

_Where can I find the environment variable database urls for the alpha environment?_

Once you're granted access to the above account, head to the [assessment service task list](https://ap-northeast-2.console.aws.amazon.com/ecs/home?region=ap-northeast-2#/clusters/kidsloop-alpha/services/assessment-many-cardinal/tasks), and you'll find the urls specified in the latest task definition.

## Local Development

### First time

- `npm i`
- `docker run -d --name=assessments-postgres -p 5442:5432 -e POSTGRES_PASSWORD=assessments -e POSTGRES_DB=test_user_db postgres`
- `docker run -d --name=assessments-mysql -p 3316:3306 -e MYSQL_ROOT_PASSWORD=assessments -e MYSQL_DATABASE=test_cms_db mysql`
- `docker container exec -it assessments-postgres psql -U postgres -c "create database assessment_db;"`
- Copy/paste the _.env.example_ file in the root directory, rename it to _.env_, and fill in the specified environment variables. Set `ASSESSMENT_DATABASE_URL` to the following:
- `ASSESSMENT_DATABASE_URL="postgres://postgres:assessments@localhost:5442/assessment_db"`
- `npm start` OR `npm run dev` to use nodemon

_Note: If the local ports in the snippets above (5442, 3316) are already in use on your system, modify them to be any available port, and then set the corresponding evironment variables e.g._

```
TEST_POSTGRES_PORT=5443
TEST_MYSQL_PORT=3317
```

### Example of setting environment variables via terminal session

**Bash**

```bash
export AWS_REGION="ap-northeast-2"
export DYNAMODB_TABLE_NAME="kidsloop-alpha-xapi-ace-ray"
export ASSESSMENT_DATABASE_URL="postgres://postgres:assessments@localhost:5442/assessment_db"
export USERS_DATABASE_URL="postgres://user:password@localhost:5432/database_name"
export CMS_DATABASE_URL="mysql://user:password@localhost:3306/database_name"
export USER_SERVICE_API_URL="https://api.alpha.kidsloop.net/user/graphql"
```

**Powershell**

```powershell
$env:AWS_REGION="ap-northeast-2"
$env:DYNAMODB_TABLE_NAME="kidsloop-alpha-xapi-ace-ray"
$env:ASSESSMENT_DATABASE_URL="postgres://postgres:assessments@localhost:5442/assessment_db"
$env:USERS_DATABASE_URL="postgres://user:password@localhost:5432/database_name"
$env:CMS_DATABASE_URL="mysql://user:password@localhost:3306/database_name"
$env:USER_SERVICE_API_URL="https://api.alpha.kidsloop.net/user/graphql"
```

### Restart

- `docker start assessments-postgres assessments-mysql`
- `npm start` OR `npm run dev` to use nodemon

### Debugging

1. Navigate to the VS Code debug panel
2. Select _index.ts_ from the dropdown
3. Click the green debug button

## Running Tests

- npm run test:unit
- npm run test:integration
- npm test (to run all)
