# vpclattice-prealpha-demo
Prealpha Demo - 

This is rough, buggy, and is going to move quite quickly.  Expect things not to work.. this is early code. 

1. clone repo
2. cd vpclatticealpha
3. npm install
4. cdk synth
5. cdk deploy --profile <yourprofile>

Go to the reigion/account you have deployed to, 
Find the Ec2 instance  called ( VpclatticealphaStack/SupportResources/demoEC2instance ) and use SSM to connect to it.
Find the URL of the service from Lattice in EC2..

from the console of the ec2 instance.. 
```bash
curl https://<url>/hello
curl https://<url>/goodbye
curl https://<url>/thisdoesnotexisit
```




