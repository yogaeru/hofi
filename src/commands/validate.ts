import { logger } from "#/utils/logger";
import { parseConfigTOML } from "#/utils/parser";
import { resolvePath, getConfigPath } from "#/utils/path";
import {
  validateSymlink,
  validateMountDisk,
  validatePackages,
} from "#/utils/validation";
import { ConfigSchema, type Config } from "#/lib/schema";

/**
 * Validates the configuration file at the given path, or the default path if none is provided.
 * @param path
 * @throws {Error} If validation fails.
 * @returns The parsed configuration object if validation succeeds.
 */
export async function validateCommand(
  path?: string,
): Promise<Config | undefined> {
  try {
    const resolvedPath: string = path ? await resolvePath(path) : process.cwd();
    const configPath: string = await getConfigPath(resolvedPath);

    if (!path) {
      logger.warn(
        `No path provided, using current working directory: ${resolvedPath}`,
      );
    }
    logger.info(`Validating configuration file (${configPath})`);
    logger.info("Parsing configuration file..." + configPath);
    const configTOML = await parseConfigTOML(configPath);
    const result: Config = ConfigSchema.parse(configTOML);

    const { mkSymlink, diskMount, packages } = result;

    await Promise.all([
      validateSymlink(mkSymlink),
      validateMountDisk(diskMount),
      validatePackages(packages?.pacman, "pacman"),
    ]);

    logger.success("Validation successful, no errors found");
    return result;
  } catch (error) {
    logger.error(error);
  }
}
