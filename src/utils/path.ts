import { $ } from "bun";
import { homedir } from "node:os";
import * as nodePath from "node:path";
import * as fs from "node:fs/promises";

export async function makeDir(path: string, sudo = false): Promise<void> {
  if (sudo) {
    await $`sudo mkdir -p ${path}`;
  } else {
    await fs.mkdir(path, { recursive: true });
  }
}

export async function removeDir(path: string, sudo = false): Promise<void> {
  if (sudo) {
    await $`sudo rmdir ${path}`;
  } else {
    await fs.rm(path);
  }
}

export async function removeFile(path: string, sudo = false): Promise<void> {
  if (sudo) {
    await $`sudo rm -f ${path}`;
  } else {
    await fs.rm(path, { force: true });
  }
}

/**
 * Gets the current working directory.
 *
 * @returns The absolute path of the current working directory.
 */
export async function getCurrentDirectory(): Promise<string> {
  return process.cwd();
}

/**
 * Gets the home directory path of the current user.
 *
 * @returns The absolute path to the home directory.
 */
export function getHomeDirectory(): string {
  return homedir();
}

/**
 * Checks if a directory exists at the given path.
 *
 * @param path The directory path to check.
 * @returns True if the directory exists, false otherwise.
 */
export async function isDirectoryExists(path: string): Promise<boolean> {
  try {
    const stat = await fs.stat(path);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Checks if a file exists at the given path.
 *
 * @param path The file path to check.
 * @returns True if the file exists, false otherwise.
 */
export async function isFileExists(path: string): Promise<boolean> {
  try {
    const stat = await fs.stat(path);
    return stat.isFile();
  } catch {
    return false;
  }
}

/**
 * Checks if a path exists (file, directory, symlink, etc.).
 *
 * @param path The path to check.
 * @returns True if the path exists, false otherwise.
 */
export async function exists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Archives a path by creating a backup of it and moving it to a `.bak` suffixed path.
 *
 * @param path The path to back up.
 * @returns The backup path on success, or an empty string if backup already exists or failed.
 */
export async function createBackupConfig(path: string) {
  const backupPath = `${path}.bak`;
  const existPath = await exists(backupPath);
  if (existPath) return "";

  await fs.rename(path, backupPath);
  return backupPath;
}

/**
 * Resolves a path by expanding `~` to the home directory,
 * or resolving `./` and `../` relative to the current directory.
 *
 * @param path The path to resolve (may start with `~`, `./`, or `../`).
 * @returns The resolved absolute path.
 */
export function resolvePath(path: string): string {
  if (path.startsWith("~")) {
    const homeDirectory = getHomeDirectory();
    return nodePath.resolve(path.replace(/^~/, homeDirectory));
  } else if (
    path.startsWith("./") ||
    path.startsWith("../") ||
    path === "." ||
    path === ".."
  ) {
    return nodePath.resolve(process.cwd(), path);
  }
  return nodePath.resolve(path);
  // return path;
}

/**
 * Gets the parent directory of a given path.
 *
 * @param path The path to get the parent directory for.
 * @returns The parent directory path.
 */
export function getParentDirectory(path: string): string {
  return nodePath.dirname(resolvePath(path));
}
/**
 * Gets the path to the configuration file within a given directory.
 * @param path The directory path to check for the configuration file.
 * @returns The path to the configuration file if it exists, otherwise throws an error.
 */
export async function getConfigPath(path: string): Promise<string> {
  const resolvedPath: string = resolvePath(path);
  const isPathExist: boolean = await exists(resolvedPath);
  if (!isPathExist) {
    throw new Error(`Path does not exist: ${resolvedPath}`);
  }
  // console.log(`Resolved path: ${resolvedPath}`);
  const configPath = `${resolvedPath}/config.toml`;
  return configPath;
}
