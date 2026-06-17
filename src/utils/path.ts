import { $ } from "bun";
import { mkdir, symlink, rename } from "node:fs/promises";

/**
 * Gets the current working directory.
 *
 * @returns The absolute path of the current working directory.
 */
export async function getCurrentDirectory(): Promise<string> {
  const result = (await $`pwd`.quiet().text()).replaceAll("\n", "");
  return result;
}

/**
 * Gets the home directory path of the current user.
 *
 * @returns The absolute path to the home directory.
 */
export async function getHomeDirectory(): Promise<string> {
  const user = await $`echo $USER`.quiet().text();
  return `/home/${user.replaceAll("\n", "")}`;
}

/**
 * Checks if a directory exists at the given path.
 *
 * @param path The directory path to check.
 * @returns True if the directory exists, false otherwise.
 */
export async function isDirectoryExists(path: string): Promise<boolean> {
  try {
    await $`[ -d ${path} ]`;
    return true;
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
    await $`[ -f ${path} ]`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a path exists.
 * @param path
 * @returns
 */
export async function exists(path: string): Promise<boolean> {
  try {
    await $`[ -e ${path} ]`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Archives a path by creating a backup of it and moving it to a `.bak` suffixed path.
 *
 * @param path The path to back up.
 * @returns The path to the .
 */
export async function createBackupConfig(path: string) {
  const backupPath = `${path}.bak`;
  const existPath = await exists(backupPath);
  if (existPath) return "";

  try {
    await $`mv ${path} ${backupPath}`;
    return backupPath;
  } catch {
    return "";
  }
}

/**
 * Resolves a path by expanding `~` to the home directory or `.` to the current directory.
 *
 * @param path The path to resolve (may start with `~` or `.`).
 * @returns The resolved absolute path.
 */
export async function resolvePath(path: string): Promise<string> {
  if (path.startsWith("~")) {
    const homeDirectory = await getHomeDirectory();
    const resolvedPath = path.replace("~", homeDirectory);
    return resolvedPath;
  } else if (path.startsWith(".")) {
    const currentDirectory = await getCurrentDirectory();
    return path.replace(".", currentDirectory);
  }
  return path;
}
/**
 * Gets the path to the configuration file within a given directory.
 * @param path The directory path to check for the configuration file.
 * @returns The path to the configuration file if it exists, otherwise throws an error.
 */
export async function getConfigPath(path: string): Promise<string> {
  const resolvedPath: string = await resolvePath(path);
  const isPathExist: boolean = await exists(resolvedPath);
  if (!isPathExist) {
    throw new Error(`Path does not exist: ${resolvedPath}`);
  }
  console.log(`Resolved path: ${resolvedPath}`);
  const configPath = `${resolvedPath}/config.toml`;
  return configPath;
}
