import cac from "cac";

import { logger } from "#/utils/logger";

import { scanCommand } from "#/commands/scan";
import { initCommnad } from "#/commands/init";
import { validateCommand } from "#/commands/validate";
import { switchCommand } from "#/commands/switch";

import {
  getPacmanPackages,
  dryRunPacman,
  installPacmanPackages,
} from "#/backend/pacman";

import { getCurrentDirectory } from "#/utils/path";

const hofiCli = cac("hofi").version("0.1");

hofiCli.command("scan", "Detect system environment").action(async () => {
  await scanCommand();
  const packages = await getPacmanPackages();
  logger.info("Pacman packages:");
  console.log(packages.join("\n"));
});

//-------------------- Init ----------------------
//
hofiCli
  .command("init", "Initialize a new hofi project with a template")
  .action(async () => {
    await initCommnad();
  });

hofiCli
  .command("validate", "Validate the hofi project configuration")
  .action(async () => {
    await validateCommand();
  });

// ---------------- SWITCH ----------------------
//
hofiCli
  .command("switch [dir]", "Switch to a different hofi project")
  .option("--dry-run", "Run the switch command without making any changes")
  .action(async (dir?: string, options?: { dryRun?: boolean }) => {
    if (!dir) {
      logger.error("No directory specified");
      process.exit(1);
    }
    const cwd = await getCurrentDirectory();
    // logger.info(`Current directory: ${cwd}`);
    // console.log(dir, options)
    await switchCommand(dir, options);
  });

hofiCli.help();

try {
  hofiCli.parse();
} catch (error) {
  logger.error(String(error));
}
