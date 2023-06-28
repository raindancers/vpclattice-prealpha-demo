import * as cdk from 'aws-cdk-lib';

// define environments

const deploymentRegion = 'us-west-2';

export const accountA: cdk.Environment = {
	account: '111111111111',
	region: deploymentRegion,
};

export const accountB: cdk.Environment = {
	account: '211111111111',
	region: deploymentRegion,
};

export const accountS: cdk.Environment = {
	account: '411111111111',
	region: deploymentRegion,
};

export const accountX: cdk.Environment = {
	account: '511111111111',
	region: deploymentRegion,
};

export const accountY: cdk.Environment = {
	account: '611111111111',
	region: deploymentRegion,
};

export const accountZ: cdk.Environment = {
	account: '711111111111',
	region: deploymentRegion,
};