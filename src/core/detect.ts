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
};

async function isSudo(): Promise<boolean> {
  try {
    await $`sudo -n true`.quiet();
    return true;
  } catch {
    return false;
  }
}

export async function isSudoUser(): Promise<boolean> {
  return process.env.SUDO_USER !== undefined;
}

export async function runScan() {
  const [pacman, aurHelper, sudo] = await Promise.all([
    detectManagers.pacman(),
    detectManagers.aurHelper(),
    isSudo(),
  ]);

  return {
    pacman,
    aurHelper,
    sudo,
    checkedAt: new Date().toDateString(),
  };
}
