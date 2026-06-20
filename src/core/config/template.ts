import { getPacmanPackages } from "#/backend/pacman";
import { getAurPackages } from "#/backend/aur";
import { parseMimeApps } from "#/core/mimeapps";
import { getHomeDirectory } from "#/utils/path";
import { type MountDiskOptions } from "#/core/mount";

/**
 * Generates the packages configuration template based on the user's installed packages.
 * @returns The packages configuration template as a string.
 */
export async function configPackagesTemplate(): Promise<string> {
  const [pacmanPkgs, aurPkgs] = await Promise.all([
    getPacmanPackages(),
    getAurPackages(),
  ]);

  const pacmanList = pacmanPkgs.map((pkg) => `  "${pkg}"`).join(",\n");
  const aurList = aurPkgs.map((pkg) => `  "${pkg}"`).join(",\n");

  return [
    "[packages]",
    "pacman = [",
    pacmanList,
    "]",
    "",
    "aur = [",
    aurList,
    "]",
    "",
    "[sources]",
    'include = ["./mimeapps.toml"]',
  ].join("\n");
}

/**
 * Generates default apps configuration template.
 * @param browser The browser desktop filename.
 * @returns The default apps configuration template.
 */
export function configDefaultAppsTemplate(browser: string): string {
  return [
    "[defaults.apps]",
    `browser = "${browser}"`,
  ].join("\n");
}

/**
 * Generates the MIME apps configuration template based on the user's MIME apps list.
 * @returns The MIME apps configuration template as a string.
 */
export async function configMimeAppsTemplate(): Promise<string> {
  const homeDir = await getHomeDirectory();
  const mimeAppsList = await parseMimeApps(`${homeDir}/.config/mimeapps.list`);

  const formatPairs = (record: Record<string, string>) =>
    Object.entries(record)
      .map(([key, val]) => `"${key}" = "${val}"`)
      .join("\n");

  return [
    "[defaults.mime.defaultApplications]",
    formatPairs(mimeAppsList.defaultApplications),
    "",
    "[defaults.mime.addedAssociations]",
    formatPairs(mimeAppsList.addedAssociations),
  ].join("\n");
}

/**
 * Generates Symlink configuration template based on the user's symlinks.
 * @returns The Symlink configuration template as a string.
 */
export async function configSymlinkTemplate(symlinks: Record<string, string>): Promise<string> {
  const symlinkConfig = Object.entries(symlinks)
    .map(([target, source]) => `"${target}" = "${source}"`)
    .join("\n");

  return [
    "[mkSymlink]",
    symlinkConfig,
  ].join("\n");
}

/**
 * Systemd Mount disk template
 * @returns The Systemd Mount disk configuration template as a string.
 */
export async function configMountDiskTemplate(
  mountPoint: string,
  diskOptions: MountDiskOptions,
): Promise<string> {
  const { description, uuid, type, options, wantedBy } = diskOptions;

  return [
    "[Unit]",
    `Description=${description}`,
    "",
    "[Mount]",
    `What=/dev/disk/by-uuid/${uuid}`,
    `Where=${mountPoint}`,
    `Type=${type}`,
    `Options=${options.join(",")}`,
    "",
    "[Install]",
    `WantedBy=${wantedBy}`,
  ].join("\n");
}
