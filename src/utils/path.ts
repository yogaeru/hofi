import { $ } from "bun";
import { resolve, dirname } from "path";

export async function getCurrentDirectory(): Promise<string> {
  const result = (await $`pwd`.quiet().text()).replaceAll("\n", "");
  return result;
}

export function getParentDirectory(path: string): string {
  return dirname(resolve(path));
}

export async function getHomeDirectory(): Promise<string> {
  const user = await $`echo $USER`.quiet().text();
  return `/home/${user.replaceAll("\n", "")}`;
}

export async function isDirectoryExists(path: string): Promise<boolean> {
  const result = (await $`test -d ${path}`.quiet().text()).replace("\n", "");
  return result !== "";
}

export async function isFileExists(path: string): Promise<boolean> {
  const result = (await $`test -f ${path}`.quiet().text()).replace("\n", "");
  return result !== "";
}

export async function backupDirectory(path: string) {
  const backupPath = `${path}.bak`;
  await $`mv -r ${path} ${backupPath}`;
  return backupPath;
}

export async function resolveHomePath(path: string): Promise<string> {
  const homeDirectory = await getHomeDirectory();
  if (path.startsWith("~")) {
    const resolvedPath = path.replace("~", homeDirectory);
    return resolvedPath;
  }
  return path;
}

export async function resolvePath(path: string) {
  if (path === ".") {
    return resolve(path);
  }

  const resolvedPath = await resolveHomePath(path);
  return resolvedPath;
}
