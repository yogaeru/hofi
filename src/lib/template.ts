import { getPacmanPackages } from "#/backend/pacman";
import { getAurPackages } from "#/backend/aur";
import { parseMimeApps } from "#/utils/mimeapps";
import { getHomeDirectory } from "#/utils/path";

/**
 * Generates the packages configuration template based on the user's installed packages.
 * @returns The packages configuration template as a string.
 */
export const configPackagesTemplate = async () => {
  const [pacmanPackagesInstalled, aurPackagesInstalled] = await Promise.all([
    getPacmanPackages(),
    getAurPackages(),
  ]);
  const CONFIG_TOML_PACKAGES_TEMPLATE = `
[packages]
pacman = [
  ${pacmanPackagesInstalled.map((p) => `"${p}"`).join(",\n  ")}
]

aur = [
  ${aurPackagesInstalled.map((p) => `"${p}"`).join(",\n  ")}
]
`;
  return CONFIG_TOML_PACKAGES_TEMPLATE;
};

export const configDefaultAppsTemplate = (browser: string) => {
  const CONFIG_TOML_DEFAULT_APPS_TEMPLATE = `
[default.apps]
browser = "${browser}"
`;
  return CONFIG_TOML_DEFAULT_APPS_TEMPLATE;
};

/**
 * Generates the MIME apps configuration template based on the user's MIME apps list.
 * @returns The MIME apps configuration template as a string.
 */
export async function configMimeAppsTemplate() {
  // logger.info(HOME_DIR)
  const homeDir = await getHomeDirectory();
  const mimeAppsList = await parseMimeApps(`${homeDir}/.config/mimeapps.list`);

  const defaultApplicationsConfig = Object.entries(
    mimeAppsList.defaultApplications,
  )
    .map(([key, value]) => `${key}="${value}"`)
    .join("\n");

  const addedAssociationsConfig = Object.entries(mimeAppsList.addedAssociations)
    .map(([key, value]) => `${key}="${value.join(",")}"`)
    .join("\n");

  const CONFIG_TOML_MIME_APPS_TEMPLATE = `
[Default Applications]
${defaultApplicationsConfig}

[Added Associations]
${addedAssociationsConfig}
`;
  return CONFIG_TOML_MIME_APPS_TEMPLATE;
}
