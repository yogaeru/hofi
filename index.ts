import cac from "cac";

import { logger } from "./src/lib/logger";
import { doctorCommand } from "./src/commands/doctor";
import { getPacmanPackages } from "./src/backend/pacman";
import { getCurrentDirectory } from "./src/utils/pwd";

const hofiCli = cac("hofi")
  .version("0.1");

hofiCli
  .command("doctor", "Detect system environment")
  .action(async () => {
    await doctorCommand();
    const packages = await getPacmanPackages();
    logger.info("Pacman packages:");
    console.log(packages.join("\n"));
  });


//-------------------- Init ----------------------
hofiCli
  .command("init", "Initialize a new hofi project with a template")
  .action(async () => {
    
  });

// ---------------- SWITCH ----------------------
hofiCli
  .command("switch [dir]", "Switch to a different hofi project")
  .option("--dry-run", "Run the switch command without making any changes")
  .action(async (dir?: string, options?: {dryRun?: boolean}) => {
    const cwd = await getCurrentDirectory();
    logger.info(`Current directory: ${cwd}`);
    console.log(dir, options)
  });


hofiCli.help();

try {
  hofiCli.parse();
} catch (error) {
  logger.error(String(error));
}