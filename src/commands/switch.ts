import { $ } from "bun";
import { logger } from "../lib/logger";
import { runDoctor } from "../core/detect";
import {
  getPacmanPackages,
  dryRunPacman,
  installPacmanPackages,
} from "../backend/pacman";

export async function switchCommand(
  dir?: string,
  options?: { dryRun?: boolean },
) {
  logger.info(`Switching to new hofi configuration`);

  if (options?.dryRun) {
    logger.info(`Dry run: not switching to new configuration`);
  }

  const envSystem = await runDoctor();

  if (!envSystem) {
    logger.error(`No environment system detected`);
    return;
  }

  if (!envSystem.pacman) {
    logger.error(`No pacman detected, Aborting.`);
    process.exit(1);
  }

  // Get Installed Packages
  const [pacmanPackages] = await Promise.all([getPacmanPackages()]);

  const installedPackages = {
    pacman: new Set(pacmanPackages),
  };

  
}
