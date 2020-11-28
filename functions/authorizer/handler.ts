import { AppSyncResolverHandler } from "aws-lambda";

const handler: AppSyncResolverHandler<
  { id: string },
  { content: string; id: string }
> = async event => {
  if (event.arguments.id === "1") throw new Error("Unauthorized");

  return { content: "Wojtek from lambda", id: Math.random().toString() };
};

export { handler };
