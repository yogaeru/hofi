import { isRunWithSudo } from "#/core/detect";
import { logger } from "#/utils/logger";

export function abortIfRunWithSudo() {
  if (isRunWithSudo()) {
    abort("Don't run as root. Please run the command as a regular user.");
  }
}

export function abort(message: string | Error | unknown): never {
  logger.error(message);
  process.exit(1);
}

export function tryAbort(message: string, callbackFn: () => any) {
  try {
    return callbackFn();
  } catch (error) {
    abort(message);
  }
}
