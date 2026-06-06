import { mkdir, access, writeFile } from "fs/promises";
import { logger } from "./logger";
import { getCurrentDirectory } from "./path";

export async function createDirectoryConfig() {
  const currentPath = await getCurrentDirectory();
  const configPath = `${currentPath}/.v1`;

  try {
    await access(configPath);
  } catch {
    await mkdir(configPath, { recursive: true });
  }
}

export async function createFileConfig(data: any, path?:string) {
  const currentPath = await getCurrentDirectory();
  const configPath = `${currentPath}/${path ?? "config.toml"}`;

  logger.info(String(typeof data))

  try {
    await Bun.write(configPath, data);
    logger.success("Config file created successfully");
    logger.info(`Config file created at ${configPath}`)
  } catch (e) {
    logger.error(String(e));
  }
}

export async function createFile(data: any, path: string) {
  logger.info(`Creating New File in ${path}`);
  
  try {
    await Bun.write(path, data);
    logger.success(`File created successfully at ${path}`);
  } catch (e) {
    logger.error(String(e));
  }
}