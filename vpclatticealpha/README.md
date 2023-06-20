# vpclattice-prealpha-demo

*CAUTION*: This demo may have bugs and it will likley change as the vpclattice L2 construct matures.  Be ready for things not to work.. When you see them
please raise an issue.  That way we have a chance to fix them and improve the construct 


## Prerequisites. 

- It is assumed you have CDK installed, an account avaiable to use and boostrapped, and a profile that has permission to deploy


## Clone and Deploy

1. clone this repo
2. cd vpclatticealpha
3. npm install
4. cdk synth
5. cdk deploy --profile <yourprofile>
---



## Test this VPCLattice Stack
- Go to the reigion/account you have deployed to in Aws Console
- Find the Ec2 instance  called  `VpclatticealphaStack/SupportResources/demoEC2instance` and use SSM to connect to it. ( you can use either the console, or via SSH over SSM )

- Find the URL of the VpcLattice service, that the stack created.  The service will be called `vpclatticealp-mylatticeserv-xxxxxxx`



### Unauthenticated Requests
from the console of the ec2 instance.. send these unauthenticated requests

```bash
curl https://<url from above>/hello
```

This should return

`Hello from <region>`

```bash
curl https://<url from above>/goodbye
```
This should return

`AccessDeniedException: User: anonymous is not authorized to perform: vpc-lattice-svcs:Invoke on resource: arn:aws:vpc-lattice:us-west-2:428594345836:service/svc-0b17e5b0e8a993adf/goodbye because no service-based policy allows the vpc-lattice-svcs:Invoke action`


Looking at the Service Access Policy in the console, and you should see that Unauthenticated Acesss is permitted to the /hello path, but not the /goodbye path.


### Authenticated Requests

Authenticated requests require signing.  We can use `curl` to sign the requests.    In this example stack, the ec2's role has been granted permission to access the /goodbye stack, so we need to use its credentials.   

We need to [Retreive the instance Metadata](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instancedata-data-retrieval.html) so 
we can sign the requests.  

Issue these commands from the Instances CLI to obtain the SESSION_TOKEN

```bash
TOKEN=`curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"`
INSTANCE_PROFILE=`curl -s -H "X-aws-ec2-metadata-token: $TOKEN" -v http://169.254.169.254/latest/meta-data/iam/security-credentials/`
METADATA=`curl -s -H "X-aws-ec2-metadata-token: $TOKEN" -v http://169.254.169.254/latest/meta-data/iam/security-credentials/$INSTANCE_PROFILE`
ACCESS_KEY_ID=$(echo "$METADATA" | jq .AccessKeyId -r)
SECRET_ACCESS_KEY=$(echo "$METADATA" | jq .SecretAccessKey -r)
SESSION_TOKEN=$(echo "$METADATA" | jq .Token -r)
```

Now it is possible to make a a signed request with curl to the vpclattivce services


``` bash
curl -s <url>/goodbye -H "x-amz-content-sha256: UNSIGNED-PAYLOAD" -H "x-amz-security-token:$SESSION_TOKEN" --user $ACCESS_KEY_ID:$SECRET_ACCESS_KEY --aws-sigv4 "aws:amz:<region>:vpc-lattice-svcs"
```

this should return 

`goodbye from <region>`


### Suggested Activitys.

- Modify the stack to add additional lambda functions
- Create targets that are not lambdas
- Investigate creation of policy


### Shell Script
You may want to set up a shell script to make this easier, if you are intending on doing modification and testing on this demo for example, or there are other tools which will sign the requests. 

```bash
#!/bin/bash
TOKEN=`curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"`
INSTANCE_PROFILE=`curl -s -H "X-aws-ec2-metadata-token: $TOKEN" -v http://169.254.169.254/latest/meta-data/iam/security-credentials/`
METADATA=`curl -s -H "X-aws-ec2-metadata-token: $TOKEN" -v http://169.254.169.254/latest/meta-data/iam/security-credentials/$INSTANCE_PROFILE`
ACCESS_KEY_ID=$(echo "$METADATA" | jq .AccessKeyId -r)
SECRET_ACCESS_KEY=$(echo "$METADATA" | jq .SecretAccessKey -r)
SESSION_TOKEN=$(echo "$METADATA" | jq .Token -r)
curl -s $1 -H "x-amz-content-sha256: UNSIGNED-PAYLOAD" -H "x-amz-security-token:$SESSION_TOKEN" --user $ACCESS_KEY_ID:$SECRET_ACCESS_KEY --aws-sigv4 "aws:amz:us-west-2:vpc-lattice-svcs"
```
