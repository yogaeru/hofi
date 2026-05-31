import { $ } from "bun";
import { resolve, dirname } from "path";

export async function getCurrentDirectory(): Promise<string> {
  const result = (await $`pwd`.quiet().text())
    .replaceAll("\n", "");
  return result;
}

export function resolvePath(path: string): string {
  return resolve(path);
}


export function getParentDirector(path: string): string {
  return dirname(resolve(path));
}

export async function getHomeDirectory(): Promise<string> {
  return (await $`echo ~`.quiet().text())
    .replaceAll("\n", "");
}

export async function resolveHomePath(path: string): Promise<string> {
  const homeDirectory = await getHomeDirectory();
  if (path.startsWith("~")) {
    const resolvedPath = path.replace("~", homeDirectory);
    return resolvedPath;
  }
  return path;
}
