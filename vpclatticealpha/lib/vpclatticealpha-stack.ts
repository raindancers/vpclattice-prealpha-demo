import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as vpclattice from 'aws-vpclattice-prealpha';
import { SupportResources } from './support';
import { 
  aws_iam as iam,
  aws_ec2 as ec2, 
} 
  from 'aws-cdk-lib';


export class VpclatticealphaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    const support = new SupportResources(this, 'SupportResources');
    
    // create a vpc lattice service, and associate it with the service network
    // the listener use defaults of HTTPS, on port 443, and have a default action of 404 NOT FOUND
    const myLatticeService = new vpclattice.Service(this, 'myLatticeService', {
      // we will all unauthenticated requests to be used
    });

    // add a listener to the service
    const listener = new vpclattice.Listener(this, 'Listener', {
      service: myLatticeService,
    })

    // add a listenerRule that will use the helloworld lambda as a Target
    listener.addListenerRule({
      name: 'helloworld',
      priority: 10,
      action: [
        {
          targetGroup: new vpclattice.TargetGroup(this, 'hellolambdatargets', {
            name: 'hellowworld',
            target: vpclattice.Target.lambda([
              support.helloWorld,
            ]),
          }),
        },
      ],

      httpMatch: {
        pathMatches: { path: '/hello' },
      },
      // we will only allow access to this service from the ec2 instance
      accessMode: vpclattice.RuleAccessMode.UNAUTHENTICATED
    });

    //add a listenerRule that will use the goodbyeworld lambda as a Target
    listener.addListenerRule({
      name: 'goodbyeworld',
      priority: 20,
      action: [
        {
          targetGroup: new vpclattice.TargetGroup(this, 'goodbyelambdatargets', {
            name: 'goodbyeworld',
            target: vpclattice.Target.lambda([
              support.goodbyeWorld,
            ]),
          }),
        },
      ],
      
      httpMatch: {
        pathMatches: { path: '/goodbye' },
      },
      // we will only allow access to this service from the ec2 instance
      allowedPrincipals: [support.ec2instance.role],
      accessMode: vpclattice.RuleAccessMode.AUTHENTICATED_ONLY,
    });

    //add a listenerRule that will use the goodbyeworld lambda as a Target

    listener.addListenerRule({
      name: 'ListenerRule30',
      priority: 30,
      httpMatch: {
        pathMatches: { path: '/path3' },
        method: vpclattice.HTTPMethods.GET,
      },
      allowedPrincipals: [new iam.AccountPrincipal('123456123456')],
      accessMode: vpclattice.RuleAccessMode.AUTHENTICATED_ONLY,
      action: [
        {
          targetGroup: new vpclattice.TargetGroup(this, 'instanceTargets', {
            name: 'instanceTargets',
            target: vpclattice.Target.ec2instance(
              [
                new ec2.Instance(this, 'Instance1', {
                  instanceType: new ec2.InstanceType('t2.micro'),
                  machineImage: ec2.MachineImage.latestAmazonLinux2022(),
                  vpc: support.vpc1
                }),
              ],
              {
                vpc: support.vpc1,
                protocol: vpclattice.Protocol.HTTP,
                healthcheck: vpclattice.HealthCheck.check({
                  protocol: vpclattice.Protocol.HTTP,
                  healthCheckInterval: cdk.Duration.seconds(60),
                  healthCheckTimeout: cdk.Duration.seconds(10),
                  healthyThresholdCount: 2,
                  protocolVersion: vpclattice.ProtocolVersion.HTTP1,
                  unhealthyThresholdCount: 2,
                  matcher: vpclattice.FixedResponse.OK,
                }),
              },
            ),
          }),
        },
      ],
    });
    
      
    const serviceNetwork = new vpclattice.ServiceNetwork(this, 'ServiceNetwork', {
      accessmode: vpclattice.ServiceNetworkAccessMode.UNAUTHENTICATED,
      vpcs: [
        support.vpc1,
      ],
      services: [
        myLatticeService
      ]
    });

    // after adding rules, apply the auth policy to the service and Service Network
    myLatticeService.applyAuthPolicy();
    serviceNetwork.applyAuthPolicyToServiceNetwork();

  }
}
