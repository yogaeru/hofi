import { abort } from "#/utils/abort";
import { writeFile } from "#/utils/write";
import {
  diffInstalledAurPackages,
  diffInstalledFlatpakSystemPackages,
  diffInstalledFlatpakUserPackages,
  diffInstalledPacmanPackages,
  printDiffResult,
  type DiffResult,
} from "#/utils/diff";
import { logger } from "#/utils/logger";
import {
  createBackupConfig,
  exists,
  getConfigPath,
  getHomeDirectory,
  resolvePath,
} from "#/utils/path";

import { runScan } from "#/core/detect";
import {
  resolveDefaultMimeApp,
  serializeMimeApps,
  type MimeApps,
} from "#/core/mimeapps";
import { mountDisk } from "#/core/mount";
import { mkSymlinkConfig } from "#/core/symlink";

import {
  dryRunAurPackages,
  installAurPackages,
  removeAurPackages,
} from "#/backend/aur";
import {
  installSystemFlatpakPackages,
  installUserFlatpakPackages,
  removeSystemFlatpakPackages,
  removeUserFlatpakPackages,
} from "#/backend/flatpak";
import {
  dryRunPacman,
  installPacmanPackages,
  removePacmanPackages,
} from "#/backend/pacman";

import { validateCommand } from "./validate";

import type { Config } from "#/core/config/schema";

type SwitchSymlink = Config["mkSymlink"];
type SwitchMountDrive = Config["mountDrive"];
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
  const resolvedDir = dir ? await resolvePath(dir) : process.cwd();
  const configPath = await getConfigPath(resolvedDir);
  const HOME_PATH = await getHomeDirectory();
  const isConfig = await exists(configPath);

  if (!dir) {
    logger.warn(
      `No directory specified, using current working directory (${resolvedDir})`,
    );
  }

  if (!isConfig) {
    abort("Config file not found");
  }

  logger.info(`Switching to new hofi configuration (${configPath})`);

  if (options?.dryRun) {
    logger.info(`Dry run: not switching to new configuration`);
    return;
  }

  // Detect System Environment
  const envSystem = await runScan();

  if (!envSystem) {
    logger.error(`No environment system detected`);
    return;
  }

  if (!envSystem.pacman) {
    abort("No pacman detected, Aborting.");
  }

  // Parse Config and Validate
  const parsedConfig: Config | undefined = await validateCommand(resolvedDir);

  if (!parsedConfig) {
    abort("Error parse config. Aborting process");
  }

  // Destructure config fields
  const { packages, mkSymlink, defaults, mountDrive } = parsedConfig;

  await Promise.all([
    switchSymlink(mkSymlink),
    switchMountDrive(mountDrive),
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

  const defaultApps = apps
    ? ((await resolveDefaultMimeApp(apps, "object")) as Record<string, string>)
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
  await writeFile(
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

  const { pacman = [], aur = [], flatpak } = config;
  const pacmanPackages = new Set(pacman);
  const aurPackages = new Set(aur);

  if (dryRun) {
    try {
      if (aurPackages.size > 0) await dryRunAurPackages(aurPackages);
      await dryRunPacman(pacmanPackages);
      logger.info("Dry run: success");
      return;
    } catch (e) {
      throw new Error(`Dry run failed: ${String(e)}`);
    }
  }

  try {
    const pacmanResult = await switchPacman(new Set(pacmanPackages));
    const aurResult = await switchAur(new Set(aurPackages));
    const flatpakResult = await switchFlatpak(flatpak);
    if (pacmanResult) printDiffResult(pacmanResult, "pacman");
    if (aurResult) printDiffResult(aurResult, "aur");
    if (flatpakResult) {
      printDiffResult(flatpakResult.user, "flatpak (user)");
      printDiffResult(flatpakResult.system, "flatpak (system)");
    }
  } catch (e) {
    throw new Error(`Failed to install packages: ${e}`);
  }
}

// Switch pacman packages.
async function switchPacman(
  pacmanPackages: Set<string>,
): Promise<DiffResult | undefined> {
  if (!pacmanPackages.size) return;
  const { added, removed } = await diffInstalledPacmanPackages(pacmanPackages);
  await installPacmanPackages(added);
  await removePacmanPackages(removed);
  return { added, removed };
}

// Switch AUR packages.
async function switchAur(
  aurPackages: Set<string>,
): Promise<DiffResult | undefined> {
  if (!aurPackages.size) return;
  const { added, removed } = await diffInstalledAurPackages(aurPackages);
  await installAurPackages(added);
  await removeAurPackages(removed);
  return { added, removed };
}

// Switch Flatpak packages.
async function switchFlatpak(
  config: { user?: string[]; system?: string[] } | undefined,
): Promise<{ user: DiffResult; system: DiffResult } | undefined> {
  if (!config) return;

  const { user = [], system = [] } = config;

  const userResult = await diffInstalledFlatpakUserPackages(new Set(user));
  await installUserFlatpakPackages(userResult.added);
  await removeUserFlatpakPackages(userResult.removed);

  const systemResult = await diffInstalledFlatpakSystemPackages(
    new Set(system),
  );
  await installSystemFlatpakPackages(systemResult.added);
  await removeSystemFlatpakPackages(systemResult.removed);

  return { user: userResult, system: systemResult };
}
