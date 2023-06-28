import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as vpclattice from 'aws-vpclattice-prealpha';
import { 
  aws_iam as iam,
  aws_ec2 as ec2, 
} 
  from 'aws-cdk-lib';


interface ServiceNetworkProps extends cdk.StackProps {
  searchTag: string;
  assumeRoleArn: string;
  name: string;
}


export class Consumer extends cdk.Stack {

  // the created ec2Instance
  public ec2instance: ec2.Instance
  // the arn of the role
  public consumerRoleArn: string;

  constructor(scope: Construct, id: string, props: ServiceNetworkProps) {
    super(scope, id, props);
    
    const vpc = new ec2.Vpc(this, 'VPC1', {
      ipAddresses: ec2.IpAddresses.cidr('10.10.0.0/16'),
      maxAzs: 2,
      natGateways: 0,
    });

    // add endpoints in the vpc, so, we can get to an instance via ssm
    vpc.addInterfaceEndpoint('ssm', {
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
    });

    vpc.addInterfaceEndpoint('ssm_messages', {
      service: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
    });

    // import the serviceNetwork, which has been shared and associate the vpc with it.
    const serviceNetwork = vpclattice.ServiceNetwork.fromId(this, 'importedservicenetwork', {
      searchTag: props.searchTag,
      assumeRoleArn: props.assumeRoleArn,
    });

    serviceNetwork.associateVPC({vpc: vpc});
    
    
    const consumerRole = new iam.Role(this, 'consumerRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      roleName: cdk.PhysicalName.GENERATE_IF_NEEDED,
    })

    this.consumerRoleArn = consumerRole.roleArn;

    consumerRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['vpc-lattice-svcs:Invoke'],
        resources: ["*"],
      }),
    )

    const ec2instance = new ec2.Instance(this, 'demoEC2instance', {
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.MICRO),
      vpc: vpc,
      allowAllOutbound: true,
      ssmSessionPermissions: true,
      requireImdsv2: true,
      role: consumerRole
    });
  }
}
