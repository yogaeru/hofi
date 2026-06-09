export interface MimeAppsConfig {
  defaultApplications: Record<string, string>;
  addedAssociations: Record<string, string[]>;
}

export interface MimeApps {
  defaultApplications: Record<string, string>;
  addedAssociations: Record<string, string>;
}

export type DefaultMimeApp = Partial<{
  browser: string;
  editor: string;
  image: string;
  video: string;
  audio: string;
}>;

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
 * Serializes the parsed mimeapps configuration back into a string format.
 * @param mimeapps - The parsed mimeapps configuration to serialize.
 * @returns The serialized string representation of the mimeapps configuration.
 */
export function serializeMimeApps(mimeapps: MimeApps): string {
  const lines: string[] = [];

  const { defaultApplications, addedAssociations } = mimeapps;

  if (Object.keys(defaultApplications).length > 0) {
    lines.push("[Default Applications]");

    for (const [mime, desktop] of Object.entries(
      mimeapps.defaultApplications,
    )) {
      lines.push(`${mime}=${desktop}`);
    }

    lines.push("");
  }

  if (Object.keys(addedAssociations).length > 0) {
    lines.push("[Added Associations]");

    for (const [mime, desktop] of Object.entries(mimeapps.addedAssociations)) {
      lines.push(`${mime}=${desktop};`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Mapping default app config into a mimeapps.list file format
 * @param defaultApp A partial object representing the default app configuration
 * @returns A string representing the mimeapps.list file content
 */
export async function resolveDefaultMimeApp(
  defaultApp: DefaultMimeApp,
  format: "object" | "string" = "object",
) {
  const mimeGroups = {
    browser: [
      "x-scheme-handler/http",
      "x-scheme-handler/https",
      "text/html",

      // document preview
      "application/pdf",

      // Office
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",

      // LibreOffice
      "application/vnd.oasis.opendocument.text",
      "application/vnd.oasis.opendocument.spreadsheet",
      "application/vnd.oasis.opendocument.presentation",
    ],

    editor: ["text/plain", "text/markdown", "text/csv", "application/json"],

    image: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/heic",
      "image/heif",
      "image/svg+xml",
    ],

    video: ["video/mp4", "video/x-matroska", "video/webm", "video/quicktime"],

    audio: [
      "audio/mpeg",
      "audio/flac",
      "audio/ogg",
      "audio/wav",
      "audio/mp4", // m4a
    ],
  };

  if (format === "string") {
    // Result Lines
    const mimeAppLines: string[] = ["[Default Applications]"];

    for (const [category, app] of Object.entries(defaultApp)) {
      if (!app) continue;
      mimeAppLines.push(`#${category}`);
      for (const mime of mimeGroups[category as keyof typeof mimeGroups]) {
        mimeAppLines.push(`${mime}=${app}`);
      }
    }

    return mimeAppLines.join("\n");
  }

  if (format === "object") {
    // Result Object
    const mimeAppObject: any = {};

    for (const [category, app] of Object.entries(defaultApp)) {
      if (!app) continue;
      for (const mime of mimeGroups[category as keyof typeof mimeGroups]) {
        mimeAppObject[mime] = app;
      }
    }
    return mimeAppObject;
  }
}
