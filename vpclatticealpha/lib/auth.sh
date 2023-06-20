#!/bin/bash
TOKEN=`curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"` 
INSTANCE_PROFILE=`curl -H "X-aws-ec2-metadata-token: $TOKEN" -v http://169.254.169.254/latest/meta-data/iam/security-credentials/`
METADATA=`curl -H "X-aws-ec2-metadata-token: $TOKEN" -v http://169.254.169.254/latest/meta-data/iam/security-credentials/$INSTANCE_PROFILE`
ACCESS_KEY_ID=$(echo "$METADATA" | jq .AccessKeyId -r)
SECRET_ACCESS_KEY=$(echo "$METADATA" | jq .SecretAccessKey -r)
SESSION_TOKEN=$(echo "$METADATA" | jq .Token -r)