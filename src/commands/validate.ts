import { abort } from "#/utils/abort";
import { logger } from "#/utils/logger";
import { parseConfigTOML } from "#/core/config/parser";
import { resolvePath, getConfigPath } from "#/utils/path";
import {
  validateSymlink,
  validateMountDisk,
  validatePackages,
} from "#/utils/validation";
import { getHofiEnvObject } from "#/core/env";
import { ConfigSchema, type Config } from "#/core/config/schema";

/**
 * Validates the configuration file at the given path, or the default path if none is provided.
 * @param path - The path to the configuration file.
 * @throws {Error} If validation fails.
 * @returns The parsed configuration object if validation succeeds.
 */
export async function validateCommand(
  path?: string,
): Promise<Config | undefined> {
  try {
    const resolvedPath: string = path ? resolvePath(path) : process.cwd();
    const configPath: string = await getConfigPath(resolvedPath);

    if (!path) {
      logger.warn(
        `No path provided, using current working directory: ${resolvedPath}`,
      );
    }
    logger.info(`Validating configuration file (${configPath})`);
    logger.info("Parsing configuration file...  " + configPath);
    const configTOML = await parseConfigTOML(configPath);
    const result: Config = ConfigSchema.parse(configTOML);

    const { mounts, packages, symlinks } = result;

    const { helperAur, isFlatpak } = getHofiEnvObject();

    const validationTasks = [
      validateSymlink(symlinks),
      validateMountDisk(mounts),
      validatePackages(packages?.aur, helperAur),
      validatePackages(packages?.pacman, "pacman"),
      ...(isFlatpak
        ? [
            validatePackages(packages?.flatpak?.user, "flatpak"),
            validatePackages(packages?.flatpak?.system, "flatpak"),
          ]
        : []),
    ];
    
    await Promise.all(validationTasks);

    logger.success("Validation successful, no errors found");
    return result;
  } catch (error) {
    console.error(error);
    abort(error);
  }
}
