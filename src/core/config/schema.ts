import { z } from "zod";

export const ConfigSchema = z
  .object({
    user: z
      .object({
        name: z.string(),
        homeDir: z.string(),
      })
      .partial(),

    packages: z
      .object({
        pacman: z.array(z.string()),
        aur: z.array(z.string()),
        flatpak: z.array(z.string()),
      })
      .partial()
      .optional(),

    defaults: z
      .object({
        apps: z
          .object({
            browser: z.string(),
            editor: z.string(),
            video: z.string(),
            image: z.string(),
            audio: z.string(),
          })
          .partial(),

        mime: z
          .object({
            defaultApplications: z.record(z.string(), z.string()),
            addedAssociations: z.record(z.string(), z.string()),
          })
          .partial(),
      })
      .partial(),

    mkSymlink: z.record(
      z.string(), // source path
      z.string(), // target path
    ),

    mountDrive: z.record(
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
    ),
    includes: z.array(z.string()),
    symlink: z.record(
      z.string(),
      z.object({
        source: z.string(),
        target: z.string(),
      }),
    ),
  })
  .partial();

export type Config = z.infer<typeof ConfigSchema>;
