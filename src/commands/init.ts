import { logger } from "#/utils/logger";
import { createFileConfig } from "#/utils/create";
import { configPackagesTemplate, configMimeAppsTemplate } from "#/lib/template";

export async function initCommnad() {
  logger.info("Creating Project With Template");

  const config = await configPackagesTemplate();
  // console.log(config)

  const mimeAppsConfig = await configMimeAppsTemplate();
  // console.log(mimeAppsConfig)

  await Promise.all([
    createFileConfig(config, `hofi/generated/config.toml`),
    createFileConfig(mimeAppsConfig, `hofi/generated/mimeapps.toml`),
  ]);
}
