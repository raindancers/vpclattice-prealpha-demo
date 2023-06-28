import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';
import * as vpclattice from 'aws-vpclattice-prealpha';
import { 
  aws_ec2 as ec2, 
  aws_logs as logs,
  aws_lambda
} 
  from 'aws-cdk-lib';


interface ProviderProps extends cdk.StackProps {
  name: string;
  allowedPrincipalsArn: string[];
  searchTag: string;
  assumeRoleArn: string;
}


export class Provider extends cdk.Stack {

  // the created ec2Instance
  public ec2instance: ec2.Instance
  // the created Vpc
  public vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: ProviderProps) {
    super(scope, id, props);

    // create the hello world lambda
    const helloWorld = new aws_lambda.Function(this, 'Helloworld', {
      runtime: aws_lambda.Runtime.PYTHON_3_10,
      handler: 'helloworld.lambda_handler',
      code: aws_lambda.Code.fromAsset(path.join(__dirname, './lambda' )),
      timeout: cdk.Duration.seconds(15),
      logRetention: logs.RetentionDays.FIVE_DAYS,
      environment: {
        NAME: props.name
      },
    });

    const latticeService = new vpclattice.Service(this, `service${props.name}`,{
      name: props.name,
    });

    const listener = new vpclattice.Listener(this, 'Listener', {
      service: latticeService
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
              helloWorld,
            ]),
          }),
        },
      ],

      httpMatch: {
        pathMatches: { path: '/hello' },
      },
      // we will only allow access to this service from the ec2 instance
      accessMode: vpclattice.RuleAccessMode.AUTHENTICATED_ONLY,
      allowedPrincipalArn: props.allowedPrincipalsArn,
    });

     // import the serviceNetwork, which has been shared and associate the vpc with it.
    const serviceNetwork = vpclattice.ServiceNetwork.fromId(this, 'importedservicenetwork', {
      searchTag: props.searchTag,
      assumeRoleArn: props.assumeRoleArn,
    });


    latticeService.associateWithServiceNetwork(serviceNetwork)

  }
}