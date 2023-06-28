import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as vpclattice from 'aws-vpclattice-prealpha';

interface ServiceNetworkProps extends cdk.StackProps {
  participantEnvironments: cdk.Environment[]
}

export class ServiceNetwork extends cdk.Stack {

  public serviceNetwork: vpclattice.ServiceNetwork;

  constructor(scope: Construct, id: string, props: ServiceNetworkProps) {
    super(scope, id, props);
      
    this.serviceNetwork = new vpclattice.ServiceNetwork(this, 'ServiceNetwork', {
      // this mode, will enforce authentication, and only permit access from roles
      // within this accounts organisatoon
      accessmode: vpclattice.ServiceNetworkAccessMode.ORG_ONLY
    });

    this.serviceNetwork.discoveryRoleArn
    this.serviceNetwork.searchTag

    // share the serviceNetwork with the participating accounts. 
    let accountPrincipals: string[] = [];
    props.participantEnvironments.forEach((participant) => {
      accountPrincipals.push(participant.account as string);
    });

    this.serviceNetwork.share(
      { 
        name: 'servicenetworkS',
        accounts: accountPrincipals
      }
    )
    this.serviceNetwork.applyAuthPolicyToServiceNetwork();
  }
}