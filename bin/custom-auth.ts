#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { CustomAuthStack } from "../lib/custom-auth-stack";

const app = new cdk.App();
new CustomAuthStack(app, "CustomAuth", {
  env: { region: "eu-central-1" }
});
