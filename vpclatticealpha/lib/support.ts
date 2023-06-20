import * as path from 'path';
import * as core from 'aws-cdk-lib';

import {
  aws_iam as iam,
  aws_ec2 as ec2,
  aws_lambda,
}
  from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Effect } from 'aws-cdk-lib/aws-iam';

export class SupportResources extends Construct {

  public helloWorld: core.aws_lambda.Function;
  public goodbyeWorld: core.aws_lambda.Function;
  public vpc1: ec2.Vpc;
  public ec2instance: ec2.Instance;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // NOTE for the purpose of this demonstration, we are deliberately overlapping the IP Address ranges.
    // a vpc for the helloworld lambda
    this.vpc1 = new ec2.Vpc(this, 'VPC1', {
      ipAddresses: ec2.IpAddresses.cidr('10.10.0.0/16'),
      maxAzs: 2,
      natGateways: 0,
    });

    // add endpoints in the vpc, so, we can get to an instance via ssm
    this.vpc1.addInterfaceEndpoint('ssm', {
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
    })

    this.vpc1.addInterfaceEndpoint('ssm_mewssages', {
      service: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
    })


  // give the hello lambda a role and permissions
    const helloRole = new iam.Role(this, 'helloRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    helloRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ['*'],
      actions: [
        'ec2:CreateNetworkInterface',
        'ec2:DescribeNetworkInterfaces',
        'ec2:DeleteNetworkInterface',
      ],
    }));

	// give the goodbye lambda a role and permissions
    const goodbyeRole = new iam.Role(this, 'checkRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    goodbyeRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ['*'],
      actions: [
        'ec2:CreateNetworkInterface',
        'ec2:DescribeNetworkInterfaces',
        'ec2:DeleteNetworkInterface',
      ],
    })),

	// create the hello world lambda
    this.helloWorld = new aws_lambda.Function(this, 'Helloworld', {
      runtime: aws_lambda.Runtime.PYTHON_3_10,
      handler: 'helloworld.lambda_handler',
      code: aws_lambda.Code.fromAsset(path.join(__dirname, './lambda' )),
      timeout: core.Duration.seconds(15),
      role: helloRole,
    });

	// create the goodbye world lambda
    this.goodbyeWorld = new aws_lambda.Function(this, 'Goodbye', {
      runtime: aws_lambda.Runtime.PYTHON_3_10,
      handler: 'goodbyeworld.lambda_handler',
      code: aws_lambda.Code.fromAsset(path.join(__dirname, './lambda' )),
      timeout: core.Duration.seconds(15),
      role: goodbyeRole,
    });

  // create an ec2instance which will be where we can consume the lattive service from
    this.ec2instance = new ec2.Instance(this, 'demoEC2instance', {
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.MICRO),
      vpc: this.vpc1,
      allowAllOutbound: true,
      ssmSessionPermissions: true,
      requireImdsv2: true,
    })

    this.ec2instance.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['vpc-lattice-svcs:Invoke'],
      resources: ["*"],
    }));
  }
}