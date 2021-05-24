# Enviroment variables
- DynamoDB
    ```
    export AWS_ACCESS_KEY_ID
    export AWS_SECRET_ACCESS_KEY
    export AWS_REGION="ap-northeast-2"
    export DYNAMODB_TABLE_NAME="kidsloop-alpha-xapi-ace-ray"

# Setup

1.   `docker run -d --name=postgres -p 5432:5432 -e POSTGRES_PASSWORD=kidsloop postgres`
2.   `npm i`

# Restart

1. `docker start postgres`
2. `npm start`
