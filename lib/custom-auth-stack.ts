import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigwv2 from "@aws-cdk/aws-apigatewayv2";
import {
  getFunctionPath,
  getMappingTemplatePath,
  getRootPath
} from "./utils/utils";
import * as appsync from "@aws-cdk/aws-appsync";

export class CustomAuthStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const appsyncAPI = new appsync.GraphqlApi(this, "customAuthAPI", {
      name: "customAuthAPI",
      schema: appsync.Schema.fromAsset(getRootPath("./schema.graphql")),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY
        }
      }
    });

    const lambdaParamsAuthorizer = new lambda.Function(
      this,
      "customParamsAuthorizerLambda",
      {
        code: lambda.Code.fromAsset(getFunctionPath("authorizer")),
        runtime: lambda.Runtime.NODEJS_12_X,
        handler: "handler.handler"
      }
    );

    const lambdaDataSource = new appsync.LambdaDataSource(
      this,
      "lambdaDataSource",
      {
        api: appsyncAPI,
        lambdaFunction: lambdaParamsAuthorizer
      }
    );

    const lambdaResolverFunctionConfig = new appsync.CfnFunctionConfiguration(
      this,
      "lambdaResolverFunctionConfig",
      {
        apiId: appsyncAPI.apiId,
        dataSourceName: lambdaDataSource.name,
        functionVersion: "2018-05-29",
        name: "lambdaCheckId",
        // Needed for error
        responseMappingTemplate: appsync.MappingTemplate.fromFile(
          getMappingTemplatePath("Query.post.lambda.response.vtl")
        ).renderTemplate()
      }
    );

    lambdaResolverFunctionConfig.addDependsOn(lambdaDataSource.ds);
    appsyncAPI.addSchemaDependency(lambdaResolverFunctionConfig);

    new appsync.Resolver(this, "customAuthLambdaPipelineResolver", {
      api: appsyncAPI,
      typeName: "Query",
      fieldName: "lambdaPipelinePost",
      pipelineConfig: [lambdaResolverFunctionConfig.attrFunctionId],
      requestMappingTemplate: appsync.MappingTemplate.fromFile(
        getMappingTemplatePath("Query.post.before.request.vtl")
      ),
      responseMappingTemplate: appsync.MappingTemplate.fromFile(
        getMappingTemplatePath("Query.post.after.request.vtl")
      )
    });

    const noneDataSource = new appsync.NoneDataSource(this, "noneDataSource", {
      api: appsyncAPI,
      description: "NoneDataSource just to attach some resolvers"
    });

    const vtlResolverFunctionConfig = new appsync.CfnFunctionConfiguration(
      this,
      "vtlResolverFunctionConfig",
      {
        apiId: appsyncAPI.apiId,
        dataSourceName: noneDataSource.name,
        functionVersion: "2018-05-29",
        name: "lambdaCheckId",
        requestMappingTemplate: appsync.MappingTemplate.fromFile(
          getMappingTemplatePath("Query.post.validate.request.vtl")
        ).renderTemplate(),
        responseMappingTemplate: appsync.MappingTemplate.fromFile(
          getMappingTemplatePath("Query.post.validate.response.vtl")
        ).renderTemplate()
      }
    );

    new appsync.Resolver(this, "customAuthVtlPipelineResolver", {
      api: appsyncAPI,
      typeName: "Query",
      fieldName: "vtlPipelinePost",
      pipelineConfig: [vtlResolverFunctionConfig.attrFunctionId],
      requestMappingTemplate: appsync.MappingTemplate.fromFile(
        getMappingTemplatePath("Query.post.before.request.vtl")
      ),
      responseMappingTemplate: appsync.MappingTemplate.fromFile(
        getMappingTemplatePath("Query.post.after.request.vtl")
      )
    });

    lambdaResolverFunctionConfig.addDependsOn(noneDataSource.ds);
    appsyncAPI.addSchemaDependency(vtlResolverFunctionConfig);

    new cdk.CfnOutput(this, "appSyncApiKey", {
      value: appsyncAPI.apiKey ?? "NO_API_KEY"
    });
  }
}
