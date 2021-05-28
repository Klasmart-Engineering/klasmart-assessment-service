aws ecr get-login-password --region eu-west-2 | docker login --username AWS --password-stdin 942095822719.dkr.ecr.eu-west-2.amazonaws.com
docker build -t kidsloop-assessment .
docker tag kidsloop-assessment:latest 942095822719.dkr.ecr.eu-west-2.amazonaws.com/kidsloop-assessment:alpha
docker push 942095822719.dkr.ecr.eu-west-2.amazonaws.com/kidsloop-assessment:alpha
