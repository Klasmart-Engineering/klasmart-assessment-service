#!/bin/sh

pip3 install -U awscli

aws configure set default.region ap-northeast-2

aws dynamodb --endpoint-url=http://localhost:4566 create-table \
    --table-name kidsloop-alpha-xapi-ace-ray \
    --attribute-definitions \
        AttributeName=userId,AttributeType=S \
        AttributeName=serverTimestamp,AttributeType=N \
    --key-schema \
        AttributeName=userId,KeyType=HASH \
        AttributeName=serverTimestamp,KeyType=RANGE \
    --provisioned-throughput \
        ReadCapacityUnits=10,WriteCapacityUnits=5

docker build -t kidsloop-assessment .

docker run --add-host host.docker.internal:$BITBUCKET_DOCKER_HOST_INTERNAL \
    -d \
    --name=check-startup \
    --env-file ./.env.ci \
    kidsloop-assessment && sleep 8 && docker logs check-startup && docker top check-startup
    