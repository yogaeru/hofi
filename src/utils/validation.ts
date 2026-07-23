import { $ } from "bun";
import { logger } from "./logger";
import { exists, resolvePath } from "./path";
import type { Symlink } from "#/core/config/schema";
import type { MountDiskConfig, MountDiskOptions } from "#/core/mount";

type AurHelper = "yay" | "paru" | "pikaur" | null;
type PackageManager = AurHelper | "pacman" | "flatpak";

/**
 * Validates the symlink configuration.
 * @param config pair of target and symlink paths
 * @throws {Error} if the target and symlink are the same, or if the target does not exist
 */
export async function validateSymlink(config: Symlink | undefined) {
  if (!config) return;
  const errMsg = (
    await Promise.all(
      Object.entries(config).map(async ([_, { target, link }]) => {
        const [resolvedTarget, resolvedSymlink] = await Promise.all([
          resolvePath(target),
          resolvePath(link),
        ]);

        if (resolvedTarget === resolvedSymlink)
          throw new Error(
            `Target and symlink cannot be the same: ${target} -> ${link}`,
          );

        const isTargetExist = await exists(resolvedTarget);
        if (!isTargetExist) return ` - ${target}`;
      }),
    )
  ).filter(Boolean);

  if (errMsg.length > 0) {
    throw new Error(`Target does not exist: ${errMsg.join("\n")}`);
  }
  logger.info(`Validation symlink passed`);
}

/**
 * Validates the packages.
 * @param packages list of package names
 * @param packageManager package manager to use
 * @throws {Error} if any package is not found
 */
export async function validatePackages(
  packages: string[] | undefined,
  packageManager: PackageManager,
): Promise<void> {
  if (!packages) return;
  if(!packageManager) return;

  const errorMsg: string[] = [];

  if (packageManager === "flatpak") {
    const remotePackages: string =
      await $`flatpak remote-ls flathub --columns=application`.quiet().text();
    const packagesSet = new Set(remotePackages.split("\n").filter(Boolean));

    for (const name of packages) {
      const packageExists: boolean = packagesSet.has(name.trim());
      if (!packageExists) errorMsg.push(` -> ${name}`);
    }
  } else {
    const repoPackages: string = await $`${packageManager} -Slq`.quiet().text();
    const packagesSet = new Set(repoPackages.split("\n"));

    for (const name of packages) {
      const packageExists: boolean = packagesSet.has(name.trim());
      if (!packageExists) errorMsg.push(` -> ${name}`);
    }
  }

  if (errorMsg.length > 0) {
    throw new Error(`Packages not found:\n${errorMsg.join("\n")}`);
  }
  logger.info(
    `Validation packages (${packageManager}) passed ${packages.length} packages`,
  );
}

/**
 * Validates the mount disk configuration.
 * @param config
 * @throws {Error} if the mount point already exists
 */
export async function validateMountDisk(config: MountDiskConfig | undefined) {
  if (!config) return;

  // Collected Error Messages
  const errorMsg: string[] = [];

  const UUIDMap: Record<string, string> = await getUUID();
  const UUID: string[] = Object.values(UUIDMap);

  await Promise.all(
    Object.entries(config).map(
      async ([mountPoint, options]: [string, MountDiskOptions]) => {
        const resolvedMountPoint: string = resolvePath(mountPoint);
        const { uuid } = options;

        const isUUIDValid: boolean = UUID.includes(uuid);
        // const isMountPointExist: boolean = await exists(resolvedMountPoint);

        if (!isUUIDValid) errorMsg.push(`UUID not found for ${mountPoint}`);
        // if (isMountPointExist) errorMsg.push(`${mountPoint} already exists`);
      },
    ),
  );

  if (errorMsg.length > 0) {
    throw new Error(`Mount Drive validation failed: ${errorMsg.join("\n")}`);
  }
  logger.info(`Validation drive mount passed`);
}

/**
 * Retrieves the UUID of each block device and returns a map of device names to UUIDs.
 * @returns A Promise that resolves to a Record of device names to UUIDs.
 */
async function getUUID(): Promise<Record<string, string>> {
  const output: string = await $`lsblk -f -J`.quiet().text();
  const json = JSON.parse(output);

  const uuidMap: Record<string, string> = {};

  for (const device of json.blockdevices) {
    if (!device.children) continue;

    for (const child of device.children) {
      uuidMap[child.name] = child.uuid;
    }
  }

  return uuidMap;
}
