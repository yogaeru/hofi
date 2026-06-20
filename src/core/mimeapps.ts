// Mime type groups mapping for default apps
const MIME_GROUPS = {
  browser: [
    "x-scheme-handler/http",
    "x-scheme-handler/https",
    "text/html",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
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
} as const;

type MimeGroupKey = keyof typeof MIME_GROUPS;
type Mimes = (typeof MIME_GROUPS)[MimeGroupKey][number];

export interface MimeApps {
  defaultApplications: Record<string, string>;
  addedAssociations: Record<string, string>;
}

export type DefaultMimeApps = Partial<{
  browser: string;
  editor: string;
  image: string;
  video: string;
  audio: string;
}>;

/**
 * Parses a mimeapps.list file into a structured object.
 * Returns an empty structure if the file does not exist.
 *
 * @param filePath - Path to the mimeapps.list file
 * @returns Parsed configuration with defaultApplications and addedAssociations
 */
export async function parseMimeApps(filePath: string): Promise<MimeApps> {
  const mimeAppsConfig: MimeApps = {
    defaultApplications: {},
    addedAssociations: {},
  };

  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    return mimeAppsConfig;
  }

  const content = await file.text();
  const lines = content.split("\n");
  let activeSection: keyof MimeApps | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    // Detect section headers
    if (trimmedLine === "[Default Applications]") {
      activeSection = "defaultApplications";
      continue;
    }

    if (trimmedLine === "[Added Associations]") {
      activeSection = "addedAssociations";
      continue;
    }

    // Skip if we're not in a valid section
    if (!activeSection) {
      continue;
    }

    // Parse key-value pairs
    const equalSignIndex = trimmedLine.indexOf("=");
    if (equalSignIndex === -1) {
      continue;
    }

    const key = trimmedLine.substring(0, equalSignIndex).trim();
    // Trim potential trailing semicolon commonly found in added associations
    const value = trimmedLine
      .substring(equalSignIndex + 1)
      .trim()
      .replace(/;$/, "");

    if (!key || !value) {
      continue;
    }

    mimeAppsConfig[activeSection][key] = value;
  }

  return mimeAppsConfig;
}

/**
 * Serializes the parsed mimeapps configuration back into a string format.
 *
 * @param mimeAppsConfig - The parsed mimeapps configuration to serialize.
 * @returns The serialized string representation of the mimeapps configuration.
 */
export function serializeMimeApps(mimeAppsConfig: MimeApps): string {
  const serializedLines: string[] = [];
  const { defaultApplications, addedAssociations } = mimeAppsConfig;

  if (Object.keys(defaultApplications).length > 0) {
    serializedLines.push("[Default Applications]");
    for (const [mimeType, desktopFile] of Object.entries(defaultApplications)) {
      serializedLines.push(`${mimeType}=${desktopFile}`);
    }
    serializedLines.push("");
  }

  if (Object.keys(addedAssociations).length > 0) {
    serializedLines.push("[Added Associations]");
    for (const [mimeType, desktopFile] of Object.entries(addedAssociations)) {
      serializedLines.push(`${mimeType}=${desktopFile};`);
    }
    serializedLines.push("");
  }

  return serializedLines.join("\n");
}

/**
 * Mapping default app config into a mimeapps.list file format
 *
 * @param defaultAppsConfig A partial object representing the default app configuration
 * @param outputFormat The return format: "object" (Record) or "string" (serialized format)
 * @returns The resolved mimeapps mapping
 */
export async function resolveDefaultMimeApp(
  defaultAppsConfig: DefaultMimeApps,
  outputFormat: "object" | "string" = "object",
): Promise<Record<string, string>| string> {
  if (outputFormat === "string") {
    const mimeAppLines: string[] = ["[Default Applications]"];

    for (const [appCategory, desktopFile] of Object.entries(
      defaultAppsConfig,
    )) {
      if (!desktopFile) continue;
      mimeAppLines.push(`# ${appCategory}`);
      const mimes: readonly Mimes[] =
        MIME_GROUPS[appCategory as MimeGroupKey] || [];
      for (const mimeType of mimes) {
        mimeAppLines.push(`${mimeType}=${desktopFile}`);
      }
    }

    return mimeAppLines.join("\n");
  }

  const mimeAppObject: Record<string, string> = {};
  for (const [appCategory, desktopFile] of Object.entries(defaultAppsConfig)) {
    if (!desktopFile) continue;
    const mimes: readonly Mimes[] =
      MIME_GROUPS[appCategory as MimeGroupKey] || [];
    for (const mimeType of mimes) {
      mimeAppObject[mimeType] = desktopFile;
    }
  }

  return mimeAppObject;
}
