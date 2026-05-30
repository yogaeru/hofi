import {$} from "bun"

export async function getCurrentDirectory(): Promise<string> {
  const result = await $`pwd`.quiet().text();
  return result
}