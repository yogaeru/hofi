import { logger } from "#/utils/logger";
import { writeFile } from "#/utils/write";
import { abortIfRunWithSudo } from "#/utils/abort";
import {
  configPackagesTemplate,
  configMimeAppsTemplate,
} from "#/core/config/template";

/**
 * Command to initialize a project with a basic template based on system
 */
export async function initCommnad() {
  abortIfRunWithSudo();
  logger.info("Creating Project With Template");

  const [config, mimeAppsConfig] = await Promise.all([
    configPackagesTemplate(),
    configMimeAppsTemplate(),
  ]);

  await Promise.all([
    writeFile(config, "hofi/config.toml"),
    writeFile(mimeAppsConfig, "hofi/mimeapps.toml"),
  ]);
}
