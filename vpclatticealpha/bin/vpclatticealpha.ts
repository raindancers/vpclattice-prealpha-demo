#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { VpclatticealphaStack } from '../lib/vpclatticealpha-stack';

const app = new cdk.App();
new VpclatticealphaStack(app, 'VpclatticealphaStack', {});