import { hostname } from "node:os";
import { dirname } from "node:path";
import { exists } from "#/utils/path";
import { writeFile } from "#/utils/write";
import type { Config } from "#/core/config/schema";
import type { DetectResult } from "#/core/detect";
import type { ConfigDiff } from "#/utils/diff";

export type Metadata = {
  generatedAt: string;
  hostname: string;
  configFile: string;
  environment: DetectResult;
  config: Config;
};

/**
 * Generates a JSON metadata document describing the applied configuration state.
 *
 * @param config - The parsed configuration that was applied.
 * @param env - The detected system environment.
 * @param configPath - The path to the config file that was applied.
 * @returns The formatted JSON string.
 */
function generateMetadataJson(
  config: Config | ConfigDiff,
  env: DetectResult,
  configPath: string,
): string {
  const metadata = {
    generatedAt: new Date().toLocaleString(),
    hostname: hostname(),
    configFile: configPath,
    environment: {
      ...env,
    },
    config: {
      ...config,
    },
  };

  return JSON.stringify(metadata, null, 2) + "\n";
}

/**
 * Generates and writes the metadata JSON file to the default location
 * (`~/.config/hofi/metadata.json`).
 *
 * @param config - The parsed configuration that was applied.
 * @param env - The detected system environment.
 * @param configPath - The path to the config file that was applied.
 */
export async function writeMetadata(
  config: Config,
  env: DetectResult,
  configPath: string,
): Promise<void> {
  const jsonFileData = `${generateMetadataJson(config, env, configPath)}`;

  const outputPath = `${dirname(configPath)}/hofi.json`;
  await writeFile(jsonFileData, outputPath);
}

// load metadata
export async function readMetadata(path: string): Promise<Config> {
  const isExist = await exists(path);
  if (!isExist) return {};
  const content = await Bun.file(path).text();
  const metadata = Bun.JSONC.parse(content) as Metadata;
  return metadata.config;
}
