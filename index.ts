#!/usr/bin/env bun

import cac from "cac";
import { logger } from "#/utils/logger";
import { scanCommand } from "#/commands/scan";
import { initCommnad } from "#/commands/init";
import { validateCommand } from "#/commands/validate";
import { switchCommand } from "#/commands/switch/index";

const PKG_VERSION = "0.0.1";
const hofiCli = cac("hofi").version(PKG_VERSION);

// ── Commands ──

hofiCli.command("scan", "Detect system environment").action(scanCommand);

hofiCli
  .command("init", "Initialize a new hofi project with a template")
  .action(initCommnad);

hofiCli
  .command("validate [configPath]", "Validate the hofi project configuration")
  .action(validateCommand);

hofiCli
  .command("switch [dir]", "Switch to a different hofi project")
  .option("--dry-run", "Run the switch command without making any changes")
  .action(async (dir?: string, options?: { dryRun?: boolean }) => {
    await switchCommand(dir, options);
  });

hofiCli.help();

try {
  hofiCli.parse();
} catch (error) {
  logger.error(String(error));
  process.exit(1);
}
