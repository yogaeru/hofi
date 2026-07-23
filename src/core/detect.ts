import { $ } from "bun";
import * as fs from "node:fs/promises";
import { exists } from "#/utils/path";
import { logger } from "#/utils/logger";
import { setHofiEnv } from "./env";

export type DetectResult = {
  os: string;
  initSystem: "systemd" | "openrc" | "runit" | "sysvinit" | "unknown";
  pacman: boolean;
  aurHelper: "paru" | "yay" | "pikaur" | null;
  flatpak: boolean;
  sudo: {
    available: boolean;
    passwordless: boolean;
    isRoot: boolean;
  };
  checkedAt: string;
};

async function commandExists(command: string): Promise<boolean> {
  try {
    await $`which ${command}`.quiet();
    return true;
  } catch {
    return false;
  }
}

async function isPacman(): Promise<boolean> {
  return commandExists("pacman");
}

async function isFlatpak(): Promise<boolean> {
  return commandExists("flatpak");
}

async function isAurHelper(): Promise<DetectResult["aurHelper"]> {
  const helpers: string[] = [];
  for (const helper of ["yay", "paru", "pikaur"]) {
    if (await commandExists(helper)) {
      helpers.push(helper);
      logger.info(`Detected AUR Helper: ${helper}`);
    }
  }
  if (helpers.includes("paru")) return "paru";
  if (helpers.includes("yay")) return "yay";
  if (helpers.includes("pikaur")) return "pikaur";
  return null;
}

async function getSudoInfo() {
  const available = await commandExists("sudo");
  let passwordless = false;
  if (available) {
    try {
      await $`sudo -n true`.quiet();
      passwordless = true;
    } catch {}
  }
  const isRoot = process.getuid?.() === 0;
  return { available, passwordless, isRoot };
}

export function isRunWithSudo(): boolean {
  return process.getuid?.() === 0;
}

async function getOSName(): Promise<string> {
  let name = "Unknown";
  try {
    if (await exists("/etc/os-release")) {
      const content = await fs.readFile("/etc/os-release", "utf-8");
      const lines = content.split("\n");
      for (const line of lines) {
        const match = line.match(/^NAME=(.*)$/);
        if (match) {
          let val = match[1] ? match[1].trim() : "";
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.substring(1, val.length - 1);
          } else if (val.startsWith("'") && val.endsWith("'")) {
            val = val.substring(1, val.length - 1);
          }
          name = val;
          break;
        }
      }
    }
  } catch {}
  return name;
}

async function getInitSystem(): Promise<DetectResult["initSystem"]> {
  if (await exists("/run/systemd/system")) {
    return "systemd";
  }
  if (await exists("/run/openrc")) {
    return "openrc";
  }
  if (await exists("/run/runit")) {
    return "runit";
  }
  return "unknown";
}

export async function runScan(): Promise<DetectResult> {
  const [os, initSystem, pacman, aurHelper, flatpak, sudo] = await Promise.all([
    getOSName(),
    getInitSystem(),
    isPacman(),
    isAurHelper(),
    isFlatpak(),
    getSudoInfo(),
  ]);

  setHofiEnv("isFlatpak", flatpak);
  setHofiEnv("helperAur", aurHelper);

  return {
    os,
    initSystem,
    pacman,
    aurHelper,
    flatpak,
    sudo,
    checkedAt: new Date().toString(),
  };
}
