import { logger } from "#/utils/logger";
import { writeFile } from "#/utils/write";
import { abortIfRunWithSudo } from "#/utils/abort";
import {
  configPackagesTemplate,
  configMimeAppsTemplate,
} from "#/core/config/template";
import { runScan } from "#/core/detect";
import { writeMetadata } from "#/core/metadata";
import type { Config } from "#/core/config/schema";
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

  const configPackages: Config = Bun.TOML.parse(config);
  const mimeAppsPackages = Bun.TOML.parse(mimeAppsConfig);
  delete configPackages?.includes;
  const metadata = {
    ...configPackages,
    ...mimeAppsPackages,
  };

  const env = await runScan();

  await Promise.all([
    writeFile(config, "hofi/config.toml"),
    writeFile(mimeAppsConfig, "hofii/mimeapps.toml"),
    writeMetadata(metadata, env, "hofii/hofi-lock.json"),
  ]);
}
