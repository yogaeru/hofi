import { logger } from "#/utils/logger";
import { abort } from "#/utils/abort";
import { printDiffTable } from "#/utils/flatten";
import {
  exists,
  resolvePath,
  getConfigPath,
  getHomeDirectory,
} from "#/utils/path";
import { type ConfigDiff, diffConfigWithMetadata } from "#/utils/diff";

import { switchSymlink } from "./links";
import { switchPackages } from "./packages";
import { validateCommand } from "../validate";
import { switchDefaultApp } from "./defaults";
import { switchMountDrive } from "./mountDrive";

import { runScan } from "#/core/detect";
import type { Config } from "#/core/config/schema";
import { readMetadata, writeMetadata } from "#/core/metadata";

type SwitchOptions = {
  dryRun?: boolean;
};

/**
 * Switch to a new hofi configuration. This function will switch the current
 * configuration to a new one, applying any necessary changes to packages,
 * symlinks, and mounts.
 */
export async function switchCommand(
  dir?: string,
  options?: SwitchOptions,
): Promise<void> {
  const home = getHomeDirectory();
  const resolvedDir = dir ? resolvePath(dir) : process.cwd();
  const configPath = await getConfigPath(resolvedDir);
  const isConfig = await exists(configPath);

  if (!isConfig) abort("Config file not found");
  if (!dir)
    logger.warn(
      `No directory specified, using current working directory (${resolvedDir})`,
    );
  logger.info(`Switching to new hofi configuration (${configPath})`);
  logger.info("New Switch OCnfig");

  const envSystem = await runScan();
  const { config, diff } = await validateConfig(resolvedDir);
  const { packages, mounts, symlinks, defaults } = diff;
  printDiffTable(diff);
  
  if (Object.keys(diff).length === 0) {
    logger.info("No changes to apply");
    return;
  }

  const apply = prompt("Apply The Change ?") || "n";
  if (apply?.toLowerCase() !== "y") return;
  logger.info("Applying change...");

  await switchPackages(packages);
  await Promise.all([
    switchSymlink(symlinks),
    switchMountDrive(mounts),
    switchDefaultApp(defaults, home),
  ]);

  await writeMetadata(config, envSystem, configPath);
}

// Validates the configuration
async function validateConfig(dir: string): Promise<{
  config: Config;
  diff: ConfigDiff;
}> {
  const parsedConfig: Config | undefined = await validateCommand(dir);
  if (!parsedConfig) abort("Error parse config. Aborting process");

  const metadata: Config = await readMetadata(`${dir}/hofi-lock.json`);
  const diff = await diffConfigWithMetadata(parsedConfig, metadata);

  return {
    config: parsedConfig,
    diff,
  };
}
