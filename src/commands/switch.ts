import { logger } from "#/utils/logger";
import { createFile } from "#/utils/create";
import {
  resolvePath,
  getHomeDirectory,
  createBackupConfig,
  exists,
  getConfigPath,
} from "#/utils/path";
import {
  type MimeApps,
  type DefaultMimeApp,
  serializeMimeApps,
  resolveDefaultMimeApp,
} from "#/utils/mimeapps";

import { runScan } from "#/core/detect";
import { mountDisk } from "#/core/mount";
import { mkSymlinkConfig } from "#/core/symlink";

import {
  dryRunPacman,
  installPacmanPackages,
  removePacmanPackages,
} from "#/backend/pacman";
import {
  dryRunAurPackages,
  installAurPackages,
  removeAurPackages,
} from "#/backend/aur";

import { validateCommand } from "./validate";
import type { Config } from "#/lib/schema";

type SwitchSymlink = Config["mkSymlink"];
type SwitchMountDrive = Config["diskMount"];
type SwitchDefaultApp = Config["defaults"];
type SwitchPackage = Config["packages"];

type SwitchOptions = {
  dryRun?: boolean;
};

/**
 * Applies the current configuration to the system.
 *
 * @param dir Directory to switch to.
 * @param options Switch command options.
 * @returns A promise that resolves when the switch is complete.
 */
export async function switchCommand(
  dir?: string,
  options?: SwitchOptions,
): Promise<void> {
  const resolvedDir: string = dir ? await resolvePath(dir) : process.cwd();
  const configPath: string = await getConfigPath(resolvedDir);
  const HOME_PATH: string = await getHomeDirectory();

  if (!dir) {
    logger.warn(
      `No directory specified, using current working directory (${resolvedDir})`,
    );
    // return;
  }
  logger.info(`Switching to new hofi configuration (${configPath})`);

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
  const parsedConfig: Config | undefined = await validateCommand(resolvedDir);

  if (!parsedConfig) {
    logger.error("Error parse config. Aborting process");
    process.exit(1);
  }

  // Destructure config fields
  const { packages, mkSymlink, defaults, diskMount } = parsedConfig;
  await Promise.all([
    switchSymlink(mkSymlink),
    switchMountDrive(diskMount),
    switchDefaultApp(defaults, HOME_PATH),
  ]);

  await switchPackage(packages, options);
}

////////////////////////////////
///  HELPER FUNCTION SWITCH  ///
///////////////////////////////

/**
 * Applies symlink configuration.
 *
 * @param config Symlink target mapping.
 */
async function switchSymlink(config: SwitchSymlink) {
  if (!config) return;
  try {
    await mkSymlinkConfig(config);
    logger.success("Succes created Symlinks");
  } catch (e) {
    throw new Error(`Failed to switch symlink: ${String(e)}`);
  }
}

/**
 * Applies mount drive configuration.
 *
 * @param config Mount point mapping.
 */
async function switchMountDrive(config: SwitchMountDrive) {
  if (!config) return;
  try {
    await mountDisk(config);
    logger.info("Successfully mounted disk");
  } catch (e) {
    throw new Error(`Failed to mount disk: ${String(e)}`);
  }
}

/**
 * Applies default application configuration.
 *
 * @param config Default app configuration.
 * @param homePath Home directory path.
 */
async function switchDefaultApp(config: SwitchDefaultApp, homePath: string) {
  if (!config) return;

  const { apps, mime } = config;

  const configPath = `${homePath}/.config/mimeapps2.list`;
  const isConfigExists: boolean = await exists(configPath);

  if (isConfigExists) {
    const backupPath: string = await createBackupConfig(configPath);
    if (backupPath) logger.info(`Backup created: ${backupPath}`);
  }

  const defaultApps: DefaultMimeApp = apps
    ? await resolveDefaultMimeApp(apps)
    : {};

  const resultMimeApps: MimeApps = {
    defaultApplications: {
      ...(mime?.defaultApplications ?? {}),
      ...defaultApps,
    },
    addedAssociations: {
      ...(mime?.addedAssociations ?? {}),
    },
  };

  const serializedResultMimeApps: string = serializeMimeApps(resultMimeApps);
  await createFile(
    serializedResultMimeApps,
    `${homePath}/.config/mimeapps2.list`,
  );
}

/**
 * Applies package configuration.
 *
 * @param config Package configuration.
 * @param options Switch command options.
 */
async function switchPackage(config: SwitchPackage, options?: SwitchOptions) {
  if (!config) return;

  const { dryRun } = options ?? {};

  const {
    pacman: pacmanPackages,
    aur: aurPackages,
    flatpak: flatpakPackages,
  } = config;

  if (dryRun) {
    try {
      if (aurPackages) await dryRunAurPackages(new Set(aurPackages));
      await dryRunPacman(new Set(pacmanPackages));
      logger.info("Dry run: success");
      return;
    } catch (e) {
      throw new Error(`Dry run failed: ${String(e)}`);
    }
  }

  try {
    await installPacmanPackages(new Set(pacmanPackages));
    await installAurPackages(new Set(aurPackages));
  } catch (e) {
    throw new Error(`Failed to install packages: ${String(e)}`);
  }
}
