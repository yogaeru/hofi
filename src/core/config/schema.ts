import { z } from "zod";

// ── User ──
const userSchema = z
  .object({
    name: z.string(),
    homeDir: z.string(),
  })
  .partial();

// ── Packages ──
const flatpakSchema = z
  .object({
    user: z.array(z.string()),
    system: z.array(z.string()),
  })
  .partial();

const packagesSchema = z
  .object({
    pacman: z.array(z.string()),
    aur: z.array(z.string()),
    flatpak: flatpakSchema,
  })
  .partial();

// ── Defaults ──
const appsSchema = z
  .object({
    browser: z.string(),
    editor: z.string(),
    video: z.string(),
    image: z.string(),
    audio: z.string(),
  })
  .partial();

const mimeSchema = z
  .object({
    defaultApplications: z.record(z.string(), z.string()),
    addedAssociations: z.record(z.string(), z.string()),
  })
  .partial();

const defaultsSchema = z
  .object({
    apps: appsSchema,
    mime: mimeSchema,
  })
  .partial();

// ── Mount Drive ──
const mountDriveSchema = z.record(
  z.string(), // mount point (mis. "/mnt/data")
  z.object({
    description: z.string(),
    uuid: z.string(),
    type: z.enum([
      "ext4",
      "btrfs",
      "xfs",
      "f2fs",
      "vfat",
      "exfat",
      "ntfs3",
      "ntfs",
      "tmpfs",
    ]),
    options: z.array(z.string()),
    wantedBy: z.string(),
  }),
);

// ── Includes ──
const includesSchema = z.array(z.string());

// ── Symlink ──
const symlinkSchema = z.record(
  z.string(),
  z.object({
    target: z.string(),
    link: z.string(),
  }),
);

// ── Merge ──
export const ConfigSchema = z
  .object({
    user: userSchema,
    packages: packagesSchema,
    defaults: defaultsSchema,
    mounts: mountDriveSchema,
    includes: includesSchema,
    symlink: symlinkSchema,
  })
  .partial()
  .strict();

export type Config = z.infer<typeof ConfigSchema>;

// ── Inferred types ──
export type User = z.infer<typeof userSchema>;
export type Flatpak = z.infer<typeof flatpakSchema>;
export type Packages = z.infer<typeof packagesSchema>;
export type Apps = z.infer<typeof appsSchema>;
export type Mime = z.infer<typeof mimeSchema>;
export type Defaults = z.infer<typeof defaultsSchema>;
export type MountDrive = z.infer<typeof mountDriveSchema>;
export type Includes = z.infer<typeof includesSchema>;
export type Symlink = z.infer<typeof symlinkSchema>;
