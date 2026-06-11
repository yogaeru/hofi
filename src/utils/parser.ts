  import { resolve, dirname } from "path";
  import { type Config } from "#/lib/schema";
  
  type ConfigToml = Record<string, any>;
  
  /**
   * Parses a TOML configuration file and recursively merges included configs.
   *
   * @param path The path to the TOML file.
   * @param visited A set of visited file paths to detect circular dependencies.
   * @returns The parsed and merged configuration object.
   * @throws Error if a circular dependency is detected.
   */
  export async function parseConfigTOML(
    path: string,
    visited = new Set<string>(),
  ): Promise<any> {
    const abs = resolve(path);
  
    if (visited.has(abs)) {
      throw new Error(`Circular dependency detected: ${abs}`);
    }
  
    visited.add(abs);
    const content = await Bun.file(abs).text();
    const configFile = Bun.TOML.parse(content) as Config;
  
    const sources = configFile.sources?.include ?? Array.from([]);
    delete configFile.sources;
  
    let result = {};
  
    for (const include of sources) {
      const resolvedChildPath = resolve(dirname(abs), include);
      const childConfig = await parseConfigTOML(resolvedChildPath, visited);
      result = mergeConfig(result, childConfig);
    }
  
    return mergeConfig(result, configFile);
  }
  
  /**
   * Deep-merges two configuration objects, combining nested objects and overwriting arrays.
   *
   * @param oldResult The base configuration object.
   * @param newResult The configuration object to merge in.
   * @returns The merged configuration object.
   */
  function mergeConfig(oldResult: ConfigToml, newResult: ConfigToml): ConfigToml {
    const out = { ...oldResult };
  
    for (const key in newResult) {
      if (isPlainObject(out[key]) && isPlainObject(newResult[key])) {
        out[key] = mergeConfig(out[key], newResult[key]);
      } else {
        out[key] = newResult[key];
      }
    }
    return out;
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
