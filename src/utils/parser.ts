import { resolve, dirname } from "path";

type ConfigToml = Record<string, any>;

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
  const configFile = Bun.TOML.parse(content) as ConfigToml;

  const includes = configFile.include ?? [];
  delete configFile.include;

  let result = {};

  for (const include of includes) {
    const resolvedChildPath = resolve(dirname(abs), include);
    const childConfig = await parseConfigTOML(resolvedChildPath, visited);
    result = mergeConfig(result, childConfig);
  }

  return mergeConfig(result, configFile);
}

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

function isPlainObject(value: any): boolean {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
