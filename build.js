const esbuild = require("esbuild");
const yargs = require("yargs");
const chalk = require("chalk");
const fg = require("fast-glob");

const target = yargs.usage(`Usage: $0 -t [functions/cdk]`).option("t", {
  alias: "target",
  describe: "Target to build",
  demandOption: "Target is required",
  type: "string",
  nargs: 1
}).argv;

async function buildCDK() {
  console.log(chalk.green("Building CDK"));

  const files = await fg(["./lib/**/*.ts", "./bin/**/*.ts"]);
  try {
    await esbuild.build({
      entryPoints: files,
      bundle: false,
      color: false,
      minify: false,
      outdir: "dist",
      target: "node12",
      format: "cjs",
      platform: "node"
    });
    console.log(chalk.green("Build complete"));
  } catch (e) {
    console.log(chalk.red("Failed to build", e.message));
  }
}

async function buildFunctions() {
  console.log(chalk.green("Building functions"));
  const files = await fg([
    "./functions/**/*.{ts, js}",
    "!./functions/**/*.test.ts",
    "!./functions/**/*.d.ts"
  ]);
  try {
    await esbuild.build({
      entryPoints: files,
      bundle: true,
      color: false,
      minify: true,
      outdir: "dist/functions",
      target: "node12",
      platform: "node",
      format: "cjs"
    });
    console.log(chalk.green("Build complete"));
  } catch (e) {
    console.log(chalk.red("Failed to build", e.message));
  }
}

async function build() {
  if (target.t == "cdk") {
    return await buildCDK();
  }

  if (target.t == "functions") {
    return await buildFunctions();
  }

  throw new Error("Unknown target.");
}

build();
