import { logger } from "#/utils/logger";
import { parseConfigTOML } from "#/utils/parser";
import { ConfigSchema, type Config } from "#/lib/schema";
import {
  validateSymlink,
  validateMountDisk,
  validatePackages,
} from "#/utils/validation";

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
    const configPath = path ?? "hofi/generated/config.toml";
    const configTOML = await parseConfigTOML(configPath);

    const result: Config = ConfigSchema.parse(configTOML);

    const { mkSymlink, diskMount, packages } = result;

    await Promise.all([
      validateSymlink(mkSymlink),
      validateMountDisk(diskMount),
      validatePackages(packages?.pacman, "pacman"),
    ]);

    logger.info("Validation successful, no errors founds");
    return result;
  } catch (error) {
    logger.error(String(error));
    // console.log(error)
  }
}
