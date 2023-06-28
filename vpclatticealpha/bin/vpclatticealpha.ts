#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ServiceNetwork } from '../lib/servicenetwork';
import { Consumer } from '../lib/consumer';
import { Provider } from '../lib/provider';
import * as environments from '../lib/environments';

const app = new cdk.App();

// create a service Network in Account S
const serviceNetwork = new ServiceNetwork(app, 'VpclatticealphaStack', {
	env: environments.accountS,
  participantEnvironments: [
    environments.accountA,
    environments.accountB,
    environments.accountX,
    environments.accountY, 
    environments.accountZ,
  ],
});

//create consumers in Account A, and Account B
const consumerA = new Consumer(app, 'ConsumerA', {
  env: environments.accountA,
  name: 'A',
  searchTag: serviceNetwork.serviceNetwork.searchTag as string,
  assumeRoleArn: serviceNetwork.serviceNetwork.discoveryRoleArn as string,
})

const consumerB = new Consumer(app, 'ConsumerB', {
  env: environments.accountB,
  searchTag: serviceNetwork.serviceNetwork.searchTag as string,
  assumeRoleArn: serviceNetwork.serviceNetwork.discoveryRoleArn as string,
  name: 'B',
})

const providerX = new Provider(app, 'ProviderX', {
  name: 'servicex',
  env: environments.accountX,
  searchTag: serviceNetwork.serviceNetwork.searchTag as string,
  assumeRoleArn: serviceNetwork.serviceNetwork.discoveryRoleArn as string,
  // because this is cross account, we have to use named roles. anything that ends up tokenized breaks
  allowedPrincipalsArn: [
    consumerA.consumerRoleArn,
    consumerB.consumerRoleArn
  ],
})

const providerY = new Provider(app, 'ProviderY', {
  name: 'servicey',
  env: environments.accountX,
  searchTag: serviceNetwork.serviceNetwork.searchTag as string,
  assumeRoleArn: serviceNetwork.serviceNetwork.discoveryRoleArn as string,
  allowedPrincipalsArn: [
    consumerA.consumerRoleArn,
  ],
})

const providerZ = new Provider(app, 'ProviderZ', {
  name: 'servicez',
  env: environments.accountZ,
  searchTag: serviceNetwork.serviceNetwork.searchTag as string,
  assumeRoleArn: serviceNetwork.serviceNetwork.discoveryRoleArn as string,
  allowedPrincipalsArn: [
    consumerB.consumerRoleArn,
  ]
})