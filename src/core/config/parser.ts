import { resolve, dirname } from "node:path";
import { type Config } from "./schema";

type ConfigToml = Record<string, any>;

/**
 * Parses a TOML configuration file and recursively merges included configs.
 *
 * @param filePath The path to the TOML file.
 * @param visitedPaths A set of visited file paths to detect circular dependencies.
 * @returns The parsed and merged configuration object.
 * @throws Error if a circular dependency is detected.
 */
export async function parseConfigTOML(
  filePath: string,
  visitedPaths = new Set<string>(),
): Promise<any> {
  const absoluteFilePath = resolve(filePath);

  if (visitedPaths.has(absoluteFilePath)) {
    throw new Error(`Circular dependency detected: ${absoluteFilePath}`);
  }

  visitedPaths.add(absoluteFilePath);
  const content = await Bun.file(absoluteFilePath).text();
  const parsedConfig = Bun.TOML.parse(content) as Config;

  const includedSources = parsedConfig.sources?.include ?? Array.from([]);
  delete parsedConfig.sources;

  let mergedParentConfigs = {};

  for (const includedPath of includedSources) {
    const absoluteChildPath = resolve(dirname(absoluteFilePath), includedPath);
    const parsedChildConfig = await parseConfigTOML(absoluteChildPath, visitedPaths);
    mergedParentConfigs = mergeConfig(mergedParentConfigs, parsedChildConfig);
  }

  return mergeConfig(mergedParentConfigs, parsedConfig);
}

/**
 * Deep-merges two configuration objects, combining nested objects and overwriting arrays.
 *
 * @param baseConfig The base configuration object.
 * @param incomingConfig The configuration object to merge in.
 * @returns The merged configuration object.
 */
function mergeConfig(baseConfig: ConfigToml, incomingConfig: ConfigToml): ConfigToml {
  const mergedResult = { ...baseConfig };

  for (const configKey in incomingConfig) {
    if (isPlainObject(mergedResult[configKey]) && isPlainObject(incomingConfig[configKey])) {
      mergedResult[configKey] = mergeConfig(mergedResult[configKey], incomingConfig[configKey]);
    } else {
      mergedResult[configKey] = incomingConfig[configKey];
    }
  }
  return mergedResult;
}

/**
 * Checks if a value is a plain JavaScript object (not null, not an array).
 *
 * @param value The value to check.
 * @returns True if the value is a plain object, false otherwise.
 */
function isPlainObject(value: any): boolean {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
