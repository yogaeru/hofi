import { $ } from "bun";

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
    await $`test -d ${path}`;
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
    await $`test -f ${path}`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates a backup of a directory by appending `.bak` to its name.
 *
 * @param path The directory path to back up.
 * @returns The path to the backup directory.
 */
export async function backupDirectory(path: string) {
  const backupPath = `${path}.bak`;
  await $`mv -r ${path} ${backupPath}`;
  return backupPath;
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
