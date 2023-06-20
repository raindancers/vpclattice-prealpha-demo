#!/bin/bash
TOKEN=`curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"`
INSTANCE_PROFILE=`curl -s -H "X-aws-ec2-metadata-token: $TOKEN" -v http://169.254.169.254/latest/meta-data/iam/security-credentials/`
METADATA=`curl -s -H "X-aws-ec2-metadata-token: $TOKEN" -v http://169.254.169.254/latest/meta-data/iam/security-credentials/$INSTANCE_PROFILE`
ACCESS_KEY_ID=$(echo "$METADATA" | jq .AccessKeyId -r)
SECRET_ACCESS_KEY=$(echo "$METADATA" | jq .SecretAccessKey -r)
SESSION_TOKEN=$(echo "$METADATA" | jq .Token -r)
curl -s $1 -H "x-amz-content-sha256: UNSIGNED-PAYLOAD" -H "x-amz-security-token:$SESSION_TOKEN" --user $ACCESS_KEY_ID:$SECRET_ACCESS_KEY --aws-sigv4 "aws:amz:us-west-2:vpc-lattice-svcs"