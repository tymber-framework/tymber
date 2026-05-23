import * as p from "@clack/prompts";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { compileTemplate } from "./utils/template.js";

import nodeTsconfigTemplate from "../templates/tsconfig.json.node.tpl";
import bunTsconfigTemplate from "../templates/tsconfig.json.bun.tpl";
import moduleTemplate from "../templates/src/module.ts.tpl";
import nodeEntrypointTemplate from "../templates/src/entrypoint.ts.node.tpl";
import bunEntrypointTemplate from "../templates/src/entrypoint.ts.bun.tpl";
import helloWorldTemplate from "../templates/src/endpoints/HelloWorld.ts.tpl";
import setupTestTemplate from "../templates/test/setup.ts.tpl";
import helloWorldTestTemplate from "../templates/test/endpoints/HelloWorld.test.ts.tpl";

const packageManager = (() => {
  const userAgent = process.env.npm_config_user_agent ?? "";

  if (userAgent.startsWith("bun/")) return "bun";
  if (userAgent.startsWith("pnpm/")) return "pnpm";
  if (userAgent.startsWith("yarn/")) return "yarn";
  return "npm";
})();

const isBunPackageManager = packageManager === "bun";

async function main() {
  p.intro("Welcome to Tymber project generator!");

  const { projectName, db, modules } = await p.group(
    {
      projectName: () =>
        p.text({
          message: "Project name",
          placeholder: "tymber-app",
          initialValue: "tymber-app",
        }),
      db: () =>
        p.select({
          message: "Database to use",
          options: [
            { value: "postgres", label: "PostgreSQL" },
            { value: "sqlite", label: "SQLite" },
          ],
        }),
      modules: () =>
        p.multiselect({
          message: "Modules to include",
          options: [
            { value: "admin", label: "Admin dashboard" },
            { value: "config", label: "Configuration management" },
            { value: "openapi", label: "OpenAPI console" },
            { value: "user", label: "User Management" },
          ],
          required: false,
        }),
    },
    {
      onCancel: () => {
        p.cancel("Operation cancelled.");
        process.exit(0);
      },
    },
  );

  const projectDir = path.resolve(projectName);
  await fs.mkdir(projectDir, { recursive: true });

  const s = p.spinner();
  s.start(`Creating project in ${projectDir}...`);

  const templateData = {
    projectName,
    isBunPackageManager,
    db,
    modules,
  };

  const dependencies: Record<string, string> = {
    "@tymber/core": "latest",
    [`@tymber/${db}`]: "latest",
  };

  for (const module of modules) {
    dependencies[`@tymber/${module}`] = "latest";
  }

  const packageJsonContent = {
    name: projectName,
    version: "0.0.0",
    type: "module",
    scripts: isBunPackageManager
      ? {
          start: "bun src/entrypoint.ts",
          test: "bun test",
        }
      : {
          start: "tsx src/entrypoint.ts",
          test: "tsx --test test/**/*.test.ts",
        },
    dependencies,
    devDependencies: isBunPackageManager
      ? {
          "@types/bun": "latest",
          typescript: "latest",
        }
      : {
          "@tsconfig/node24": "latest",
          "@types/node": "latest",
          tsx: "latest",
          typescript: "latest",
        },
  };

  // package.json
  await fs.writeFile(
    path.join(projectDir, "package.json"),
    JSON.stringify(packageJsonContent, null, 2),
  );

  // tsconfig.json
  await fs.writeFile(
    path.join(projectDir, "tsconfig.json"),
    compileTemplate(
      isBunPackageManager ? bunTsconfigTemplate : nodeTsconfigTemplate,
    )(templateData),
  );

  // src directory
  const srcDir = path.join(projectDir, "src");
  await fs.mkdir(srcDir, { recursive: true });

  // src/entrypoint.ts
  await fs.writeFile(
    path.join(srcDir, "entrypoint.ts"),
    compileTemplate(
      isBunPackageManager ? bunEntrypointTemplate : nodeEntrypointTemplate,
    )(templateData),
  );

  // src/module.ts
  await fs.writeFile(
    path.join(srcDir, "module.ts"),
    compileTemplate(moduleTemplate)(templateData),
  );

  // src/endpoints/HelloWorld.ts
  const endpointsDir = path.join(srcDir, "endpoints");
  await fs.mkdir(endpointsDir, { recursive: true });
  await fs.writeFile(
    path.join(endpointsDir, "HelloWorld.ts"),
    compileTemplate(helloWorldTemplate)(templateData),
  );

  // tests
  const testDir = path.join(projectDir, "test");
  await fs.mkdir(path.join(testDir, "endpoints"), { recursive: true });
  await fs.writeFile(
    path.join(testDir, "setup.ts"),
    compileTemplate(setupTestTemplate)(templateData),
  );
  await fs.writeFile(
    path.join(testDir, "endpoints", "HelloWorld.test.ts"),
    compileTemplate(helloWorldTestTemplate)(templateData),
  );

  // assets
  const assetSubDirs = ["migrations", "static", "templates", "i18n"];
  for (const subDir of assetSubDirs) {
    const dirPath = path.join(projectDir, "assets", subDir);
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(path.join(dirPath, ".gitkeep"), "");
  }

  s.stop("Project created successfully!");

  p.note(
    `Next steps:
  cd ${projectName}
  ${packageManager} install
  ${packageManager} start`,
    "Done!",
  );

  p.outro("Happy coding!");
}

main().catch((err) => {
  p.log.error(`Error creating project: ${err.message}`);
  process.exit(1);
});
