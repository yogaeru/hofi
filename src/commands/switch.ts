import { logger } from "#/utils/logger";
import { createFile } from "#/utils/create";
import { getHomeDirectory } from "#/utils/path";
import { type MimeApps, serializeMimeApps } from "#/utils/mimeapps";

import { runScan } from "#/core/detect";
import { createSymlink } from "#/core/symlink";

import type { Config } from "#/lib/schema";

import { dryRunPacman, installPacmanPackages } from "#/backend/pacman";

import { validateCommand } from "./validate";

export async function switchCommand(
  dir?: string,
  options?: { dryRun?: boolean },
) {
  logger.info(`Switching to new hofi configuration`);

  const HOME_PATH = await getHomeDirectory();

  if (options?.dryRun) {
    logger.info(`Dry run: not switching to new configuration`);
  }

  // Detect System Environment
  const envSystem = await runScan();

  if (!envSystem) {
    logger.error(`No environment system detected`);
    return;
  }

  if (!envSystem.pacman) {
    logger.error(`No pacman detected, Aborting.`);
    process.exit(1);
  }

  // Parse Config and Validate
  const parsedConfig: Config | undefined = await validateCommand();

  if (!parsedConfig) {
    logger.error("Error parse config. Aborting process");
    process.exit(1);
  }

  // Destructure config fields
  const { packages, mkSymlink, defaults } = parsedConfig;

  if (mkSymlink) {
    try {
      await Promise.all(
        Object.entries(mkSymlink).map(async ([target, symlink]) => {
          await createSymlink(target, symlink);
        }),
      );
      logger.info("Succes created Symlinks");
    } catch (e) {
      logger.error(String(e));
    }
  }

  if (defaults) {
    const { apps, mime } = defaults;
    let resultMimeApps: MimeApps = {} as MimeApps;

    if (apps) {
    }

    if (mime) {
      const { defaultApplications, addedAssociations } = mime;

      if (defaultApplications)
        resultMimeApps = { ...resultMimeApps, defaultApplications };

      if (addedAssociations)
        resultMimeApps = { ...resultMimeApps, addedAssociations };
    }

    const serializedResultMimeApps = serializeMimeApps(resultMimeApps);

    console.log(`[INFO] Result: `, serializedResultMimeApps);
    await createFile(
      serializedResultMimeApps,
      `${HOME_PATH}/.config/mimeapps2.list`,
    );
  }

  if (packages) {
    const { pacman, aur } = packages;

    if (options?.dryRun) {
      console.log(pacman);
      try {
        const dryRunResult = await dryRunPacman(new Set(pacman));
        logger.info(`Dry run: ${dryRunResult ? "success" : "failed"}`);
      } catch (e) {
        logger.error(`Dry run failed, Aborting.`);
        logger.error(String(e));
        process.exit(1);
      }
    }

    try {
      await installPacmanPackages(new Set(pacman));
    } catch (e) {
      logger.error(`Failed to install packages: ${String(e)}`);
      process.exit(1);
    }
  }
}
