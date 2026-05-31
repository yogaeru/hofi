export interface MimeAppsConfig {
  defaultApplications: Record<string, string>;
  addedAssociations: Record<string, string[]>;
}

/**
 * Parses a mimeapps.list file into a structured object
 * @param filePath - Path to the mimeapps.list file
 * @returns Parsed configuration with defaultApplications and addedAssociations
 */
export async function parseMimeApps(filePath: string): Promise<MimeAppsConfig> {
  const content = await Bun.file(filePath).text();
  const lines = content.split("\n");

  const config: MimeAppsConfig = {
    defaultApplications: {},
    addedAssociations: {},
  };

  let currentSection: keyof MimeAppsConfig | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    // Detect section headers
    if (trimmed === "[Default Applications]") {
      currentSection = "defaultApplications";
      continue;
    }

    if (trimmed === "[Added Associations]") {
      currentSection = "addedAssociations";
      continue;
    }

    // Skip if we're not in a valid section
    if (!currentSection) {
      continue;
    }

    // Parse key-value pairs
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) {
      continue;
    }

    const key = trimmed.substring(0, eqIndex).trim();
    const value = trimmed.substring(eqIndex + 1).trim();

    if (!key || !value) {
      continue;
    }

    if (currentSection === "defaultApplications") {
      config.defaultApplications[key] = value;
    } else if (currentSection === "addedAssociations") {
      // Remove trailing semicolon if present
      const cleanValue = value.endsWith(";") ? value.slice(0, -1) : value;
      // Split by semicolon for multiple associations
      const apps = cleanValue
        .split(";")
        .map((v) => v.trim())
        .filter(Boolean);
      config.addedAssociations[key] = apps;
    }
  }

  return config;
}

/**
 * Merges defaultApplications and addedAssociations into a single key-value object
 * @param config - Parsed MimeAppsConfig
 * @returns Combined key-value pairs object
 */
export function mergeApplications(
  config: MimeAppsConfig,
): Record<string, string> {
  const merged: Record<string, string> = { ...config.defaultApplications };

  // Override with added associations (taking the first one if multiple)
  for (const [key, apps] of Object.entries(config.addedAssociations)) {
    if (apps.length > 0) {
      if (!apps[0]) continue;
      merged[key] = apps[0];
    }
  }

  return merged;
}

/**
 * Convenience function to parse and merge in one step
 * @param filePath - Path to the mimeapps.list file
 * @returns Combined key-value pairs object
 */
export async function parseMimeAppsMerged(
  filePath: string,
): Promise<Record<string, string>> {
  const config = await parseMimeApps(filePath);
  return mergeApplications(config);
}
