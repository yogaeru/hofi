import { $ } from "bun";

async function commandExists(command: string): Promise<boolean> {
  try {
    await $`which ${command}`.quiet();
    return true;
  } catch {
    return false;
  }
}

export const detectManagers = {
  pacman: async () => {
    return commandExists("pacman");
  },
  aurHelper: async () => {
    for (const helper of ["yay", "paru", "pikaur"]) {
      if (await commandExists(helper)) {
        return helper;
      }
    }
    return null;
  },
  sudo: async () => {
    try {
      await $`sudo -n true`.quiet();
      return true;
    } catch {
      return false;
    }
  },
};


export async function runDoctor() {
  const [pacman, aurHelper, sudo] = await Promise.all([
    detectManagers.pacman(),
    detectManagers.aurHelper(),
    detectManagers.sudo(),
  ]);

  return {
    pacman,
    aurHelper,
    sudo,
    checkedAt: new Date().toDateString(),
  };
}
