import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as vpclattice from 'aws-vpclattice-prealpha';
import { SupportResources } from './support';
import { aws_iam as iam } from 'aws-cdk-lib';


export class VpclatticealphaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    const support = new SupportResources(this, 'SupportResources');
    
    // create a vpc lattice service, and associate it with the service network
    // the listener use defaults of HTTPS, on port 443, and have a default action of 404 NOT FOUND
    const myLatticeService = new vpclattice.Service(this, 'myLatticeService', {
      // we will all unauthenticated requests to be used
      allowUnauthenticatedAccess: true,
    });

    myLatticeService.node.addDependency(support.vpc1);
    myLatticeService.node.addDependency(support.vpc2);
    
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
      allowedPrincipals: [new iam.StarPrincipal()],
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
    });

    // create a latticeServiceNetwork using the default settings for a Service network;
    // - Requires an IAM policy, do not allow access outside this org,
    // Overide the default option to allow unauthenticated/signed requests 
    // associate the vpcs
    // assocaite the services with the servicenetwork
    const serviceNetwork = new vpclattice.ServiceNetwork(this, 'ServiceNetwork', {
      allowUnauthenticatedAccess: true,
      vpcs: [
        support.vpc1,
        support.vpc2,
        support.vpc3,
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
