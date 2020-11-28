# AWS CDK AppSync pipeline resolvers example

This example shows you how to build pipeline resolvers using lambda, vtl templates, and mixture of those two.

When deployed a simple API is created. There are 2 `Queries` which correspond to lambda pipeline resolver and vtl pipeline resolver.

In the resolvers, I'm checking if the `id` parameter is `"1"`. If it is, I'm returning an error, otherwise I'm returning the data.
