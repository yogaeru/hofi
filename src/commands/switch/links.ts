import { makeSymlink, removeSymlink } from "#/core/symlink";
import type { ConfigDiff } from "#/utils/diff";

type SwitchLink = ConfigDiff["symlinks"];

export async function switchSymlink(linkConfig: SwitchLink) {
  if (!linkConfig) return;
  const { added, removed } = linkConfig;
  
  await makeSymlink(added);
  await removeSymlink(removed);
}
